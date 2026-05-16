/**
 * @fileoverview Modelo de Mongoose para contadores atómicos.
 * Garantiza numeración secuencial sin race conditions para comprobantes contables.
 * Uso: Counter.findByIdAndUpdate(id, { $inc: { seq: 1 } }, { upsert: true, new: true })
 */

import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    }
}, {
    versionKey: false
});

export default mongoose.model('Counter', counterSchema);