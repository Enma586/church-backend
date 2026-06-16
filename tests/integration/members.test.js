import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../../app.js'
import { Department, Municipality, Member, User } from '../../src/models/index.js'
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
        username: `membertester_${Date.now()}`,
        password: 'hashed_password',
        role,
        isActive: true,
    })

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1h' })
    return `token=${token}`
}

describe('Integration: Members API', () => {
    beforeAll(() => {
        process.env.NODE_ENV = 'development'
    })

    describe('GET /api/members', () => {
        it('should return 401 if no token provided', async () => {
            const response = await request(app).get('/api/members')
            expect(response.status).toBe(401)
        })

        it('should return 200 with paginated members if authenticated', async () => {
            const cookie = await generateAuthCookie('Coordinador')

            const response = await request(app)
                .get('/api/members')
                .set('Cookie', [cookie])

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(Array.isArray(response.body.data)).toBe(true)
            expect(response.body.pagination).toBeDefined()
            expect(response.body.pagination).toHaveProperty('total')
            expect(response.body.pagination).toHaveProperty('totalPages')
            expect(response.body.pagination).toHaveProperty('currentPage')
            expect(response.body.pagination).toHaveProperty('perPage')
        })
    })

    describe('POST /api/members', () => {
        it('should return 400 if required fields are missing', async () => {
            const cookie = await generateAuthCookie('Coordinador')
            const response = await request(app)
                .post('/api/members')
                .set('Cookie', [cookie])
                .send({})

            expect(response.status).toBe(400)
        })
    })

    describe('PUT /api/members/:id', () => {
        it('should return 400 if ID format is invalid', async () => {
            const cookie = await generateAuthCookie('Coordinador')
            const response = await request(app)
                .put('/api/members/invalid-id')
                .set('Cookie', [cookie])
                .send({ fullName: 'Test' })

            expect(response.status).toBe(400)
        })
    })
})
