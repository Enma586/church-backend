import * as SacramentService from '../../services/sacraments/Sacrament.js';

/**
 * @description Registers a new sacrament milestone for a member.
 */
export const create = async (req, res, next) => {
    try {
        const sacrament = await SacramentService.createSacrament(req.body);
        res.status(201).json({ success: true, data: sacrament });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Lists sacraments with filters (type, date range, memberId).
 */
export const findAll = async (req, res, next) => {
    try {
        const result = await SacramentService.findAllSacraments(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Gets details of a specific sacrament.
 */
export const findById = async (req, res, next) => {
    try {
        const sacrament = await SacramentService.findSacramentById(req.params.id);
        if (!sacrament) {
            return res.status(404).json({ success: false, message: 'Registro sacramental no encontrado' });
        }
        res.status(200).json({ success: true, data: sacrament });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Updates sacrament data (place, celebrant, godparents).
 */
export const update = async (req, res, next) => {
    try {
        const sacrament = await SacramentService.updateSacrament(req.params.id, req.body);
        if (!sacrament) {
            return res.status(404).json({ success: false, message: 'Registro sacramental no encontrado' });
        }
        res.status(200).json({ success: true, data: sacrament });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Deletes a sacrament record.
 */
export const remove = async (req, res, next) => {
    try {
        const sacrament = await SacramentService.removeSacrament(req.params.id);
        if (!sacrament) {
            return res.status(404).json({ success: false, message: 'Registro sacramental no encontrado' });
        }
        res.status(200).json({ success: true, message: 'Registro eliminado' });
    } catch (err) {
        next(err);
    }
};