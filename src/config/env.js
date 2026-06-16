import dotenv from 'dotenv'

dotenv.config()

const requiredVars = [
    'PORT',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'CORS_ORIGIN'
]

// DATABASE_URL is required only if not in test mode
if (process.env.NODE_ENV !== 'test') {
    requiredVars.push('DATABASE_URL')
}

const missing = requiredVars.filter(key => !process.env[key])
if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
}

export const env = {
    PORT: process.env.PORT || '3000',
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    NODE_ENV: process.env.NODE_ENV || 'development',
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
    GOOGLE_DRIVE_ID: process.env.GOOGLE_DRIVE_ID,
    TZ: process.env.TZ || 'America/El_Salvador'
}
