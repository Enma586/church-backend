import express from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from './src/middlewares/index.js'
import routes from './src/routes/index.js'
import { env } from './src/config/env.js'

const app = express()

app.use(helmet())

app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true
}))

app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

app.use('/api', routes)

app.use(errorHandler)

export default app
