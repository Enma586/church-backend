/**
 * @fileoverview Router maestro del módulo contable.
 * Monta todos los sub-routers bajo /api/accounting.
 *
 * Rutas:
 *   /accounts         - Catálogo de cuentas
 *   /journal-entries  - Asientos contables (partida doble)
 *   /products         - Catálogo de productos y servicios
 *   /period           - Cierre y reapertura de períodos
 *   /reports          - Reportes financieros
 */

import { Router } from 'express';
import accountRoutes from './account.routes.js';
import journalRoutes from './journal.routes.js';
import productRoutes from './product.routes.js';
import periodRoutes from './period.routes.js';
import reportRoutes from './reports.routes.js';

const router = Router();

router.use('/accounts', accountRoutes);
router.use('/journal-entries', journalRoutes);
router.use('/products', productRoutes);
router.use('/period', periodRoutes);
router.use('/reports', reportRoutes);
router.use('/cash-closings', cashClosingRoutes);

export default router;