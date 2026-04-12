/**
 * @description Routes for the User & Authentication domain.
 * Handles login, logout, session verification, and user management.
 *
 * Public endpoints: login
 * Authenticated endpoints: logout, me
 * Administrator-only endpoints: create user, update user
 *
 * @module routes/users
 */

import { Router } from 'express';
import { UserController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createUserSchema, 
    updateUserSchema, 
    loginUserSchema 
} from '../../schemas/index.js';

const router = Router();

/**
 * @route   POST /users/login
 * @desc    Authenticate user and set HTTP-only JWT cookie
 * @access  Public
 */
router.post('/login', validate(loginUserSchema, 'body'), UserController.login);

/**
 * @route   POST /users/logout
 * @desc    Clear the auth cookie and end the session
 * @access  Authenticated
 */
router.post('/logout', auth, UserController.logout);

/**
 * @route   GET /users/me
 * @desc    Get the currently authenticated user's profile
 * @access  Authenticated
 */
router.get('/me', auth, UserController.me);

/**
 * @route   POST /users
 * @desc    Create a new user account (linked to an existing member)
 * @access  Administrator
 */
router.post('/', auth, roleGuard('Administrador'), validate(createUserSchema, 'body'), UserController.create);

/**
 * @route   PUT /users/:id
 * @desc    Update an existing user's account information
 * @access  Administrator
 */
router.put('/:id', auth, roleGuard('Administrador'), validate(updateUserSchema, 'body'), UserController.update);

export default router;
