/**
 * @file app.js
 * @description Central Express application configuration. 
 * Sets up global middlewares, security headers, and mounts the API router.
 */

import express from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { errorHandler } from './src/middlewares/index.js'
import routes from './src/routes/index.js'

const app = express()

/**
 * @section Cross-Origin Resource Sharing (CORS)
 * Configures the server to allow requests from the Frontend origin.
 * 'credentials: true' is mandatory for handling JWT via HTTP-only cookies.
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

/**
 * @section Global Middlewares
 */
// HTTP request logger for development (prints to your Kitty/Zsh terminal)
app.use(morgan('dev'))

// Built-in body-parser to handle incoming JSON payloads
app.use(express.json())

// Parse Cookie header and populate req.cookies (essential for Auth)
app.use(cookieParser())

/**
 * @section Routing Layer
 * Mounts all domain routes under the /api prefix.
 * e.g., /api/members, /api/appointments, etc.
 */
app.use('/api', routes)

/**
 * @section Error Handling Layer
 * Global error handler middleware.
 * MUST be the last middleware in the stack to catch all forwarded errors.
 */
app.use(errorHandler)

export default app