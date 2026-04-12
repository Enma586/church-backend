import dotenv from 'dotenv'

dotenv.config()

export const TOKEN_SECRET = process.env.JWT_SECRET
export const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN
