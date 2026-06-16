import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../../app.js'
import { Department, User, Member, Municipality } from '../../src/models/index.js'
import { env } from '../../src/config/env.js'

const generateAuthCookie = async (role = 'Coordinador') => {
    const dept = await Department.create({ name: 'Test Dept' })
    const muni = await Municipality.create({ name: 'Test Muni', departmentId: dept._id })
    const member = await Member.create({
        fullName: 'Test User',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Masculino',
        departmentId: dept._id,
        municipalityId: muni._id,
    })
    const user = await User.create({
        memberId: member._id,
        username: `testuser_${Date.now()}`,
        password: 'hashed_password',
        role,
        isActive: true,
    })

    const token = jwt.sign(
        { id: user._id },
        env.JWT_SECRET || process.env.JWT_SECRET,
        { expiresIn: '1h' }
    )

    return `token=${token}`
}

describe('Integration: Address API (Departments)', () => {
    beforeAll(() => {
        process.env.NODE_ENV = 'development'
    })

    describe('GET /api/address/departments', () => {
        it('should return 401 Unauthorized if no cookie is provided', async () => {
            const response = await request(app).get('/api/address/departments')
            expect(response.status).toBe(401)
            expect(response.body.success).toBe(false)
        })

        it('should return 200 and an empty paginated list if authenticated', async () => {
            const cookie = await generateAuthCookie('Coordinador')
            const response = await request(app)
                .get('/api/address/departments')
                .set('Cookie', [cookie])

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(Array.isArray(response.body.data)).toBe(true)
        })
    })

    describe('POST /api/address/departments', () => {
        it('should return 400 Bad Request if validation (Zod) fails', async () => {
            const cookie = await generateAuthCookie('Coordinador')
            const response = await request(app)
                .post('/api/address/departments')
                .set('Cookie', [cookie])
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
        })

        it('should return 201 Created and save to the database if data is valid', async () => {
            const cookie = await generateAuthCookie('Coordinador')
            const payload = { name: 'Santa Ana' }

            const response = await request(app)
                .post('/api/address/departments')
                .set('Cookie', [cookie])
                .send(payload)

            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.data.name).toBe('Santa Ana')

            const dbRecord = await Department.findOne({ where: { name: 'Santa Ana' } })
            expect(dbRecord).not.toBeNull()
            expect(dbRecord.name).toBe('Santa Ana')
        })
    })
})
