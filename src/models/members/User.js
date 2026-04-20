import mongoose from 'mongoose';
import { USER_ROLE } from '../../constants/index.js';

const userSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'El usuario debe estar vinculado a un perfil de Miembro'],
        unique: true
    },
    username: {
        type: String,
        required: [true, 'El nombre de usuario es requerido'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        select: false
    },
    role: {
        type: String,
        enum: USER_ROLE,
        default: 'Subcoordinador',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('User', userSchema);