import { Router } from 'express';
import { BackupController } from '../../controllers/index.js';
import { auth, roleGuard } from '../../middlewares/index.js';

const router = Router();

// Endpoint para el botón de la coordinadora (Descarga directa)
router.get('/download', auth, roleGuard('Coordinador'), BackupController.downloadBackup);

// Endpoint para el "Vigilante de Arranque" (Ejecución interna)
router.post('/trigger-auto', auth, roleGuard('Coordinador'), BackupController.triggerAutomaticBackup);

export default router;