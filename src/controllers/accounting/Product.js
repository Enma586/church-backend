/**
 * @fileoverview Controladores HTTP para catálogo de productos.
 */

import * as AccountingService from '../../services/index.js';

export const create = async (req, res, next) => {
    try {
        const product = await AccountingService.createProduct(req.body);
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        next(err);
    }
};

export const findAll = async (req, res, next) => {
    try {
        const result = await AccountingService.findAllProducts(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

export const findById = async (req, res, next) => {
    try {
        const product = await AccountingService.findProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const product = await AccountingService.updateProduct(req.params.id, req.body);
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        await AccountingService.removeProduct(req.params.id);
        res.status(200).json({ success: true, message: 'Producto eliminado correctamente' });
    } catch (err) {
        next(err);
    }
};