/**
 * @description Routes for the Member domain.
 * Manages church member records including personal data, family,
 * location, and membership status.
 *
 * All endpoints require authentication.
 * Write operations (POST, PUT, DELETE) are restricted to Administrators.
 *
 * Query parameters for list endpoints support pagination (page, limit)
 * and filtering by status, gender, department, and search term.
 *
 * @module routes/members
 */

import { Router } from 'express';
import { MemberController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createMemberSchema, 
    updateMemberSchema, 
    queryMemberSchema 
} from '../../schemas/index.js';

const router = Router();

/**
 * @route   GET /members
 * @desc    Retrieve a paginated list of members with optional filters
 * @query   page, limit, status, gender, departmentId, search
 * @access  Authenticated
 */
router.get('/', auth, validate(queryMemberSchema, 'query'), MemberController.findAll);

/**
 * @route   GET /members/:id
 * @desc    Retrieve a single member by ID
 * @access  Authenticated
 */
router.get('/:id', auth, MemberController.findById);

/**
 * @route   POST /members
 * @desc    Register a new member
 * @access  Administrator
 */
router.post('/', auth, roleGuard('Administrador'), validate(createMemberSchema, 'body'), MemberController.create);

/**
 * @route   PUT /members/:id
 * @desc    Update an existing member's information
 * @access  Administrator
 */
router.put('/:id', auth, roleGuard('Administrador'), validate(updateMemberSchema, 'body'), MemberController.update);

/**
 * @route   DELETE /members/:id
 * @desc    Remove a member record
 * @access  Administrator
 */
router.delete('/:id', auth, roleGuard('Administrador'), MemberController.remove);

export default router;
