import Joi from 'joi';

export const paramsIdSchema = Joi.object({
    id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.hex': 'El ID debe ser un valor hexadecimal válido',
            'string.length': 'El ID debe tener 24 caracteres',
            'any.required': 'El ID es requerido'
        })
});
