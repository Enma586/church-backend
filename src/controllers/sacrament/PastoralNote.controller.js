import * as PastoralNoteService from '../../services/sacraments/PastoralNote.js';

/**
 * @description Creates a pastoral note. Automatically assigns the logged user as author.
 */
export const create = async (req, res, next) => {
    try {
        const noteData = {
            ...req.body,
            authorId: req.user._id // Taken from auth middleware
        };
        const note = await PastoralNoteService.createPastoralNote(noteData);
        res.status(201).json({ success: true, data: note });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Lists notes. Filters like 'isSensitive' are handled by the service.
 */
export const findAll = async (req, res, next) => {
    try {
        const result = await PastoralNoteService.findAllPastoralNotes(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Gets a specific note with author and member details.
 */
export const findById = async (req, res, next) => {
    try {
        const note = await PastoralNoteService.findPastoralNoteById(req.params.id);
        if (!note) {
            return res.status(404).json({ success: false, message: 'Nota pastoral no encontrada' });
        }
        res.status(200).json({ success: true, data: note });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Updates the content or sensitivity flag of a note.
 */
export const update = async (req, res, next) => {
    try {
        const note = await PastoralNoteService.updatePastoralNote(req.params.id, req.body);
        if (!note) {
            return res.status(404).json({ success: false, message: 'Nota pastoral no encontrada' });
        }
        res.status(200).json({ success: true, data: note });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Deletes a pastoral note.
 */
export const remove = async (req, res, next) => {
    try {
        const note = await PastoralNoteService.removePastoralNote(req.params.id);
        if (!note) {
            return res.status(404).json({ success: false, message: 'Nota pastoral no encontrada' });
        }
        res.status(200).json({ success: true, message: 'Nota eliminada' });
    } catch (err) {
        next(err);
    }
};