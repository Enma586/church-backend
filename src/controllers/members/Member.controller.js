import * as MemberService from '../../services/members/Member.js';

/**
 * @description Creates a new member profile.
 */
export const create = async (req, res, next) => {
    try {
        // req.body includes personal data, family array, and geo IDs
        const member = await MemberService.createMember(req.body);
        
        res.status(201).json({ 
            success: true, 
            message: 'Miembro registrado exitosamente',
            data: member 
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Retrieves a paginated list of members with filters (status, gender, search).
 */
export const findAll = async (req, res, next) => {
    try {
        const result = await MemberService.findAllMembers(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Gets a single member by ID with populated address names.
 */
export const findById = async (req, res, next) => {
    try {
        const member = await MemberService.findMemberById(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
        }
        res.status(200).json({ success: true, data: member });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Updates member information and family ties.
 */
export const update = async (req, res, next) => {
    try {
        const member = await MemberService.updateMember(req.params.id, req.body);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
        }
        res.status(200).json({ success: true, data: member });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Deletes a member record.
 */
export const remove = async (req, res, next) => {
    try {
        const member = await MemberService.removeMember(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
        }
        res.status(200).json({ success: true, message: 'Registro de miembro eliminado' });
    } catch (err) {
        next(err);
    }
};