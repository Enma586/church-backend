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

/**
 * @function generateAuthCookie
 * @description Creates a mock user in the DB and returns a signed JWT cookie string.
 * @param {string} role - El rol del usuario ('Coordinador' o 'Subcoordinador').
 * @returns {Promise<string>} La cookie formateada.
 */
const generateAuthCookie = async (role = 'Coordinador') => {
  const userId = new mongoose.Types.ObjectId();
  
  // 1. Guardamos un usuario falso en la DB en memoria para que el middleware lo encuentre
  const mockUser = new User({
    _id: userId,
    username: `testuser_${Date.now()}`,
    password: 'hashed_password', // No importa porque no pasamos por el login
    role: role,
    isActive: true
  });
  
  // validateBeforeSave: false nos permite saltar reglas de Zod/Mongoose solo para este test
  await mockUser.save({ validateBeforeSave: false });

  // 2. Firmamos el token con el mismo secret que usa tu app real
  const token = jwt.sign(
    { id: userId },
    env.JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return `token=${token}`;
};

describe('Integration: Address API (Departments)', () => {

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
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/address/departments', () => {
    it('should return 403 Forbidden if user is Subcoordinador (not Coordinador)', async () => {
      // Creamos un Subcoordinador. El router exige Coordinador, así que debe rebotar con 403.
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
        .send({}); // Objeto vacío, falta el "name" requerido por Zod

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

      // Verificamos que la API responda bien
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Santa Ana');

      // Verificamos que realmente se haya insertado en MongoDB
      const dbRecord = await Department.findOne({ name: 'Santa Ana' });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.name).toBe('Santa Ana');
    });
  });

});