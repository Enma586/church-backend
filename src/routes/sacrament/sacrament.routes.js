import { Router } from 'express';
import { SacramentController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createSacramentSchema, 
    updateSacramentSchema, 
    querySacramentSchema,
    paramsIdSchema
} from '../../schemas/index.js';

const router = Router();

router.get('/', auth, validate(querySacramentSchema, 'query'), SacramentController.findAll);
router.get('/:id', auth, validate(paramsIdSchema, 'params'), SacramentController.findById);
router.post('/', auth, roleGuard('Administrador', 'Empleado'), validate(createSacramentSchema, 'body'), SacramentController.create);
router.put('/:id', auth, roleGuard('Administrador', 'Empleado'), validate(paramsIdSchema, 'params'), validate(updateSacramentSchema, 'body'), SacramentController.update);
router.delete('/:id', auth, roleGuard('Administrador'), validate(paramsIdSchema, 'params'), SacramentController.remove);

export default router;
