import mongoose from 'mongoose';

/**
 * @description Core schema for personal identity.
 * Includes contact info, geographic location, and family ties.
 */
const memberSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'El nombre completo es requerido'],
        trim: true,
        index: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'La fecha de nacimiento es requerida']
    },
    gender: {
        type: String,
        enum: ['Masculino', 'Femenino'],
        required: true
    },
    // Contact Information
    phone: {
        type: String,
        trim: true,
        description: 'Número de contacto principal para notificaciones de WhatsApp'
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        description: 'Correo personal para invitaciones de Google Calendar'
    },
    // Geographic Reference (Honduras Address)
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    municipalityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Municipality',
        required: true
    },
    addressDetails: {
        type: String,
        trim: true,
        description: 'Barrio o dirección específica'
    },
    /**
     * @section Family Relationships
     * Embedded array to maintain the family core without extra collections.
     */
    family: [{
        name: { type: String, required: true },
        relationship: { 
            type: String, 
            required: true,
            enum: ['Padre', 'Madre', 'Cónyuge', 'Hijo/a', 'Hermano/a', 'Tutor', 'Otro']
        },
        isMember: { type: Boolean, default: false }
    }],
    status: {
        type: String,
        enum: ['Activo', 'Inactivo'],
        default: 'Activo'
    }
}, {
    timestamps: true
});

export default mongoose.model('Member', memberSchema);