import mongoose from 'mongoose';

/**
 * @description Security and access control schema.
 * Linked directly to a Member profile.
 */
const userSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'El usuario debe estar vinculado a un perfil de Miembro'],
        unique: true // One user account per member
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
        description: 'Contraseña cifrada para acceso al sistema'
    },
    role: {
        type: String,
        enum: ['Administrador', 'Empleado'],
        default: 'Empleado',
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