/**
 * @description Routes for the Appointments domain.
 * Manages scheduling of pastoral appointments linked to members.
 *
 * All endpoints require authentication.
 * Create and update are available to Administrators and Employees.
 * Delete is restricted to Administrators.
 *
 * Query parameters for list endpoints support pagination (page, limit),
 * filtering by status, memberId, date range (dateFrom, dateTo), and search.
 *
 * @module routes/appointments
 */

import { Router } from 'express';
import { AppointmentController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createAppointmentSchema, 
    updateAppointmentSchema, 
    queryAppointmentSchema 
} from '../../schemas/index.js';

const router = Router();

/**
 * @route   GET /appointments
 * @desc    Retrieve a paginated list of appointments with optional filters
 * @query   page, limit, status, memberId, search, dateFrom, dateTo
 * @access  Authenticated
 */
router.get('/', auth, validate(queryAppointmentSchema, 'query'), AppointmentController.findAll);

/**
 * @route   GET /appointments/:id
 * @desc    Retrieve a single appointment by ID
 * @access  Authenticated
 */
router.get('/:id', auth, AppointmentController.findById);

/**
 * @route   POST /appointments
 * @desc    Create a new appointment (createdBy is set from authenticated user)
 * @access  Administrator, Employee
 */
router.post('/', auth, roleGuard('Administrador', 'Empleado'), validate(createAppointmentSchema, 'body'), AppointmentController.create);

/**
 * @route   PUT /appointments/:id
 * @desc    Update an existing appointment
 * @access  Administrator, Employee
 */
router.put('/:id', auth, roleGuard('Administrador', 'Empleado'), validate(updateAppointmentSchema, 'body'), AppointmentController.update);

/**
 * @route   DELETE /appointments/:id
 * @desc    Remove an appointment
 * @access  Administrator
 */
router.delete('/:id', auth, roleGuard('Administrador'), AppointmentController.remove);

export default router;
