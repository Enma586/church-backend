import mongoose from 'mongoose';

/**
 * @description Schema for recording the spiritual milestones of a member.
 * @requires memberId - Reference to the member who received the sacrament.
 */
const sacramentSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'Un sacramento debe estar vinculado a un miembro'],
        index: true
    },
    type: {
        type: String,
        required: [true, 'El tipo de sacramento es requerido'],
        enum: ['Ninguno','Bautismo', 'Primera Comunión', 'Confirmación'],
        description: 'Tipo de hito espiritual'
    },
    date: {
        type: Date,
        required: [true, 'La fecha del sacramento es requerida']
    },
    place: {
        type: String,
        trim: true,
        description: 'Opcional: Nombre de la iglesia o parroquia donde se realizó'
    },
    celebrant: {
        type: String,
        trim: true,
        description: 'Nombre del sacerdote o diácono que presidió'
    },
    godparents: [{
        name: { type: String, trim: true },
        role: { type: String, default: 'Padrino/Madrina' }
    }]
}, {
    timestamps: true
});

export default mongoose.model('Sacrament', sacramentSchema);