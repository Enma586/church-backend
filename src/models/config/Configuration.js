import mongoose from 'mongoose';

/**
 * @description Schema for global system settings. 
 * Stores Google API credentials, Calendar IDs, and WebSocket parameters.
 * Note: Only one document should exist in this collection.
 */
const configurationSchema = new mongoose.Schema({
    /**
     * @section Google Integration
     * Configuration for the institutional Google Calendar.
     */
    googleCalendarId: {
        type: String,
        required: [true, 'El ID de Google Calendar es requerido'],
        trim: true,
        default: 'primary'
    },
    googleServiceAccountEmail: {
        type: String,
        trim: true,
        description: 'La dirección de correo de la Cuenta de Servicio de Google'
    },
    
    /**
     * @section WebSocket & Real-time Settings
     * Control parameters for local notifications.
     */
    enableLocalNotifications: {
        type: Boolean,
        default: true
    },
    notificationRefreshInterval: {
        type: Number,
        default: 60,
        description: 'Intervalo en segundos para que el trabajo Cron verifique las próximas citas'
    },

    /**
     * @section System Metadata
     * General settings for the local Docker environment.
     */
    churchName: {
        type: String,
        required: true,
        default: 'Parroquia Local'
    },
    lastBackupDate: {
        type: Date
    }
}, {
    timestamps: true,
    collection: 'configuration' // Explicit name to keep it singular
});

export default mongoose.model('Configuration', configurationSchema);