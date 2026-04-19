import { Municipality } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';

export const createMunicipality = async (data) => {
    return await Municipality.create(data);
};

export const findAllMunicipalities = async (query) => {
    const { page, limit, search, departmentId } = query;

    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (departmentId) filter.departmentId = departmentId;

    return await aggregatePaginate(Municipality, {
        filter,
        sort: { name: 1 },
        page,
        limit
    });
};

export const findMunicipalityById = async (id) => {
    return await Municipality.findById(id).populate('departmentId', 'name isoCode');
};

export const updateMunicipality = async (id, data) => {
    return await Municipality.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const removeMunicipality = async (id) => {
    return await Municipality.findByIdAndDelete(id);
};
