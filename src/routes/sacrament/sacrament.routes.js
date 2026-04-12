/**
 * @description Routes for the Sacrament domain.
 * Manages sacramental records (Baptism, First Communion, Confirmation,
 * Marriage, Anointing of the Sick) linked to members.
 *
 * All endpoints require authentication.
 * Create and update are available to Administrators and Employees.
 * Delete is restricted to Administrators.
 *
 * Query parameters for list endpoints support pagination (page, limit),
 * filtering by type, memberId, and date range (dateFrom, dateTo).
 *
 * @module routes/sacraments
 */

import { Router } from 'express';
import { SacramentController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createSacramentSchema, 
    updateSacramentSchema, 
    querySacramentSchema 
} from '../../schemas/index.js';

const router = Router();

/**
 * @route   GET /sacraments
 * @desc    Retrieve a paginated list of sacramental records with optional filters
 * @query   page, limit, type, memberId, dateFrom, dateTo
 * @access  Authenticated
 */
router.get('/', auth, validate(querySacramentSchema, 'query'), SacramentController.findAll);

/**
 * @route   GET /sacraments/:id
 * @desc    Retrieve a single sacramental record by ID
 * @access  Authenticated
 */
router.get('/:id', auth, SacramentController.findById);

/**
 * @route   POST /sacraments
 * @desc    Create a new sacramental record
 * @access  Administrator, Employee
 */
router.post('/', auth, roleGuard('Administrador', 'Empleado'), validate(createSacramentSchema, 'body'), SacramentController.create);

/**
 * @route   PUT /sacraments/:id
 * @desc    Update an existing sacramental record
 * @access  Administrator, Employee
 */
router.put('/:id', auth, roleGuard('Administrador', 'Empleado'), validate(updateSacramentSchema, 'body'), SacramentController.update);

/**
 * @route   DELETE /sacraments/:id
 * @desc    Remove a sacramental record
 * @access  Administrator
 */
router.delete('/:id', auth, roleGuard('Administrador'), SacramentController.remove);

export default router;
