/**
 * @fileoverview Schema Zod para cierre y reapertura de períodos contables.
 */

import { z } from 'zod';

export const closePeriodSchema = z.object({
    date: z.coerce.date({ message: 'La fecha de cierre es requerida' })
});