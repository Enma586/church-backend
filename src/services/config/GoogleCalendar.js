import { google } from "googleapis";
import { Configuration } from "../../models/index.js";
import { env } from "../../config/env.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const API_TIMEOUT_MS = 10_000;
const GOOGLE_EVENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

let authClient = null;
let authClientFingerprint = null;

const GoogleErrorType = Object.freeze({
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  RATE_LIMIT: "RATE_LIMIT",
  INVALID_INPUT: "INVALID_INPUT",
  TRANSIENT: "TRANSIENT",
  UNKNOWN: "UNKNOWN",
});

const classifyGoogleError = (error) => {
  const code = error?.code;
  if (code === 404) return GoogleErrorType.NOT_FOUND;
  if (code === 403) return GoogleErrorType.FORBIDDEN;
  if (code === 429) return GoogleErrorType.RATE_LIMIT;
  if (code === 400) return GoogleErrorType.INVALID_INPUT;
  if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND" || !code)
    return GoogleErrorType.TRANSIENT;
  return GoogleErrorType.UNKNOWN;
};

const isRetryable = (errorType) =>
  [GoogleErrorType.TRANSIENT, GoogleErrorType.RATE_LIMIT].includes(errorType);

const sanitizeString = (value, maxLength = 500) => {
  if (typeof value !== "string") return "";
  const cleaned = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  return cleaned.slice(0, maxLength);
};

const getAuthClient = async () => {
  const config = await Configuration.findOne();

  const clientEmail = config?.googleServiceAccountEmail || env.GOOGLE_CLIENT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY
    ?.replace(/\\n/g, "\n")
    ?.replace(/^"|"$/g, "");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Credenciales de Google Calendar no configuradas. " +
        "Verifica GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY en .env.",
    );
  }

  const fingerprint = `${clientEmail}:${privateKey.slice(-20)}`;
  if (authClient && authClientFingerprint === fingerprint) {
    return authClient;
  }

  authClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  authClientFingerprint = fingerprint;
  return authClient;
};

const getCalendarId = async () => {
  const config = await Configuration.findOne();
  
  // Si la BD dice "primary" (el valor por defecto) o está vacío, intenta usar el del .env
  if (!config?.googleCalendarId || config.googleCalendarId === 'primary') {
      return env.GOOGLE_CALENDAR_ID || 'primary';
  }
  
  return config.googleCalendarId;
};

const getCalendarService = async () => {
  const auth = await getAuthClient();
  return google.calendar({ version: "v3", auth });
};

const getTimezone = () => env.TZ;

const withRetry = async (fn, context = "Google Calendar") => {
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
            `Reintentando en ${delay}ms... Contexto: ${context}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  lastError._googleErrorType = classifyGoogleError(lastError);
  throw lastError;
};

/**
 * Creates a calendar event.
 * - allDayDate: full-day event (date only)
 * - startDateTime: timed event, defaults to 1h duration
 */
export const createCalendarEvent = async ({
  title,
  description,
  startDateTime,
  allDayDate,
  attendeeEmail,
  reminders,
}) => {
  const calendar = await getCalendarService();
  const calendarId = await getCalendarId();
  const tz = getTimezone();

  let start, end;

  if (allDayDate) {
    const nextDay = new Date(allDayDate);
    nextDay.setDate(nextDay.getDate() + 1);
    start = { date: allDayDate };
    end = { date: nextDay.toISOString().split("T")[0] };
  } else if (startDateTime) {
    const startDate = new Date(startDateTime);
    if (isNaN(startDate.getTime())) throw new Error("Fecha de inicio inválida");
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1h
    start = { dateTime: startDate.toISOString(), timeZone: tz };
    end = { dateTime: endDate.toISOString(), timeZone: tz };
  } else {
    throw new Error("Se requiere allDayDate o startDateTime");
  }

  const event = {
    summary: sanitizeString(title, 200),
    description: sanitizeString(description, 5000),
    start,
    end,
    reminders: reminders || {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  if (attendeeEmail) {
    event.attendees = [{ email: attendeeEmail }];
  }

  const response = await withRetry(
    () =>
      calendar.events.insert({
        calendarId,
        requestBody: event,
        timeout: API_TIMEOUT_MS,
      }),
    "createEvent",
  );

  const eventId = response.data?.id;
  if (!eventId || !GOOGLE_EVENT_ID_RE.test(eventId)) {
    throw new Error("Google Calendar devolvió un eventId inválido");
  }

  return eventId;
};

/**
 * Patches an existing calendar event.
 */
export const updateCalendarEvent = async (
  googleEventId,
  { title, description, startDateTime, allDayDate, reminders },
) => {
  if (!googleEventId || !GOOGLE_EVENT_ID_RE.test(googleEventId)) {
    throw new Error(`googleEventId inválido: ${googleEventId}`);
  }

  const calendar = await getCalendarService();
  const calendarId = await getCalendarId();
  const tz = getTimezone();

  const event = {};
  if (title !== undefined) event.summary = sanitizeString(title, 200);
  if (description !== undefined) event.description = sanitizeString(description, 5000);

  if (allDayDate) {
    const nextDay = new Date(allDayDate);
    nextDay.setDate(nextDay.getDate() + 1);
    event.start = { date: allDayDate };
    event.end = { date: nextDay.toISOString().split("T")[0] };
  } else if (startDateTime) {
    const startDate = new Date(startDateTime);
    if (!isNaN(startDate.getTime())) {
      event.start = { dateTime: startDate.toISOString(), timeZone: tz };
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      event.end = { dateTime: endDate.toISOString(), timeZone: tz };
    }
  }

  if (reminders) {
    event.reminders = reminders;
  }

  await withRetry(
    () =>
      calendar.events.patch({
        calendarId,
        eventId: googleEventId,
        requestBody: event,
        timeout: API_TIMEOUT_MS,
      }),
    `updateEvent(${googleEventId})`,
  );
};

/**
 * Deletes a calendar event by its Google event ID.
 */
export const deleteCalendarEvent = async (googleEventId) => {
  if (!googleEventId || !GOOGLE_EVENT_ID_RE.test(googleEventId)) {
    throw new Error(`googleEventId inválido: ${googleEventId}`);
  }

  const calendar = await getCalendarService();
  const calendarId = await getCalendarId();

  await withRetry(
    () =>
      calendar.events.delete({
        calendarId,
        eventId: googleEventId,
        timeout: API_TIMEOUT_MS,
      }),
    `deleteEvent(${googleEventId})`,
  );
};

export { GoogleErrorType, classifyGoogleError, isRetryable };