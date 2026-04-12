/**
 * @description Master router for the API.
 * Mounts all domain-specific sub-routers under /api.
 *
 * Routes:
 *   /api/address        - Department & Municipality CRUD
 *   /api/members        - Member management
 *   /api/users          - Authentication & user management
 *   /api/appointments   - Appointment scheduling
 *   /api/sacraments     - Sacramental records
 *   /api/pastoral-notes - Pastoral follow-up notes
 *   /api/config         - System configuration
 */

import { Router } from 'express';
import addressRoutes from './address/index.js';
import { memberRoutes, userRoutes } from './members/index.js';
import appointmentRoutes from './appointments/index.js';
import { sacramentRoutes, pastoralNoteRoutes } from './sacrament/index.js';
import configurationRoutes from './config/index.js';

const router = Router();

router.use('/address', addressRoutes);
router.use('/members', memberRoutes);
router.use('/users', userRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/sacraments', sacramentRoutes);
router.use('/pastoral-notes', pastoralNoteRoutes);
router.use('/config', configurationRoutes);

export default router;
