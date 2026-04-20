/**
 * @description Routes for the System Configuration domain.
 * Manages global application settings such as Google Calendar
 * integration, notification preferences, and church name.
 *
 * All endpoints require authentication.
 * Update is restricted to Administrators.
 *
 * This is a singleton resource — only one configuration document exists.
 * The PUT endpoint performs an upsert (create or update).
 *
 * @module routes/config
 */

import { Router } from 'express';
import { ConfigurationController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { configurationSchema } from '../../schemas/index.js';

const router = Router();

/**
 * @route   GET /config
 * @desc    Retrieve the current system configuration
 * @access  Authenticated
 */
router.get('/', auth, ConfigurationController.get);

/**
 * @route   PUT /config
 * @desc    Update system configuration (upserts if none exists)
 * @access  Administrator
 */
router.put('/', auth, roleGuard('Coordinador'), validate(configurationSchema, 'body'), ConfigurationController.update);

export default router;
