import * as ConfigService from '../../services/config/Configuration.js';

/**
 * @description Gets the global system configuration.
 * Since it's a singleton, it doesn't require IDs or params.
 */
export const get = async (req, res, next) => {
    try {
        const config = await ConfigService.getConfiguration();
        
        if (!config) {
            return res.status(404).json({ 
                success: false, 
                message: 'No se ha encontrado una configuración inicial.' 
            });
        }

        res.status(200).json({ success: true, data: config });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Updates the global configuration or creates it if it doesn't exist.
 * Used for Google Calendar ID, WebSocket settings, and Church info.
 */
export const update = async (req, res, next) => {
    try {
        // req.body is already validated by configurationSchema in Joi
        const updatedConfig = await ConfigService.updateOrCreateConfiguration(req.body);

        res.status(200).json({ 
            success: true, 
            message: 'Configuración del sistema actualizada correctamente',
            data: updatedConfig 
        });
    } catch (err) {
        next(err);
    }
};