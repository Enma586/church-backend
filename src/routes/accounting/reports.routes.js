import { Router } from "express";
import { ReportsController } from "../../controllers/index.js";
import { auth, validate } from "../../middlewares/index.js";
import {
  ledgerQuerySchema,
  trialBalanceQuerySchema,
  balanceSheetQuerySchema,
  incomeStatementQuerySchema,
  exportJournalPDFSchema,
} from "../../schemas/index.js";

const router = Router();

router.get(
  "/ledger",
  auth,
  validate(ledgerQuerySchema, "query"),
  ReportsController.ledger,
);
router.get(
  "/trial-balance",
  auth,
  validate(trialBalanceQuerySchema, "query"),
  ReportsController.trialBalance,
);
router.get(
  "/balance-sheet",
  auth,
  validate(balanceSheetQuerySchema, "query"),
  ReportsController.balanceSheet,
);
router.get(
  "/income-statement",
  auth,
  validate(incomeStatementQuerySchema, "query"),
  ReportsController.incomeStatement,
);

// ── NUEVO: Exportar PDF ───────────────────────────────────────────
router.get(
  "/journal-pdf",
  auth,
  validate(exportJournalPDFSchema, "query"),
  ReportsController.exportJournalPDF,
);

export default router;
