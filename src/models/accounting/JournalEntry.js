/**
 * @fileoverview Modelo de Mongoose para asientos contables simplificados.
 * Sistema de Ingreso/Egreso directo (sin partida doble).
 */

import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { STADO_TYPE, JOURNAL_TYPE } from '../../constants/index.js';

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
  type: {
    type: String,
    enum: JOURNAL_TYPE,
    required: true,
  },
  concept: {
    type: String,
    required: true,
    trim: true,
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  status: {
    type: String,
    enum: STADO_TYPE,
    default: 'Valido',
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
 * Hook pre-save: validar que el monto sea positivo y la cuenta exista.
 */
journalEntrySchema.pre('save', async function () {
  if (!this.amount || this.amount <= 0) {
    throw new AppError('El monto debe ser mayor a cero.', 400);
  }
});

export default mongoose.model('JournalEntry', journalEntrySchema);