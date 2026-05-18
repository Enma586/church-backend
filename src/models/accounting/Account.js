/**
 * @fileoverview Modelo de Mongoose para el catálogo de cuentas contables.
 * Soporta estructuras jerárquicas mediante referencias jerárquicas adyacentes.
 */

import mongoose from 'mongoose';
import { CUENTA_TYPE } from '../../constants/index.js';

const accountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: CUENTA_TYPE,
        required: true
    },
    parentAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null
    },
    acceptsTransactions: {
        type: Boolean,
        required: true,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model('Account', accountSchema);