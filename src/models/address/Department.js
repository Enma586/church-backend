import mongoose from 'mongoose';

/**
 * @description Schema for the 18 departments of Honduras.
 * @requires name - Unique name of the department.
 */
const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del departamento es requerido'],
        unique: true,
        trim: true
    },
    isoCode: {
        type: String,
        trim: true,
        description: 'Código ISO estándar para reportes geográficos (ej. HN-FM)'
    }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt
});

export default mongoose.model('Department', departmentSchema);