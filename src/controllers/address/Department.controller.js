import * as DepartmentService from '../../services/address/Department.js';

/**
 * @description Controller to create a new department.
 */
export const create = async (req, res, next) => {
    try {
        const department = await DepartmentService.createDepartment(req.body);
        res.status(201).json({ success: true, data: department });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Controller to get all departments with filters and pagination.
 */
export const findAll = async (req, res, next) => {
    try {
        // req.query already has page, limit and filters from Joi middleware
        const result = await DepartmentService.findAllDepartments(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Controller to get a specific department by ID.
 */
export const findById = async (req, res, next) => {
    try {
        const department = await DepartmentService.findDepartmentById(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Departamento no encontrado' });
        }
        res.status(200).json({ success: true, data: department });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Controller to update a department.
 */
export const update = async (req, res, next) => {
    try {
        const department = await DepartmentService.updateDepartment(req.params.id, req.body);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Departamento no encontrado' });
        }
        res.status(200).json({ success: true, data: department });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Controller to remove a department.
 */
export const remove = async (req, res, next) => {
    try {
        const department = await DepartmentService.removeDepartment(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Departamento no encontrado' });
        }
        res.status(200).json({ success: true, message: 'Departamento eliminado' });
    } catch (err) {
        next(err);
    }
};