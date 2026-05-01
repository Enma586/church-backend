import { google } from 'googleapis';
import { Configuration } from '../../models/index.js';
import { env } from '../../config/env.js';

const MAX_RETRIES        = 3;
const BASE_DELAY_MS      = 1000;
const API_TIMEOUT_MS     = 10_000;
const GOOGLE_EVENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

let authClient = null;
let authClientFingerprint = null;

const GoogleErrorType = Object.freeze({
    NOT_FOUND:       'NOT_FOUND',
    FORBIDDEN:       'FORBIDDEN',
    RATE_LIMIT:      'RATE_LIMIT',
    INVALID_INPUT:   'INVALID_INPUT',
    TRANSIENT:       'TRANSIENT',
    UNKNOWN:         'UNKNOWN',
});

const classifyGoogleError = (error) => {
    const code = error?.code;
    if (code === 404) return GoogleErrorType.NOT_FOUND;
    if (code === 403) return GoogleErrorType.FORBIDDEN;
    if (code === 429) return GoogleErrorType.RATE_LIMIT;
    if (code === 400) return GoogleErrorType.INVALID_INPUT;
    if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND' || !code)
        return GoogleErrorType.TRANSIENT;
    return GoogleErrorType.UNKNOWN;
};

const isRetryable = (errorType) =>
    [GoogleErrorType.TRANSIENT, GoogleErrorType.RATE_LIMIT].includes(errorType);

const sanitizeString = (value, maxLength = 500) => {
    if (typeof value !== 'string') return '';
    const cleaned = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    return cleaned.slice(0, maxLength);
};

const validateDates = (startDateTime, endDateTime) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Las fechas proporcionadas no son válidas');
    }
    if (end <= start) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    return { start, end };
};

const getAuthClient = async () => {
    const config = await Configuration.findOne();

    const clientEmail = config?.googleServiceAccountEmail || env.GOOGLE_CLIENT_EMAIL;
    const privateKey = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error(
            'Credenciales de Google Calendar no configuradas. ' +
            'Verifica GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY en .env.'
        );
    }

    const fingerprint = `${clientEmail}:${privateKey.slice(-20)}`;
    if (authClient && authClientFingerprint === fingerprint) {
        return authClient;
    }

    authClient = new google.auth.JWT(
        clientEmail,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/calendar']
    );
    authClientFingerprint = fingerprint;
    return authClient;
};

const getCalendarId = async () => {
    const config = await Configuration.findOne();
    return config?.googleCalendarId || env.GOOGLE_CALENDAR_ID || 'primary';
};

const getCalendarService = async () => {
    const auth = await getAuthClient();
    return google.calendar({ version: 'v3', auth });
};

const withRetry = async (fn, context = 'Google Calendar') => {
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const errorType = classifyGoogleError(error);

            if (!isRetryable(errorType)) {
                error._googleErrorType = errorType;
                throw error;
            }

            if (attempt < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                console.warn(
                    `[GoogleCalendar] Intento ${attempt}/${MAX_RETRIES} falló (${errorType}). ` +
                    `Reintentando en ${delay}ms... Contexto: ${context}`
                );
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    lastError._googleErrorType = classifyGoogleError(lastError);
    throw lastError;
};

const getTimezone = () => env.TZ;

// 1. Modificamos la firma para aceptar allDayDate y reminders
export const createCalendarEvent = async ({ title, description, startDateTime, endDateTime, allDayDate, attendeeEmail, reminders }) => {
    const calendar = await getCalendarService();
    const calendarId = await getCalendarId();
    const tz = getTimezone();

    let start, end;

    // 2. Lógica inteligente de fechas
    if (allDayDate) {
        // La API de Google exige que el 'end' de un evento de todo el día sea el día siguiente
        const nextDay = new Date(allDayDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const endAllDayStr = nextDay.toISOString().split('T')[0];

        start = { date: allDayDate };
        end = { date: endAllDayStr };
    } else if (startDateTime && endDateTime) {
        const dates = validateDates(startDateTime, endDateTime);
        start = { dateTime: dates.start.toISOString(), timeZone: tz };
        end = { dateTime: dates.end.toISOString(), timeZone: tz };
    } else {
        throw new Error('Se requiere allDayDate o startDateTime/endDateTime');
    }

    const event = {
        summary: sanitizeString(title, 200),
        description: sanitizeString(description, 5000),
        start,
        end,
        // 3. Aplicamos los recordatorios personalizados si vienen, si no, usamos los de por defecto (citas)
        reminders: reminders || {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 60 },
                { method: 'popup', minutes: 30 },
            ]
        }
    };

    if (attendeeEmail) {
        event.attendees = [{ email: attendeeEmail }];
    }

    const response = await withRetry(
        () => calendar.events.insert({ calendarId, requestBody: event, timeout: API_TIMEOUT_MS }),
        'createEvent'
    );

    const eventId = response.data?.id;
    if (!eventId || !GOOGLE_EVENT_ID_RE.test(eventId)) {
        throw new Error('Google Calendar devolvió un eventId inválido');
    }

    return eventId;
};

export const updateCalendarEvent = async (googleEventId, { title, description, startDateTime, endDateTime, allDayDate, reminders }) => {
    if (!googleEventId || !GOOGLE_EVENT_ID_RE.test(googleEventId)) {
        throw new Error(`googleEventId inválido: ${googleEventId}`);
    }

    const calendar = await getCalendarService();
    const calendarId = await getCalendarId();
    const tz = getTimezone();

    const event = {};
    if (title !== undefined)       event.summary     = sanitizeString(title, 200);
    if (description !== undefined) event.description  = sanitizeString(description, 5000);

    if (allDayDate) {
        const nextDay = new Date(allDayDate);
        nextDay.setDate(nextDay.getDate() + 1);
        event.start = { date: allDayDate };
        event.end = { date: nextDay.toISOString().split('T')[0] };
    } else if (startDateTime && endDateTime) {
        const dates = validateDates(startDateTime, endDateTime);
        event.start = { dateTime: dates.start.toISOString(), timeZone: tz };
        event.end = { dateTime: dates.end.toISOString(), timeZone: tz };
    }

    if (reminders) {
        event.reminders = reminders;
    }

    await withRetry(
        () => calendar.events.patch({
            calendarId,
            eventId: googleEventId,
            requestBody: event,
            timeout: API_TIMEOUT_MS,
        }),
        `updateEvent(${googleEventId})`
    );
};

export const deleteCalendarEvent = async (googleEventId) => {
    if (!googleEventId || !GOOGLE_EVENT_ID_RE.test(googleEventId)) {
        throw new Error(`googleEventId inválido: ${googleEventId}`);
    }

    const calendar = await getCalendarService();
    const calendarId = await getCalendarId();

    await withRetry(
        () => calendar.events.delete({
            calendarId,
            eventId: googleEventId,
            timeout: API_TIMEOUT_MS,
        }),
        `deleteEvent(${googleEventId})`
    );
};

export { GoogleErrorType, classifyGoogleError, isRetryable };