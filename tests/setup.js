import { beforeAll, afterAll, afterEach } from 'vitest'

let sequelize

beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'
    process.env.JWT_EXPIRES_IN = '7d'
    process.env.CORS_ORIGIN = 'http://localhost:5173'

    // Import models first so they register with sequelize before sync
    await import('../src/models/index.js')

    const { default: sq, connectDB } = await import('../src/config/db.js')
    sequelize = sq
    await connectDB()
})

afterEach(async () => {
    if (sequelize) {
        const tables = Object.keys(sequelize.models)
        for (const table of tables) {
            try {
                await sequelize.models[table].destroy({ truncate: true, cascade: true })
            } catch {
                // ignore truncate errors for models not supported by SQLite
            }
        }
    }
})

afterAll(async () => {
    if (sequelize) {
        await sequelize.close()
    }
})
