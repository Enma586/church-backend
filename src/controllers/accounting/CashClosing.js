/**
 * @fileoverview Controladores HTTP para cierres de caja.
 */

import * as AccountingService from '../../services/index.js';

export const create = async (req, res, next) => {
  try {
    const closing = await AccountingService.createCashClosing(req.body, req.user._id);
    res.status(201).json({ success: true, data: closing });
  } catch (err) {
    next(err);
  }
};

export const findAll = async (req, res, next) => {
  try {
    const result = await AccountingService.findAllCashClosings(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const findById = async (req, res, next) => {
  try {
    const closing = await AccountingService.findCashClosingById(req.params.id);
    if (!closing) {
      return res.status(404).json({ success: false, message: 'Cierre de caja no encontrado' });
    }
    res.status(200).json({ success: true, data: closing });
  } catch (err) {
    next(err);
  }
};

export const getDenominations = async (_req, res) => {
  try {
    const denominations = AccountingService.getDenominations();
    res.status(200).json({ success: true, data: denominations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener denominaciones' });
  }
};