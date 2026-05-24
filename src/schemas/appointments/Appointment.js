import { z } from 'zod';
import { paginationFields } from '../pagination.js';
import { APPOINTMENT_STATUS } from '../../constants/index.js';

const EVENT_TYPES = ['cita_pastoral', 'evento_cronograma', 'bloqueo_agenda'];

// 1. Separamos los campos BASE sin los .refine()
const baseAppointmentFields = z.object({
    type: z.enum(EVENT_TYPES).default('cita_pastoral'),
    memberId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    participants: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    title: z.string().trim().min(1, 'El título es requerido'),
    description: z.string().trim().optional(),
    allDayDate: z.coerce.date().optional(),
    startDateTime: z.coerce.date().optional(),
    extras: z.string().trim().optional(),
    status: z.enum(APPOINTMENT_STATUS).default('Programada')
});

// 2. Esquema de CREACIÓN (Usamos la base y le agregamos sus validaciones)
const createAppointmentSchema = baseAppointmentFields
    .refine(data => {
        if (data.type === 'cita_pastoral') {
            return data.memberId && data.startDateTime;
        }
        if (data.type === 'evento_cronograma') {
            return !!data.allDayDate;
        }
        return true;
    }, { 
        message: 'Faltan datos requeridos para el tipo de evento seleccionado', 
        path: ['type'] 
    })


// 3. Esquema de ACTUALIZACIÓN (Usamos la base + .partial() y sus validaciones)
const updateAppointmentSchema = baseAppointmentFields.partial()
    .refine(data => Object.keys(data).length > 0, {
        message: 'Debe proporcionar al menos un campo para actualizar'
    })


// 4. Esquema de QUERY (Para las búsquedas y filtros)
const queryAppointmentSchema = z.object({
    ...paginationFields,
    status: z.enum(APPOINTMENT_STATUS).optional(),
    memberId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    type: z.enum(EVENT_TYPES).optional(),
    search: z.string().trim().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
}).refine(data => {
    if (data.dateFrom && data.dateTo) {
        return data.dateTo >= data.dateFrom;
    }
    return true;
}, { 
    message: 'La fecha final debe ser posterior a la inicial', 
    path: ['dateTo'] 
});

export {
    createAppointmentSchema,
    updateAppointmentSchema,
    queryAppointmentSchema
};