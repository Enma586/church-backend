/**
 * @description Entry point for the Sacraments domain schemas.
 * Exports validation schemas for sacraments and pastoral follow-up notes.
 */
import { createSacramentSchema, updateSacramentSchema, querySacramentSchema } from './Sacrament.js';
import { createPastoralNoteSchema, updatePastoralNoteSchema, queryPastoralNoteSchema } from './PastoralNote.js';

export {
    createSacramentSchema,
    updateSacramentSchema,
    querySacramentSchema,
    createPastoralNoteSchema,
    updatePastoralNoteSchema,
    queryPastoralNoteSchema
};
