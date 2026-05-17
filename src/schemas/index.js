/**
 * @description Main entry point for the Validation Layer.
 * Centralizes all domain schemas for clean imports throughout the application.
 */

// 1. Address Domain (Geography)
import {
    createDepartmentSchema,
    updateDepartmentSchema,
    queryDepartmentSchema,
    createMunicipalitySchema,
    updateMunicipalitySchema,
    queryMunicipalitySchema
} from './address/index.js';

// 2. Appointments Domain (Scheduling & Feedback)
import {
    createAppointmentSchema,
    updateAppointmentSchema,
    queryAppointmentSchema
} from './appointments/index.js';

// 3. Config Domain (System Brain)
import {
    configurationSchema
} from './config/index.js';

// 4. Members Domain (Identity & Security)
import {
    createMemberSchema,
    updateMemberSchema,
    queryMemberSchema,
    createUserSchema,
    updateUserSchema,
    loginUserSchema,
    queryUserSchema,
    registerSchema
} from './members/index.js';

// 5. Sacrament Domain (Spiritual Life)
import {
    createSacramentSchema,
    updateSacramentSchema,
    querySacramentSchema,
    createPastoralNoteSchema,
    updatePastoralNoteSchema,
    queryPastoralNoteSchema
} from './sacraments/index.js';

// 6. Accounting Domain (Financial)
import {
    createAccountSchema,
    updateAccountSchema,
    queryAccountSchema,
    createProductSchema,
    updateProductSchema,
    queryProductSchema,
    createJournalEntrySchema,
    updateJournalEntrySchema,
    queryJournalEntrySchema,
    closePeriodSchema,
    ledgerQuerySchema,
    trialBalanceQuerySchema,
    balanceSheetQuerySchema,
    incomeStatementQuerySchema
} from './accounting/index.js';

// 7. Pagination
import {
    paginationSchema
} from './pagination.js';

// 8. Params
import {
    paramsIdSchema
} from './params.js';

/**
 * Clean export of all schemas.
 * Usage: import { createMemberSchema, loginUserSchema } from './schemas/index.js';
 */
export {
    createDepartmentSchema,
    updateDepartmentSchema,
    queryDepartmentSchema,
    createMunicipalitySchema,
    updateMunicipalitySchema,
    queryMunicipalitySchema,
    createAppointmentSchema,
    updateAppointmentSchema,
    queryAppointmentSchema,
    configurationSchema,
    createMemberSchema,
    updateMemberSchema,
    queryMemberSchema,
    createUserSchema,
    updateUserSchema,
    loginUserSchema,
    queryUserSchema,
    createSacramentSchema,
    updateSacramentSchema,
    querySacramentSchema,
    createPastoralNoteSchema,
    updatePastoralNoteSchema,
    queryPastoralNoteSchema,
    createAccountSchema,
    updateAccountSchema,
    queryAccountSchema,
    createProductSchema,
    updateProductSchema,
    queryProductSchema,
    createJournalEntrySchema,
    updateJournalEntrySchema,
    queryJournalEntrySchema,
    closePeriodSchema,
    ledgerQuerySchema,
    trialBalanceQuerySchema,
    balanceSheetQuerySchema,
    incomeStatementQuerySchema,
    paginationSchema,
    paramsIdSchema,
    registerSchema
};