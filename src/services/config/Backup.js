import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { AppError } from '../../utils/AppError.js';

const execPromise = util.promisify(exec);

export const createAndZipBackup = async (outputStream) => {
    // Usamos variables de entorno para que sea flexible (físico vs Docker)
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    const date = new Date().toISOString().split('T')[0];
    const folderName = `backup_${date}`;
    const backupPath = path.join(backupDir, folderName);

    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // Comando seguro
    const command = `mongodump --uri="${process.env.MONGO_URI}" --out="${backupPath}"`;

    try {
        await execPromise(command);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(outputStream);
        archive.directory(backupPath, folderName);
        
        await archive.finalize();
        
        // Limpieza opcional: borrar la carpeta temporal después de comprimir
        fs.rmSync(backupPath, { recursive: true, force: true });
        
    } catch (error) {
        console.error("Error en backup:", error);
        throw new AppError('Falló la generación del respaldo', 500);
    }
};