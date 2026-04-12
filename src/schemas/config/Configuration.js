import Joi from 'joi';

/**
 * @description Validation schema for Configuration creation/update.
 */
const configurationSchema = Joi.object({
    googleCalendarId: Joi.string()
        .trim()
        .default('primary'),
    googleServiceAccountEmail: Joi.string()
        .trim()
        .email()
        .optional(),
    enableLocalNotifications: Joi.boolean()
        .default(true),
    notificationRefreshInterval: Joi.number()
        .integer()
        .min(1)
        .default(60),
    churchName: Joi.string()
        .trim()
        .default('Parroquia Local'),
    lastBackupDate: Joi.date()
        .optional()
});

export {
    configurationSchema
};
