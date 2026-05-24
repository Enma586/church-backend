/**
 * @fileoverview Rutas REST para el catálogo de cuentas contables.
 */

import { Router } from "express";
import { AccountController } from "../../controllers/index.js";
import { auth, roleGuard, validate } from "../../middlewares/index.js";
import {
  createAccountSchema,
  updateAccountSchema,
  queryAccountSchema,
  paramsIdSchema,
} from "../../schemas/index.js";

const router = Router();

router.get(
  "/",
  auth,
  validate(queryAccountSchema, "query"),
  AccountController.findAll,
);
router.get(
  "/:id",
  auth,
  validate(paramsIdSchema, "params"),
  AccountController.findById,
);
router.post(
  "/",
  auth,
  roleGuard("Coordinador", "Subcoordinador"),
  validate(createAccountSchema, "body"),
  AccountController.create,
);
router.put(
  "/:id",
  auth,
  roleGuard("Coordinador", "Subcoordinador"),
  validate(paramsIdSchema, "params"),
  validate(updateAccountSchema, "body"),
  AccountController.update,
);
router.delete(
  "/:id",
  auth,
  roleGuard("Coordinador", "Subcoordinador"),
  validate(paramsIdSchema, "params"),
  AccountController.remove,
);

export default router;
