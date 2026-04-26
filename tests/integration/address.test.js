/**
 * @file tests/integration/address.test.js
 * @description Integration tests for the Address domain (Departments).
 * Tests API endpoints, authentication, role guards, Zod validation, and database persistence.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import Department from '../../src/models/address/Department.js';

/**
 * @function generateTestToken
 * @description Creates a valid JWT for testing without needing to log in via the database.
 * @param {string} role - The role to assign to the fake user.
 * @returns {string} Signed JWT token.
 */
const generateTestToken = (role = 'Administrador') => {
  // Use the same secret your app uses, or a default string for testing
  const secret = process.env.JWT_SECRET || 'test_secret_key_123';
  return jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role },
    secret,
    { expiresIn: '1h' }
  );
};

describe('Integration: Address API (Departments)', () => {

  describe('GET /api/address/departments', () => {
    it('should return 401 Unauthorized if no cookie is provided', async () => {
      const response = await request(app).get('/api/address/departments');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 and an empty paginated list if authenticated', async () => {
      const token = generateTestToken();
      const response = await request(app)
        .get('/api/address/departments')
        .set('Cookie', [`token=${token}`]); // Simulating the HTTP-only cookie
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0); // DB is empty right now
    });
  });

  describe('POST /api/address/departments', () => {
    it('should return 403 Forbidden if user is not Administrador', async () => {
      // Simulate an employee trying to create a department
      const token = generateTestToken('Empleado'); 
      const response = await request(app)
        .post('/api/address/departments')
        .set('Cookie', [`token=${token}`])
        .send({ name: 'San Salvador' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 Bad Request if validation (Zod) fails', async () => {
      const token = generateTestToken('Administrador');
      const response = await request(app)
        .post('/api/address/departments')
        .set('Cookie', [`token=${token}`])
        .send({}); // Sending an empty object, missing the required 'name'

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 201 Created and save to the database if data is valid', async () => {
      const token = generateTestToken('Administrador');
      const payload = { name: 'Santa Ana' };

      const response = await request(app)
        .post('/api/address/departments')
        .set('Cookie', [`token=${token}`])
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Santa Ana');

      // Crucial step: Verify it actually saved to our in-memory MongoDB
      const dbRecord = await Department.findOne({ name: 'Santa Ana' });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.name).toBe('Santa Ana');
    });
  });

});