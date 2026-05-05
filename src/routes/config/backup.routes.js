import { Router } from 'express';
import { downloadBackup } from '../../controllers/config/Backup.controller.js';
import { auth, roleGuard } from '../../middlewares/index.js';

const router = Router();

// Endpoint protegido
router.get('/download', auth, roleGuard('Coordinador'), downloadBackup);

export default router;