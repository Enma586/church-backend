import * as MunicipalityService from '../../services/address/Municipality.js';

/**
 * @description Controller to create a new municipality.
 */
export const create = async (req, res, next) => {
    try {
        const municipality = await MunicipalityService.createMunicipality(req.body);
        res.status(201).json({ success: true, data: municipality });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Controller to get municipalities (filterable by departmentId).
 */
export const findAll = async (req, res, next) => {
    try {
        const result = await MunicipalityService.findAllMunicipalities(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Controller to get a specific municipality by ID.
 */
export const findById = async (req, res, next) => {
    try {
        const municipality = await MunicipalityService.findMunicipalityById(req.params.id);
        if (!municipality) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado' });
        }
        res.status(200).json({ success: true, data: municipality });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Controller to update a municipality.
 */
export const update = async (req, res, next) => {
    try {
        const municipality = await MunicipalityService.updateMunicipality(req.params.id, req.body);
        if (!municipality) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado' });
        }
        res.status(200).json({ success: true, data: municipality });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Controller to remove a municipality.
 */
export const remove = async (req, res, next) => {
    try {
        const municipality = await MunicipalityService.removeMunicipality(req.params.id);
        if (!municipality) {
            return res.status(404).json({ success: false, message: 'Municipio no encontrado' });
        }
        res.status(200).json({ success: true, message: 'Municipio eliminado' });
    } catch (err) {
        next(err);
    }
};