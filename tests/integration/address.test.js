/**
 * @file tests/integration/address.test.js
 * @description Integration tests for the Address domain (Departments).
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import Department from '../../src/models/address/Department.js';
import User from '../../src/models/members/User.js';
import { env } from '../../src/config/env.js';

const generateAuthCookie = async (role = 'Coordinador') => {
  const userId = new mongoose.Types.ObjectId();
  
  const mockUser = new User({
    _id: userId,
    username: `testuser_${Date.now()}`,
    password: 'hashed_password',
    role: role,
    isActive: true
  });
  
  await mockUser.save({ validateBeforeSave: false });

  const token = jwt.sign(
    { id: userId },
    env.JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return `token=${token}`;
};

describe('Integration: Address API (Departments)', () => {

  // Forzamos el entorno de desarrollo para que errorHandler devuelva el stack trace
  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });

  describe('GET /api/address/departments', () => {
    it('should return 401 Unauthorized if no cookie is provided', async () => {
      const response = await request(app).get('/api/address/departments');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 and an empty paginated list if authenticated', async () => {
      const cookie = await generateAuthCookie('Coordinador');
      const response = await request(app)
        .get('/api/address/departments')
        .set('Cookie', [cookie]); 
      
      // Bloque de depuración para capturar el error exacto
      if (response.status === 500) {
        console.error('DETALLE DEL ERROR 500:');
        console.error(JSON.stringify(response.body, null, 2));
      }
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/address/departments', () => {
    it('should return 403 Forbidden if user is Subcoordinador (not Coordinador)', async () => {
      const cookie = await generateAuthCookie('Subcoordinador'); 
      const response = await request(app)
        .post('/api/address/departments')
        .set('Cookie', [cookie])
        .send({ name: 'San Salvador' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 Bad Request if validation (Zod) fails', async () => {
      const cookie = await generateAuthCookie('Coordinador');
      const response = await request(app)
        .post('/api/address/departments')
        .set('Cookie', [cookie])
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 201 Created and save to the database if data is valid', async () => {
      const cookie = await generateAuthCookie('Coordinador');
      const payload = { name: 'Santa Ana' };

      const response = await request(app)
        .post('/api/address/departments')
        .set('Cookie', [cookie])
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Santa Ana');

      const dbRecord = await Department.findOne({ name: 'Santa Ana' });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.name).toBe('Santa Ana');
    });
  });

});