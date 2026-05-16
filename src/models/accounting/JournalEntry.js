/**
 * @fileoverview Modelo de Mongoose para asientos contables (Journal Entries).
 * Garantiza el cumplimiento estricto del principio de partida doble.
 */

import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { STADO_TYPE } from '../../constants/index.js'

const journalLineSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    debit: {
        type: Number,
        required: true,
        default: 0
    },
    credit: {
        type: Number,
        required: true,
        default: 0
    },
    description: {
        type: String,
        trim: true
    }
}, {
    _id: false
});

const journalEntrySchema = new mongoose.Schema({
    voucherNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    concept: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: STADO_TYPE,
        default: 'Valido'
    },
    lines: {
        type: [journalLineSchema],
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

/**
 * @function pre-save
 * @description Hook de validación de Mongoose. Verifica el cumplimiento de la partida doble antes de persistir.
 */
journalEntrySchema.pre('save', async function(next) {
    if (!this.lines || this.lines.length < 2) {
        return next(new AppError('Un asiento contable requiere un mínimo de dos líneas de afectación.', 400));
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of this.lines) {
        totalDebit += line.debit;
        totalCredit += line.credit;
    }

    if (totalDebit !== totalCredit) {
        return next(new AppError(`Descuadre financiero detectado. Débitos: ${totalDebit}, Créditos: ${totalCredit}.`, 400));
    }

    next();
});

export default mongoose.model('JournalEntry', journalEntrySchema);