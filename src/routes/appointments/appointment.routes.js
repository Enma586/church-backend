import { Router } from 'express';
import { AppointmentController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createAppointmentSchema, 
    updateAppointmentSchema, 
    queryAppointmentSchema,
    paramsIdSchema
} from '../../schemas/index.js';

const router = Router();

router.get('/', auth, validate(queryAppointmentSchema, 'query'), AppointmentController.findAll);
router.get('/:id', auth, validate(paramsIdSchema, 'params'), AppointmentController.findById);
router.post('/', auth, roleGuard('Coordinador', 'Empleado'), validate(createAppointmentSchema, 'body'), AppointmentController.create);
router.put('/:id', auth, roleGuard('Coordinador', 'Empleado'), validate(paramsIdSchema, 'params'), validate(updateAppointmentSchema, 'body'), AppointmentController.update);
router.delete('/:id', auth, roleGuard('Coordinador'), validate(paramsIdSchema, 'params'), AppointmentController.remove);

export default router;
