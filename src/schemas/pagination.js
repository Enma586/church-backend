import { z } from 'zod';

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(10);

export const paginationFields = { page, limit };

export const paginationSchema = z.object(paginationFields);
