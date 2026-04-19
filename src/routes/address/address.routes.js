import { Router } from 'express';
import { DepartmentController, MunicipalityController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createDepartmentSchema, 
    updateDepartmentSchema,
    queryDepartmentSchema, 
    createMunicipalitySchema,
    updateMunicipalitySchema,
    queryMunicipalitySchema,
    paramsIdSchema
} from '../../schemas/index.js';

const router = Router();

router.get('/departments', auth, validate(queryDepartmentSchema, 'query'), DepartmentController.findAll);
router.get('/departments/:id', auth, validate(paramsIdSchema, 'params'), DepartmentController.findById);
router.post('/departments', auth, roleGuard('Administrador'), validate(createDepartmentSchema, 'body'), DepartmentController.create);
router.put('/departments/:id', auth, roleGuard('Administrador'), validate(paramsIdSchema, 'params'), validate(updateDepartmentSchema, 'body'), DepartmentController.update);
router.delete('/departments/:id', auth, roleGuard('Administrador'), validate(paramsIdSchema, 'params'), DepartmentController.remove);

router.get('/municipalities', auth, validate(queryMunicipalitySchema, 'query'), MunicipalityController.findAll);
router.get('/municipalities/:id', auth, validate(paramsIdSchema, 'params'), MunicipalityController.findById);
router.post('/municipalities', auth, roleGuard('Administrador'), validate(createMunicipalitySchema, 'body'), MunicipalityController.create);
router.put('/municipalities/:id', auth, roleGuard('Administrador'), validate(paramsIdSchema, 'params'), validate(updateMunicipalitySchema, 'body'), MunicipalityController.update);
router.delete('/municipalities/:id', auth, roleGuard('Administrador'), validate(paramsIdSchema, 'params'), MunicipalityController.remove);

export default router;
