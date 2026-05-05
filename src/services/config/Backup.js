import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { AppError } from '../../utils/AppError.js';

// Convertimos 'exec' a promesas para poder usar async/await
const execPromise = util.promisify(exec);

export const createManualBackup = async () => {
    // 1. Preparamos el nombre y la carpeta donde se guardará
    const date = new Date().toISOString().split('T')[0]; // Formato: YYYY-MM-DD
    const backupFolder = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupFolder, `parroquia_backup_${date}`);

    // Si la carpeta 'backups' no existe en tu proyecto, la creamos
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder);
    }

    // 2. Armamos el comando usando la URI de tu base de datos
    // Asegúrate de que process.env.MONGO_URI tenga la cadena de conexión correcta
    const uri = process.env.MONGO_URI; 
    const command = `mongodump --uri="${uri}" --out="${backupPath}"`;

    try {
        // 3. Ejecutamos el comando en la terminal
        await execPromise(command);
        
        return {
            message: 'Respaldo de base de datos generado con éxito',
            path: backupPath
        };
    } catch (error) {
        console.error("Error en mongodump:", error);
        throw new AppError('Falló la creación del respaldo en el servidor', 500);
    }
};