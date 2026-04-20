import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { MemberController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import { 
    createMemberSchema, 
    updateMemberSchema, 
    queryMemberSchema,
    paramsIdSchema
} from '../../schemas/index.js';

const router = Router();

router.get('/', auth, validate(queryMemberSchema, 'query'), MemberController.findAll);
router.get('/:id', auth, validate(paramsIdSchema, 'params'), MemberController.findById);
router.post('/', auth, roleGuard('Coordinador'), validate(createMemberSchema, 'body'), MemberController.create);
router.put('/:id', auth, roleGuard('Coordinador'), validate(paramsIdSchema, 'params'), validate(updateMemberSchema, 'body'), MemberController.update);
router.delete('/:id', auth, roleGuard('Coordinador'), validate(paramsIdSchema, 'params'), MemberController.remove);

export default router;
