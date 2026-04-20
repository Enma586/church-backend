import mongoose from 'mongoose';
import { GENDER, MEMBER_STATUS, FAMILY_RELATIONSHIP } from '../../constants/index.js';

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
        enum: GENDER,
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
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
        trim: true
    },
    family: [{
        name: { type: String, required: true },
        relationship: { 
            type: String, 
            required: true,
            enum: FAMILY_RELATIONSHIP
        },
        contactNumber: { type: String, trim: true },
        isMember: { type: Boolean, default: false }
    }],
    status: {
        type: String,
        enum: MEMBER_STATUS,
        default: 'Activo'
    }
}, {
    timestamps: true
});

export default mongoose.model('Member', memberSchema);