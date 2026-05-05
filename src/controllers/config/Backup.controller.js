import * as BackupService from '../../services/config/Backup.js';

export const triggerBackup = async (req, res, next) => {
    try {
        const result = await BackupService.createManualBackup();
        
        res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        next(error); // Lo mandamos a tu manejador de errores global
    }
};