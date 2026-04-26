import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { UserController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createUserSchema, 
    updateUserSchema, 
    loginUserSchema,
    queryUserSchema,
    paramsIdSchema
} from '../../schemas/index.js';

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Demasiados intentos. Intenta en 15 minutos.' }
});

router.post('/login', loginLimiter, validate(loginUserSchema, 'body'), UserController.login);
router.post('/logout', auth, UserController.logout);
router.get('/me', auth, UserController.me);
router.get('/verify', auth, UserController.verifyToken);
router.get('/', auth, roleGuard('Coordinador'), validate(queryUserSchema, 'query'), UserController.findAll);
router.post('/', auth, roleGuard('Coordinador'), validate(createUserSchema, 'body'), UserController.create);
router.put('/:id', auth, roleGuard('Coordinador'), validate(paramsIdSchema, 'params'), validate(updateUserSchema, 'body'), UserController.update);

export default router;
