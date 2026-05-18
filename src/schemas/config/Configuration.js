import { z } from "zod";

const configurationSchema = z.object({
  googleCalendarId: z.string().trim().default("primary"),
  googleServiceAccountEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),
  enableLocalNotifications: z.boolean().default(true),
  notificationRefreshInterval: z.number().int().min(1).default(60),
  churchName: z.string().trim().default("Parroquia Local"),
  lastBackupDate: z.coerce.date().optional(),
  backupFrequencyDays: z.number().int().min(1).default(7).optional(),
  rolePermissions: z.record(z.string(), z.array(z.string())).optional(),
  accountingClosedDate: z.coerce.date().nullable().optional(),
  defaultCashAccountId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .nullable()
    .optional(), // ← AGREGAR
});

export { configurationSchema };
