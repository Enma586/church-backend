import { z } from 'zod';

export const paramsIdSchema = z.object({
    id: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'El ID debe ser un valor hexadecimal válido de 24 caracteres')
});
