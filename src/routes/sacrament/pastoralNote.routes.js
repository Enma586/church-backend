import { Router } from 'express';
import { PastoralNoteController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createPastoralNoteSchema, 
    updatePastoralNoteSchema, 
    queryPastoralNoteSchema,
    paramsIdSchema
} from '../../schemas/index.js';

const router = Router();

router.get('/', auth, validate(queryPastoralNoteSchema, 'query'), PastoralNoteController.findAll);
router.get('/:id', auth, validate(paramsIdSchema, 'params'), PastoralNoteController.findById);
router.post('/', auth, roleGuard('Coordinador', 'Empleado'), validate(createPastoralNoteSchema, 'body'), PastoralNoteController.create);
router.put('/:id', auth, roleGuard('Coordinador', 'Empleado'), validate(paramsIdSchema, 'params'), validate(updatePastoralNoteSchema, 'body'), PastoralNoteController.update);
router.delete('/:id', auth, roleGuard('Coordinador'), validate(paramsIdSchema, 'params'), PastoralNoteController.remove);

export default router;
