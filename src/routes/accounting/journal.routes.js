/**
 * @fileoverview Rutas REST para asientos contables con partida doble.
 */

import { Router } from "express";
import { JournalController } from "../../controllers/index.js";
import {
  auth,
  roleGuard,
  validate,
  checkAccountingPeriod,
} from "../../middlewares/index.js";
import {
  createJournalEntrySchema,
  updateJournalEntrySchema,
  queryJournalEntrySchema,
  paramsIdSchema,
} from "../../schemas/index.js";

const router = Router();

router.get(
  "/",
  auth,
  validate(queryJournalEntrySchema, "query"),
  JournalController.findAll,
);
router.get(
  "/:id",
  auth,
  validate(paramsIdSchema, "params"),
  JournalController.findById,
);
router.post(
  "/",
  auth,
  roleGuard("Coordinador", "Subcoordinador"),
  validate(createJournalEntrySchema, "body"),
  checkAccountingPeriod,
  JournalController.create,
);
router.put(
  "/:id",
  auth,
  roleGuard("Coordinador", "Subcoordinador"),
  validate(paramsIdSchema, "params"),
  validate(updateJournalEntrySchema, "body"),
  JournalController.update,
);
router.delete(
  "/:id",
  auth,
  roleGuard("Coordinador"),
  validate(paramsIdSchema, "params"),
  JournalController.remove,
);

export default router;
