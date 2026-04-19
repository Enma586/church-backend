import { Server } from 'socket.io'
import { env } from './env.js'

let io

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: env.CORS_ORIGIN,
            credentials: true
        }
    })

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id)

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id)
        })
    })

    return io
}

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized')
    return io
}
