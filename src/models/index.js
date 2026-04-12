/**
 * @description Main entry point for the Database Layer.
 * Centralizes all domain models for clean imports throughout the application.
 */

// 1. Address Domain (Geography)
import { Department, Municipality } from './address/index.js';

// 2. Appointments Domain (Scheduling & Feedback)
import { Appointment } from './appointments/index.js';

// 3. Config Domain (System Brain)
import { Configuration } from './config/index.js';

// 4. Members Domain (Identity & Security)
import { Member, User } from './members/index.js';

// 5. Sacrament Domain (Spiritual Life)
import { Sacrament, PastoralNote } from './sacrament/index.js';

/**
 * Clean export of all models.
 * Usage: import { Member, Sacrament, Appointment } from './models/index.js';
 */
export {
    Department,
    Municipality,
    Appointment,
    Configuration,
    Member,
    User,
    Sacrament,
    PastoralNote
};