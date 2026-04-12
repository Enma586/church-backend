import mongoose from 'mongoose';

/**
 * @description Schema for the 298 municipalities, linked to a specific department.
 * @requires name - Name of the municipality.
 * @requires departmentId - Reference to the parent Department model.
 */
const municipalitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del municipio es requerido'],
        trim: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'El municipio debe pertenecer a un departamento'],
        index: true // Optimized for fast filtering in local environments
    },
    code: {
        type: String,
        trim: true,
        description: 'Código administrativo municipal oficial'
    }
}, {
    timestamps: true
});

// Compound index to ensure name uniqueness within the same department if needed
municipalitySchema.index({ name: 1, departmentId: 1 });

export default mongoose.model('Municipality', municipalitySchema);