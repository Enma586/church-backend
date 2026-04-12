/**
 * @description Routes for the Pastoral Notes domain.
 * Manages pastoral follow-up notes written by staff about members.
 *
 * All endpoints require authentication.
 * Create and update are available to Administrators and Employees.
 * Delete is restricted to Administrators.
 *
 * The authorId is automatically set from the authenticated user on creation.
 * Notes can be flagged as sensitive for access control.
 *
 * Query parameters for list endpoints support pagination (page, limit),
 * filtering by memberId and isSensitive.
 *
 * @module routes/pastoral-notes
 */

import { Router } from 'express';
import { PastoralNoteController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createPastoralNoteSchema, 
    updatePastoralNoteSchema, 
    queryPastoralNoteSchema 
} from '../../schemas/index.js';

const router = Router();

/**
 * @route   GET /pastoral-notes
 * @desc    Retrieve a paginated list of pastoral notes with optional filters
 * @query   page, limit, memberId, isSensitive
 * @access  Authenticated
 */
router.get('/', auth, validate(queryPastoralNoteSchema, 'query'), PastoralNoteController.findAll);

/**
 * @route   GET /pastoral-notes/:id
 * @desc    Retrieve a single pastoral note by ID
 * @access  Authenticated
 */
router.get('/:id', auth, PastoralNoteController.findById);

/**
 * @route   POST /pastoral-notes
 * @desc    Create a new pastoral note (authorId is set from authenticated user)
 * @access  Administrator, Employee
 */
router.post('/', auth, roleGuard('Administrador', 'Empleado'), validate(createPastoralNoteSchema, 'body'), PastoralNoteController.create);

/**
 * @route   PUT /pastoral-notes/:id
 * @desc    Update an existing pastoral note
 * @access  Administrator, Employee
 */
router.put('/:id', auth, roleGuard('Administrador', 'Empleado'), validate(updatePastoralNoteSchema, 'body'), PastoralNoteController.update);

/**
 * @route   DELETE /pastoral-notes/:id
 * @desc    Remove a pastoral note
 * @access  Administrator
 */
router.delete('/:id', auth, roleGuard('Administrador'), PastoralNoteController.remove);

export default router;
