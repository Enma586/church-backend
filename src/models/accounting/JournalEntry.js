/**
 * @fileoverview Modelo de Mongoose para asientos contables (Journal Entries).
 * Garantiza el cumplimiento estricto del principio de partida doble.
 */

import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { STADO_TYPE } from '../../constants/index.js';

const journalLineSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  debit: {
    type: Number,
    required: true,
    default: 0,
  },
  credit: {
    type: Number,
    required: true,
    default: 0,
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  _id: false,
});

const journalEntrySchema = new mongoose.Schema({
  voucherNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  concept: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: STADO_TYPE,
    default: 'Valido',
  },
  lines: {
    type: [journalLineSchema],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

/**
 * Hook de validación. En Mongoose 9 los hooks async NO reciben `next`.
 * Se usa throw para rechazar y return implícito para continuar.
 */
journalEntrySchema.pre('save', async function () {
  if (!this.lines || this.lines.length < 2) {
    throw new AppError(
      'Un asiento contable requiere un mínimo de dos líneas.',
      400,
    );
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of this.lines) {
    totalDebit += line.debit;
    totalCredit += line.credit;
  }

  if (totalDebit !== totalCredit) {
    throw new AppError(
      `Descuadre financiero: Débitos L.${totalDebit.toFixed(2)} ≠ Créditos L.${totalCredit.toFixed(2)}.`,
      400,
    );
  }

  // async hook sin next: el return implícito equivale a next()
});

export default mongoose.model('JournalEntry', journalEntrySchema);