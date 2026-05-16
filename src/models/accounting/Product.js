/**
 * @fileoverview Modelo de Mongoose para el catálogo de productos y servicios operacionales.
 * Abstrae la complejidad contable vinculando ítems directos a cuentas de ingresos.
 */

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    defaultPrice: {
        type: Number,
        required: true,
        default: 0
    },
    incomeAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model('Product', productSchema);