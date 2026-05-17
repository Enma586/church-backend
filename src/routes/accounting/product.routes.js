/**
 * @fileoverview Rutas REST para el catálogo de productos y servicios.
 */

import { Router } from "express";
import { ProductController } from "../../controllers/index.js";
import { auth, roleGuard, validate } from "../../middlewares/index.js";
import {
  createProductSchema,
  updateProductSchema,
  queryProductSchema,
  paramsIdSchema,
} from "../../schemas/index.js";

const router = Router();

router.get(
  "/",
  auth,
  validate(queryProductSchema, "query"),
  ProductController.findAll,
);
router.get(
  "/:id",
  auth,
  validate(paramsIdSchema, "params"),
  ProductController.findById,
);
router.post(
  "/",
  auth,
  roleGuard("Coordinador", "Subcoordinador"),
  validate(createProductSchema, "body"),
  ProductController.create,
);
router.put(
  "/:id",
  auth,
  roleGuard("Coordinador", "Subcoordinador"),
  validate(paramsIdSchema, "params"),
  validate(updateProductSchema, "body"),
  ProductController.update,
);
router.delete(
  "/:id",
  auth,
  roleGuard("Coordinador"),
  validate(paramsIdSchema, "params"),
  ProductController.remove,
);

export default router;
