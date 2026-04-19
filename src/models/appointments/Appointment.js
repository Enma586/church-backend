import mongoose from 'mongoose';
import { APPOINTMENT_STATUS, SYNC_STATUS } from '../../constants/index.js';

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
        trim: true
    },
    startDateTime: {
        type: Date,
        required: [true, 'La fecha y hora de inicio son requeridas']
    },
    endDateTime: {
        type: Date,
        required: [true, 'La fecha y hora de fin son requeridas']
    },
    suggestions: {
        type: String,
        trim: true
    },
    observations: {
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