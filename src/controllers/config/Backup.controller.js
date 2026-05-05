import * as BackupService from "../../services/index.js";

import Configuration from "../../models/config/Configuration.js";

export const downloadBackup = async (req, res, next) => {
  try {
    const date = new Date().toISOString().split("T")[0];
    res.attachment(`respaldo_parroquia_${date}.zip`);

    // 1. Llamamos al servicio pasando 'res' para que haga el stream del ZIP
    await BackupService.createAndZipBackup(res);

    // 2. ¡NUEVO! Actualizamos la fecha en la BD porque la descarga manual también cuenta como respaldo válido
    const config = await Configuration.findOne();
    if (config) {
      config.lastBackupDate = new Date();
      await config.save();
    }
  } catch (error) {
    next(error);
  }
};
export const triggerAutomaticBackup = async (req, res, next) => {
  try {
    const config = await Configuration.findOne();

    await BackupService.createAndZipBackup(null, config);

    if (config) {
      config.lastBackupDate = new Date();
      await config.save();
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Respaldo automático completado en servidor",
      });
  } catch (error) {
    next(error);
  }
};
