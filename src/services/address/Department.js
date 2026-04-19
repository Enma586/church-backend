import { Department } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';

export const createDepartment = async (data) => {
    return await Department.create(data);
};

export const findAllDepartments = async (query) => {
    const { page, limit, search } = query;

    const filter = search
        ? { name: { $regex: search, $options: 'i' } }
        : {};

    return await aggregatePaginate(Department, {
        filter,
        sort: { name: 1 },
        page,
        limit
    });
};

export const findDepartmentById = async (id) => {
    return await Department.findById(id);
};

export const updateDepartment = async (id, data) => {
    return await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const removeDepartment = async (id) => {
    return await Department.findByIdAndDelete(id);
};
