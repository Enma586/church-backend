import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { AppError } from "../../utils/AppError.js";
import { getIO } from "../../config/socket.js";

const execPromise = util.promisify(exec);

/**
 * Emite un evento de socket a todos los clientes conectados.
 * Envuelve getIO() en try/catch para no romper si Socket.IO no está inicializado.
 */
const emitBackupEvent = (event, payload) => {
  try {
    const io = getIO();
    io.emit(event, payload);
  } catch {
    console.warn(
      `[Backup] No se pudo emitir evento "${event}" — Socket.IO no disponible`
    );
  }
};

/**
 * @param {Object|null} outputStream - Stream de respuesta (res) para descarga directa por HTTP.
 *                                    null si es respaldo automático (solo dump, sin ZIP).
 * @param {Object|null} config - Objeto de configuración con backupFrequencyDays y lastBackupDate.
 */
export const createAndZipBackup = async (outputStream, config = null) => {
  const startTime = Date.now();

  // 1. Regla de Negocio: Validar frecuencia de respaldos (solo para automático)
  if (config && config.lastBackupDate) {
    const diffTime = Math.abs(new Date() - new Date(config.lastBackupDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < config.backupFrequencyDays) {
      console.log(
        `Respaldo omitido: solo han pasado ${diffDays} días, la frecuencia es de ${config.backupFrequencyDays}`
      );
      emitBackupEvent("backup:skipped", {
        reason: "frequency_not_met",
        daysSinceLastBackup: diffDays,
        configuredFrequencyDays: config.backupFrequencyDays,
        lastBackupDate: config.lastBackupDate,
      });
      return;
    }
  }

  const date = new Date().toISOString().split("T")[0];
  const backupDir =
    process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
  const folderName = `backup_${date}`;
  const backupPath = path.join(backupDir, folderName);

  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  emitBackupEvent("backup:started", {
    date,
    folderName,
    manual: !!outputStream,
  });

  try {
    // ── Fase 1: mongodump ──
    emitBackupEvent("backup:progress", {
      phase: "mongodump",
      message: "Realizando dump de la base de datos...",
      date,
    });

    const command = `mongodump --uri="${process.env.MONGO_URI}" --out="${backupPath}"`;
    await execPromise(command);

    // ── Fase 2: Empaquetado ZIP (solo para descarga manual) ──
    if (outputStream) {
      // outputStream.attachment(`respaldo_parroquia_${date}.zip`);

      emitBackupEvent("backup:progress", {
        phase: "compressing",
        message: "Comprimiendo archivos de respaldo...",
        date,
      });

      await new Promise((resolve, reject) => {
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.on("error", (err) => {
          reject(new AppError(`Error al comprimir: ${err.message}`, 500));
        });

        outputStream.on("close", resolve);
        outputStream.on("error", (err) => {
          reject(
            new AppError(`Error en descarga: ${err.message}`, 500)
          );
        });

        archive.pipe(outputStream);
        archive.directory(backupPath, folderName);
        archive.finalize();
      });
    }

    // ── Fase 3: Limpieza ──
    emitBackupEvent("backup:progress", {
      phase: "cleanup",
      message: "Limpiando archivos temporales...",
      date,
    });

    fs.rmSync(backupPath, { recursive: true, force: true });

    // ── Éxito ──
    const durationMs = Date.now() - startTime;
    emitBackupEvent("backup:completed", {
      date,
      folderName,
      durationMs,
      manual: !!outputStream,
      message: outputStream
        ? "Respaldo descargado exitosamente"
        : "Respaldo automático completado en el servidor",
    });

    console.log(
      `[Backup] Respaldo completado en ${(durationMs / 1000).toFixed(1)}s`
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error("Error en backup:", error);

    emitBackupEvent("backup:error", {
      date,
      folderName,
      durationMs,
      message: error.message || "Falló la generación del respaldo",
    });

    // Limpiar carpeta temporal si existe (evitar basura en disco)
    try {
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
    } catch {
      // ignorar error de limpieza
    }

    throw new AppError(error.message || "Falló la generación del respaldo", 500);
  }
};