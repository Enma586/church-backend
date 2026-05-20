import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { AppError } from "../../utils/AppError.js";
import { getIO } from "../../config/socket.js";
import { uploadToGoogleDrive } from "./GoogleDrive.js";   

const execPromise = util.promisify(exec);

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

export const createAndZipBackup = async (outputStream, config = null) => {
  const startTime = Date.now();
  const isManual = !!outputStream;

  // 1. Validar frecuencia (solo automático)
  if (config && config.lastBackupDate && !isManual) {
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
  const zipName = `respaldo_parroquia_${date}.zip`;
  const zipPath = path.join(backupDir, zipName);

  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  emitBackupEvent("backup:started", {
    date,
    folderName,
    manual: isManual,
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

    emitBackupEvent("backup:progress", {
      phase: "compressing",
      message: "Comprimiendo archivos de respaldo...",
      date,
    });

    // ── Fase 2: Empaquetado ZIP ──
await new Promise((resolve, reject) => {
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("error", (err) => {
    reject(new AppError(`Error al comprimir: ${err.message}`, 500));
  });

  if (isManual) {
    // Manual: pipe al response Y escribir a disco para Drive
    const fileStream = fs.createWriteStream(zipPath);
    let streamsClosed = 0;
    const onClose = () => { streamsClosed++; if (streamsClosed === 2) resolve(); };

    outputStream.on("close", onClose);
    outputStream.on("error", (err) =>
      reject(new AppError(`Error en descarga: ${err.message}`, 500))
    );
    fileStream.on("close", onClose);
    fileStream.on("error", (err) =>
      reject(new AppError(`Error escribiendo ZIP: ${err.message}`, 500))
    );

    archive.pipe(outputStream);
    archive.pipe(fileStream);
  } else {
    // Automático: solo a disco
    const fileStream = fs.createWriteStream(zipPath);
    fileStream.on("close", resolve);
    fileStream.on("error", (err) =>
      reject(new AppError(`Error escribiendo ZIP: ${err.message}`, 500))
    );
    archive.pipe(fileStream);
  }

  archive.directory(backupPath, folderName);
  archive.finalize();
});

 //FASE 3 SUBIR A GOOGLE DRIVE
    let driveUploaded = false;
const hasDriveConfig =
  process.env.GOOGLE_DRIVE_ID &&
  process.env.GOOGLE_CLIENT_EMAIL &&
  process.env.GOOGLE_PRIVATE_KEY;

if (hasDriveConfig) {
  try {
    emitBackupEvent("backup:progress", {
      phase: "uploading_drive",
      message: "Subiendo respaldo a Google Drive...",
      date,
    });
    const driveResult = await uploadToGoogleDrive(zipPath, zipName);
    driveUploaded = true;
    console.log(`[Backup] Subido a Google Drive: ${driveResult.webViewLink}`);
  } catch (driveError) {
    console.error("[Backup] Error subiendo a Drive:", driveError.message);
    console.error("[Backup] El archivo ZIP se conserva en:", zipPath);
  }
} else {
  console.log("[Backup] Google Drive no configurado. ZIP en:", zipPath);
}

    // ── Fase 4: Limpieza de carpeta temporal ──
    emitBackupEvent("backup:progress", {
      phase: "cleanup",
      message: "Limpiando archivos temporales...",
      date,
    });

    // Limpiar carpeta del dump (siempre)
    fs.rmSync(backupPath, { recursive: true, force: true });

    // Solo borrar ZIP local si se subió exitosamente a Drive
    if (driveUploaded && fs.existsSync(zipPath)) {
      try {
        fs.rmSync(zipPath, { force: true });
        console.log("[Backup] ZIP local eliminado tras subida a Drive");
      } catch (cleanupErr) {
        console.warn("[Backup] No se pudo borrar ZIP local:", cleanupErr.message);
      }
    }

    // ── Éxito ──
    const durationMs = Date.now() - startTime;
    emitBackupEvent("backup:completed", {
      date,
      folderName,
      durationMs,
      manual: isManual,
      message: isManual
        ? "Respaldo descargado exitosamente"
        : "Respaldo automático completado y subido a Drive",
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

    // Limpiar archivos temporales
    try {
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      if (fs.existsSync(zipPath)) {
        fs.rmSync(zipPath, { force: true });
      }
    } catch {
      // ignorar
    }

    throw new AppError(error.message || "Falló la generación del respaldo", 500);
  }
};