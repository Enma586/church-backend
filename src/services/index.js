/**
 * @description Main entry point for the Service Layer.
 * Centralizes all domain services for clean imports throughout the application.
 */

// 1. Address Domain (Geography)
export * from './address/index.js';

// 2. Appointments Domain (Scheduling & Feedback)
export * from './appointments/index.js';

// 3. Config Domain (System Brain)
export * from './config/index.js';

// 4. Members Domain (Identity & Security)
export * from './members/index.js';

// 5. Sacrament Domain (Spiritual Life)
export * from './sacraments/index.js';
