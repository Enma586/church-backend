/**
 * @fileoverview Barrel file para schemas del módulo contable.
 */

export {
    createAccountSchema,
    updateAccountSchema,
    queryAccountSchema
} from './Account.js';

export {
    createProductSchema,
    updateProductSchema,
    queryProductSchema
} from './Product.js';

export {
    createJournalEntrySchema,
    updateJournalEntrySchema,
    queryJournalEntrySchema
} from './Journal.js';

export { closePeriodSchema } from './Period.js';

export {
    ledgerQuerySchema,
    trialBalanceQuerySchema,
    balanceSheetQuerySchema,
    incomeStatementQuerySchema,
    exportJournalPDFSchema
} from './Reports.js';

export {
    createCashClosingSchema,
    queryCashClosingSchema
}from './CashClosing.js'