/**
 * @description Routes for the Address domain.
 * Handles geographic entities: Departments and Municipalities.
 *
 * All endpoints require authentication.
 * Write operations (POST, PUT, DELETE) are restricted to Administrators.
 *
 * Query parameters for list endpoints support pagination (page, limit)
 * and optional search filtering.
 *
 * @module routes/address
 */

import { Router } from 'express';
import { DepartmentController, MunicipalityController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createDepartmentSchema, 
    updateDepartmentSchema,
    queryDepartmentSchema, 
    createMunicipalitySchema,
    updateMunicipalitySchema,
    queryMunicipalitySchema 
} from '../../schemas/index.js';

const router = Router();

// ─── Departments ──────────────────────────────────────────────

/**
 * @route   GET /address/departments
 * @desc    Retrieve a paginated list of departments with optional search
 * @query   page, limit, search
 * @access  Authenticated
 */
router.get('/departments', auth, validate(queryDepartmentSchema, 'query'), DepartmentController.findAll);

/**
 * @route   GET /address/departments/:id
 * @desc    Retrieve a single department by ID
 * @access  Authenticated
 */
router.get('/departments/:id', auth, DepartmentController.findById);

/**
 * @route   POST /address/departments
 * @desc    Create a new department
 * @access  Administrator
 */
router.post('/departments', auth, roleGuard('Administrador'), validate(createDepartmentSchema, 'body'), DepartmentController.create);

/**
 * @route   PUT /address/departments/:id
 * @desc    Update an existing department
 * @access  Administrator
 */
router.put('/departments/:id', auth, roleGuard('Administrador'), validate(updateDepartmentSchema, 'body'), DepartmentController.update);

/**
 * @route   DELETE /address/departments/:id
 * @desc    Remove a department
 * @access  Administrator
 */
router.delete('/departments/:id', auth, roleGuard('Administrador'), DepartmentController.remove);

// ─── Municipalities ───────────────────────────────────────────

/**
 * @route   GET /address/municipalities
 * @desc    Retrieve a paginated list of municipalities with optional search and department filter
 * @query   page, limit, search, departmentId
 * @access  Authenticated
 */
router.get('/municipalities', auth, validate(queryMunicipalitySchema, 'query'), MunicipalityController.findAll);

/**
 * @route   GET /address/municipalities/:id
 * @desc    Retrieve a single municipality by ID
 * @access  Authenticated
 */
router.get('/municipalities/:id', auth, MunicipalityController.findById);

/**
 * @route   POST /address/municipalities
 * @desc    Create a new municipality linked to a department
 * @access  Administrator
 */
router.post('/municipalities', auth, roleGuard('Administrador'), validate(createMunicipalitySchema, 'body'), MunicipalityController.create);

/**
 * @route   PUT /address/municipalities/:id
 * @desc    Update an existing municipality
 * @access  Administrator
 */
router.put('/municipalities/:id', auth, roleGuard('Administrador'), validate(updateMunicipalitySchema, 'body'), MunicipalityController.update);

/**
 * @route   DELETE /address/municipalities/:id
 * @desc    Remove a municipality
 * @access  Administrator
 */
router.delete('/municipalities/:id', auth, roleGuard('Administrador'), MunicipalityController.remove);

export default router;
