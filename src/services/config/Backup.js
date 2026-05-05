import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { AppError } from '../../utils/AppError.js';

const execPromise = util.promisify(exec);

/**
 * @param {Object} outputStream - Stream de respuesta (res) para descarga directa.
 * @param {Object} config - Objeto de configuración que contiene backupFrequencyDays.
 */
export const createAndZipBackup = async (outputStream, config = null) => {
    // 1. Regla de Negocio: Validar si el sistema permite respaldos según la frecuencia
    // (Solo aplica si estamos llamando esto desde el cron/startup, no desde el botón manual)
    if (config && config.lastBackupDate) {
        const diffTime = Math.abs(new Date() - new Date(config.lastBackupDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < config.backupFrequencyDays) {
            console.log(`Respaldo omitido: solo han pasado ${diffDays} días, la frecuencia es de ${config.backupFrequencyDays}`);
            return; // O puedes lanzar un error personalizado si prefieres
        }
    }

    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    const date = new Date().toISOString().split('T')[0];
    const folderName = `backup_${date}`;
    const backupPath = path.join(backupDir, folderName);

    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const command = `mongodump --uri="${process.env.MONGO_URI}" --out="${backupPath}"`;

    try {
        await execPromise(command);

        // Si outputStream es null (llamada automática), no hacemos zip, solo el dump
        if (outputStream) {
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.pipe(outputStream);
            archive.directory(backupPath, folderName);
            await archive.finalize();
        }
        
        // Limpieza de carpeta temporal
        fs.rmSync(backupPath, { recursive: true, force: true });
        
    } catch (error) {
        console.error("Error en backup:", error);
        throw new AppError('Falló la generación del respaldo', 500);
    }
};