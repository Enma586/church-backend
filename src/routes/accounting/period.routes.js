/**
 * @fileoverview Rutas REST para cierre y reapertura de períodos contables.
 */

import { Router } from "express";
import { PeriodController } from "../../controllers/index.js";
import { auth, roleGuard, validate } from "../../middlewares/index.js";
import { closePeriodSchema } from "../../schemas/index.js";

const router = Router();

router.put(
  "/close",
  auth,
  roleGuard("Coordinador"),
  validate(closePeriodSchema, "body"),
  PeriodController.close,
);
router.put("/reopen", auth, roleGuard("Coordinador"), PeriodController.reopen);

export default router;
