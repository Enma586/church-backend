// 1. Importas el servicio de backup (Asumiendo que tu index.js exporta todo correctamente)
import * as BackupService from '../../services/index.js';

// 2. Importas el MODELO de Mongoose (No el servicio)
import Configuration from '../../models/config/Configuration.js'; 

// Para descargas manuales desde el frontend
export const downloadBackup = async (req, res, next) => {
    try {
        const date = new Date().toISOString().split('T')[0];
        res.attachment(`respaldo_parroquia_${date}.zip`);
        
        // Llamamos al servicio pasando 'res' para que haga el stream del ZIP
        await BackupService.createAndZipBackup(res);
    } catch (error) {
        next(error);
    }
};

// Para ejecutar el respaldo automático (Cron / Startup)
export const triggerAutomaticBackup = async (req, res, next) => {
    try {
        // Obtenemos la config actual desde la Base de Datos para validar la frecuencia
        const config = await Configuration.findOne();
        
        // Pasamos 'null' como stream porque no queremos descargar el archivo al cliente
        await BackupService.createAndZipBackup(null, config);
        
        // Actualizamos la fecha de último respaldo en la BD
        if (config) {
            config.lastBackupDate = new Date();
            await config.save(); // ¡Aquí es donde brilla el haber importado el Modelo!
        }

        res.status(200).json({ success: true, message: 'Respaldo automático completado en servidor' });
    } catch (error) {
        next(error);
    }
};