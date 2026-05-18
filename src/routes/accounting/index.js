import { Router } from 'express';
import accountRoutes from './account.routes.js';
import journalRoutes from './journal.routes.js';
import productRoutes from './product.routes.js';
import periodRoutes from './period.routes.js';
import reportRoutes from './reports.routes.js';
import cashClosingRoutes from './cash-closing.routes.js';

const router = Router();

router.use('/accounts', accountRoutes);
router.use('/journal-entries', journalRoutes);
router.use('/products', productRoutes);
router.use('/period', periodRoutes);
router.use('/reports', reportRoutes);
router.use('/cash-closings', cashClosingRoutes);

export default router;