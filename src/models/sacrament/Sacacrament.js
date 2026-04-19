import mongoose from 'mongoose';
import { SACRAMENT_TYPE } from '../../constants/index.js';

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
        enum: SACRAMENT_TYPE
    },
    date: {
        type: Date,
        required: [true, 'La fecha del sacramento es requerida']
    },
    place: {
        type: String,
        trim: true
    },
    celebrant: {
        type: String,
        trim: true
    },
    godparents: [{
        name: { type: String, trim: true },
        role: { type: String, default: 'Padrino/Madrina' }
    }]
}, {
    timestamps: true
});

export default mongoose.model('Sacrament', sacramentSchema);