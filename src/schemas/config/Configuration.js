import { z } from 'zod';

const configurationSchema = z.object({
    googleCalendarId: z.string()
        .trim()
        .default('primary'),
    googleServiceAccountEmail: z.string()
        .trim()
        .email()
        .optional()
        .or(z.literal('')),
    enableLocalNotifications: z.boolean()
        .default(true),
    notificationRefreshInterval: z.number()
        .int()
        .min(1)
        .default(60),
    churchName: z.string()
        .trim()
        .default('Parroquia Local'),
    lastBackupDate: z.coerce.date()
        .optional()
});

export {
    configurationSchema
};
