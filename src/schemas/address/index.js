/**
 * @description Entry point for the Address domain schemas.
 * Centralizes exports for Department and Municipality validation schemas.
 */
import { createDepartmentSchema, updateDepartmentSchema, queryDepartmentSchema } from './Department.js';
import { createMunicipalitySchema, updateMunicipalitySchema, queryMunicipalitySchema } from './Municipality.js';

export {
    createDepartmentSchema,
    updateDepartmentSchema,
    queryDepartmentSchema,
    createMunicipalitySchema,
    updateMunicipalitySchema,
    queryMunicipalitySchema
};
