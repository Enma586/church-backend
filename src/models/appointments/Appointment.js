import mongoose from 'mongoose';
import { APPOINTMENT_STATUS, SYNC_STATUS } from '../../constants/index.js';

const appointmentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['cita_pastoral', 'evento_cronograma', 'bloqueo_agenda'],
        default: 'cita_pastoral',
        index: true
    },
    // Miembro para citas individuales (ahora opcional en DB)
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        index: true
    },
    // Arreglo de miembros involucrados para eventos del cronograma
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    }],
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Fecha para eventos de "Todo el día" (Cronograma)
    allDayDate: {
        type: Date
    },
    // Fechas para reuniones con hora específica (Citas)
    startDateTime: {
        type: Date
    },
    // Reemplazo de observaciones y sugerencias
    extras: {
        type: String,
        trim: true
    },
    googleEventId: {
        type: String
    },
    syncStatus: {
        type: String,
        enum: SYNC_STATUS,
        default: 'synced',
        index: true,
    },
    status: {
        type: String,
        enum: APPOINTMENT_STATUS,
        default: 'Programada'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Appointment', appointmentSchema);