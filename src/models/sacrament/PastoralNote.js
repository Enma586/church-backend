import mongoose from 'mongoose';

/**
 * @description Sensitive log for spiritual guidance and observations by the priest.
 * @requires memberId - Reference to the member being observed.
 */
const pastoralNoteSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'La nota debe estar vinculada a un miembro'],
        index: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Se requiere un autor (Usuario) para responsabilidad'],
        description: 'El Administrador o Sacerdote que escribió la nota'
    },
    content: {
        type: String,
        required: [true, 'El contenido de la nota no puede estar vacío'],
        trim: true
    },
    isSensitive: {
        type: Boolean,
        default: false,
        description: 'Marca para restringir la visibilidad solo a roles de alto nivel'
    }
}, {
    timestamps: true
});

export default mongoose.model('PastoralNote', pastoralNoteSchema);