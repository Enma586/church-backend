import * as BackupService from '../../services/config/Backup.service.js';

export const downloadBackup = async (req, res, next) => {
    try {
        const date = new Date().toISOString().split('T')[0];
        res.attachment(`respaldo_parroquia_${date}.zip`);
        
        await BackupService.createAndZipBackup(res);
    } catch (error) {
        next(error);
    }
};