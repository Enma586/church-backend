import { Router } from 'express';
import { CashClosingController } from '../../controllers/index.js';
import { auth, roleGuard, validate } from '../../middlewares/index.js';
import {
  createCashClosingSchema,
  queryCashClosingSchema,
  paramsIdSchema,
} from '../../schemas/index.js';

const router = Router();

router.get(
  '/',
  auth,
  validate(queryCashClosingSchema, 'query'),
  CashClosingController.findAll,
);

router.get(
  '/denominations',
  auth,
  CashClosingController.getDenominations,
);

router.get(
  '/:id',
  auth,
  validate(paramsIdSchema, 'params'),
  CashClosingController.findById,
);

router.post(
  '/',
  auth,
  roleGuard('Coordinador', 'Subcoordinador'),
  validate(createCashClosingSchema, 'body'),
  CashClosingController.create,
);

export default router;