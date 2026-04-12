import dotenv from 'dotenv'
import { createServer } from 'http'
import app from './app.js'
import { connectDB } from './src/config/db.js'
import { initSocket } from './src/config/socket.js'

dotenv.config()

connectDB()

const server = createServer(app)

initSocket(server)

server.listen(process.env.PORT, () => {
  console.log('Server is running', process.env.PORT)
})
