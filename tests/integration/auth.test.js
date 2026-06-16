import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../../app.js'
import { Department, Municipality, Member, User } from '../../src/models/index.js'
import { env } from '../../src/config/env.js'

describe('Integration: Authentication Middleware', () => {
    beforeAll(() => {
        process.env.NODE_ENV = 'test'
    })

    const createTestUser = async (isActive = true) => {
        const dept = await Department.create({ name: 'Test Dept' })
        const muni = await Municipality.create({ name: 'Test Muni', departmentId: dept._id })
        const member = await Member.create({
            fullName: 'Test',
            dateOfBirth: new Date('2000-01-01'),
            gender: 'Masculino',
            departmentId: dept._id,
            municipalityId: muni._id,
        })
        const user = await User.create({
            memberId: member._id,
            username: `user_${Date.now()}`,
            password: 'hashed_password',
            role: 'Subcoordinador',
            isActive,
        })
        return user
    }

    const generateToken = (userId) => {
        return jwt.sign({ id: userId }, env.JWT_SECRET || process.env.JWT_SECRET, { expiresIn: '1h' })
    }

    it('should reject requests without a token (401)', async () => {
        const response = await request(app).get('/api/address/departments')
        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toContain('token')
    })

    it('should reject requests with an invalid token (401)', async () => {
        const response = await request(app)
            .get('/api/address/departments')
            .set('Cookie', ['token=invalid_jwt_token'])

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject requests with an expired token (401)', async () => {
        const user = await createTestUser()
        const expiredToken = jwt.sign(
            { id: user._id },
            env.JWT_SECRET || process.env.JWT_SECRET,
            { expiresIn: '0s' }
        )

        await new Promise(resolve => setTimeout(resolve, 1000))

        const response = await request(app)
            .get('/api/address/departments')
            .set('Cookie', [`token=${expiredToken}`])

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject requests from inactive users (401)', async () => {
        const inactiveUser = await createTestUser(false)
        const token = generateToken(inactiveUser._id)

        const response = await request(app)
            .get('/api/address/departments')
            .set('Cookie', [`token=${token}`])

        expect(response.status).toBe(401)
        expect(response.body.message).toContain('desactivada')
    })
})
