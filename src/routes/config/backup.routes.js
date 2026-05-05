import { Router } from 'express';
import { downloadBackup, triggerAutomaticBackup } from '../../controllers/config/Backup.controller.js';
import { auth, roleGuard } from '../../middlewares/index.js';

const router = Router();

// Endpoint para el botón de la coordinadora (Descarga directa)
router.get('/download', auth, roleGuard('Coordinador'), downloadBackup);

// Endpoint para el "Vigilante de Arranque" (Ejecución interna)
// Este podría ser accedido solo por el servidor o un usuario privilegiado
router.post('/trigger-auto', auth, roleGuard('Coordinador'), triggerAutomaticBackup);

export default router;