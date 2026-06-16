import { Sequelize } from 'sequelize'
import { env } from './env.js'

const isTest = env.NODE_ENV === 'test'

const sequelize = isTest
    ? new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
        define: {
            timestamps: true,
            underscored: false,
        },
    })
    : new Sequelize(env.DATABASE_URL, {
        dialect: 'postgres',
        logging: env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
            ssl: env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: false,
        },
    })

export const connectDB = async () => {
    try {
        await sequelize.authenticate()
        console.log('>>> DB IS CONNECTED' + (isTest ? ' (SQLite Test)' : ' (PostgreSQL)'))

        if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
            await sequelize.sync({ alter: false })
            console.log('>>> Tables synchronized')
        }
    } catch (error) {
        console.error('Database connection failed:', error)
        process.exit(1)
    }
}

export default sequelize
