import mongoose from 'mongoose';

/**
 * @description Schema for managing appointments and Google Calendar synchronization.
 * @requires memberId - Reference to the member attending the appointment.
 * @requires startDateTime - Beginning of the event.
 */
const appointmentSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'Una cita debe estar vinculada a un miembro'],
        index: true
    },
    title: {
        type: String,
        required: [true, 'El título de la cita es requerido'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        description: 'Detalles generales sobre el propósito de la reunión'
    },
    startDateTime: {
        type: Date,
        required: [true, 'La fecha y hora de inicio son requeridas']
    },
    endDateTime: {
        type: Date,
        required: [true, 'La fecha y hora de fin son requeridas']
    },
    /**
     * @section Preparation and Follow-up
     * Fields for suggestions (before) and observations (after).
     */
    suggestions: {
        type: String,
        trim: true,
        description: 'Sugerencias o requisitos internos antes de que se lleve a cabo la reunión'
    },
    observations: {
        type: String,
        trim: true,
        description: 'Notas posteriores a la reunión sobre el resultado o próximos pasos'
    },
    /**
     * @section Integration Data
     * Fields for Google Calendar and internal tracking.
     */
    googleEventId: {
        type: String,
        description: 'El ID único devuelto por la API de Google Calendar para referencia cruzada'
    },
    syncStatus: {
        type: String,
        enum: ['synced', 'pending_sync', 'failed', 'orphan'],
        default: 'synced',
        description: 'Estado de sincronización con Google Calendar',
        index: true,
    },
    status: {
        type: String,
        enum: ['Programada', 'Completada', 'Cancelada', 'No asistió'],
        default: 'Programada'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        description: 'Referencia al Usuario (Administrador/Empleado) que creó el registro'
    }
}, {
    timestamps: true
});

export default mongoose.model('Appointment', appointmentSchema);