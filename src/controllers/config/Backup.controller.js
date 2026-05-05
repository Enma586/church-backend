import * as BackupService from "../../services/index.js";
import { Configuration } from '../../models/index.js';
import { getIO } from "../../config/socket.js";

export const downloadBackup = async (req, res, next) => {
  try {
    // Ya NO seteamos res.attachment() aquí — el servicio lo hará cuando el dump esté listo
    await BackupService.createAndZipBackup(res);

    // Solo se llega aquí si el backup fue exitoso
    const config = await Configuration.findOne();
    if (config) {
      config.lastBackupDate = new Date();
      await config.save();
    }

    // Emitir por socket que se completó (por si el frontend necesita refrescar la UI)
    try {
      const io = getIO();
      io.emit("backup:completed", {
        manual: true,
        message: "Respaldo descargado exitosamente",
      });
    } catch {
      // Socket.IO no disponible
    }
  } catch (error) {
    // Si el error ocurrió ANTES de mandar headers, el errorHandler mandará JSON
    // Si el error ocurrió DESPUÉS, res.headersSent === true y el errorHandler delegará a Express
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

    try {
      const io = getIO();
      io.emit("backup:completed", {
        manual: false,
        message: "Respaldo automático completado en servidor",
      });
    } catch {
      // Socket.IO no disponible
    }

    res.status(200).json({
      success: true,
      message: "Respaldo automático completado en servidor",
    });
  } catch (error) {
    next(error);
  }
};