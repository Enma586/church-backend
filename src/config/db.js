import mongoose from 'mongoose'
import { env } from './env.js'

export const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGO_URI)
        console.log(">>> DB IS CONNECTED")
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}
