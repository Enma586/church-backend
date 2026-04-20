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
router.post('/', auth, roleGuard('Coordinador', 'Subcoordinador'), validate(createSacramentSchema, 'body'), SacramentController.create);
router.put('/:id', auth, roleGuard('Coordinador', 'Subcoordinador'), validate(paramsIdSchema, 'params'), validate(updateSacramentSchema, 'body'), SacramentController.update);
router.delete('/:id', auth, roleGuard('Coordinador'), validate(paramsIdSchema, 'params'), SacramentController.remove);

export default router;
