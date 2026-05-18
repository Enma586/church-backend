/**
 * @fileoverview Modelo de Mongoose para cierres de caja (arqueo).
 * Registra el conteo físico de billetes por denominación hondureña.
 */

import mongoose from 'mongoose';

const denominationSchema = new mongoose.Schema({
  denomination: { type: Number, required: true },  // 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05
  quantity:     { type: Number, required: true, default: 0, min: 0 },
  subtotal:     { type: Number, required: true, default: 0 },  // denomination * quantity
}, { _id: false });

const cashClosingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  reference: {
    type: String,
    required: true,
    unique: true,
  },
  concept: {
    type: String,
    trim: true,
    default: 'Cierre de caja',
  },
  denominations: {
    type: [denominationSchema],
    required: true,
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'Debe incluir al menos una denominación.',
    },
  },
  totalCalculated: {
    type: Number,
    required: true,
  },
  // Monto esperado según el sistema contable hasta la fecha
  expectedBalance: {
    type: Number,
    default: 0,
  },
  difference: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    trim: true,
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

export default mongoose.model('CashClosing', cashClosingSchema);