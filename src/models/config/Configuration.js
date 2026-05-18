import mongoose from 'mongoose';

/**
 * @description Schema for global system settings. 
 * Stores Google API credentials, Calendar IDs, WebSocket parameters, and Accounting configuration.
 * Note: Only one document should exist in this collection.
 */
const configurationSchema = new mongoose.Schema({
    /**
     * @section Google Integration
     * Configuration for the institutional Google Calendar.
     */
    rolePermissions: {
        type: Map,
        of: [String],
        default: {}
    },
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
    },
    backupFrequencyDays: {
        type: Number,
        default: 7,
        description: 'Frecuencia en días para realizar respaldos automáticos'
    },

    /**
     * @section Accounting Settings
     * Control parameters for financial periods and default automated transactions.
     */
    accountingClosedDate: {
        type: Date,
        default: null,
        description: 'Fecha limite hasta la cual la contabilidad esta cerrada. Bloquea operaciones en fechas historicas.'
    },
    defaultCashAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null,
        description: 'Referencia a la cuenta de Activo/Caja liquida predeterminada para contrapartidas automatizadas.'
    }
}, {
    timestamps: true,
    collection: 'configuration' // Explicit name to keep it singular
});

export default mongoose.model('Configuration', configurationSchema);