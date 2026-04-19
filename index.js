import { createServer } from 'http'
import app from './app.js'
import { connectDB } from './src/config/db.js'
import { initSocket } from './src/config/socket.js'
import { env } from './src/config/env.js'

connectDB()

const server = createServer(app)

initSocket(server)

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err)
    process.exit(1)
})

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err)
    server.close(() => process.exit(1))
})

server.listen(env.PORT, () => {
    console.log('Server is running on port', env.PORT)
})
