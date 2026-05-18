/**
 * @fileoverview Barrel file para controladores del módulo contable.
 */

import * as AccountController from './Account.js';
import * as JournalController from './Journal.js';
import * as ProductController from './Product.js';
import * as PeriodController from './Period.js';
import * as ReportsController from './Reports.js';
import * as CashClosingController from './CashClosing.js';

export {
    AccountController,
    JournalController,
    ProductController,
    PeriodController,
    ReportsController,
    CashClosingController
};