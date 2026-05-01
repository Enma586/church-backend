import { z } from 'zod';
import { paginationFields } from '../pagination.js';
import { APPOINTMENT_STATUS } from '../../constants/index.js';

const EVENT_TYPES = ['cita_pastoral', 'evento_cronograma', 'bloqueo_agenda'];

const createAppointmentSchema = z.object({
    type: z.enum(EVENT_TYPES).default('cita_pastoral'),
    memberId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    participants: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    title: z.string().trim().min(1, 'El título es requerido'),
    description: z.string().trim().optional(),
    // Campos de fecha
    allDayDate: z.coerce.date().optional(),
    startDateTime: z.coerce.date().optional(),
    endDateTime: z.coerce.date().optional(),
    // Nuevo campo
    extras: z.string().trim().optional(),
    status: z.enum(APPOINTMENT_STATUS).default('Programada')
})
.refine(data => {
    // Validación lógica:
    if (data.type === 'cita_pastoral') {
        // Citas requieren miembro y horas inicio/fin
        return data.memberId && data.startDateTime && data.endDateTime;
    }
    if (data.type === 'evento_cronograma') {
        // Cronograma requiere fecha de todo el día
        return !!data.allDayDate;
    }
    return true;
}, { 
    message: 'Faltan datos requeridos para el tipo de evento seleccionado', 
    path: ['type'] 
})
.refine(data => {
    if (data.startDateTime && data.endDateTime) {
        return data.endDateTime > data.startDateTime;
    }
    return true;
}, { 
    message: 'La hora de fin debe ser posterior a la de inicio', 
    path: ['endDateTime'] 
});

// El esquema de actualización (Update) debe seguir la misma lógica de campos
const updateAppointmentSchema = createAppointmentSchema.partial().refine(data => {
    if (data.startDateTime && data.endDateTime) {
        return data.endDateTime > data.startDateTime;
    }
    return true;
}, { message: 'La hora de fin debe ser posterior a la de inicio', path: ['endDateTime'] });


export const queryAppointmentSchema = z.object({
    ...paginationFields,
    status: z.enum(APPOINTMENT_STATUS).optional(),
    memberId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    type: z.enum(EVENT_TYPES).optional(),
    search: z.string().trim().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});
export { createAppointmentSchema, updateAppointmentSchema, queryAppointmentSchema };