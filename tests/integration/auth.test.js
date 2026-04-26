/**
 * @file tests/integration/auth.test.js
 * @description Integration tests for the Authentication middleware.
 * Verifies that the system correctly handles missing tokens, invalid signatures,
 * and inactive user accounts.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import User from '../../src/models/members/User.js';
import { env } from '../../src/config/env.js';

describe('Integration: Authentication Middleware', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  const createTestUser = async (isActive = true) => {
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      username: `user_${Date.now()}`,
      password: 'hashed_password',
      role: 'Subcoordinador',
      isActive
    });
    await user.save({ validateBeforeSave: false });
    return user;
  };

  const signToken = (id, secret = env.JWT_SECRET) => {
    return jwt.sign({ id }, secret, { expiresIn: '1h' });
  };

  // Usamos una ruta protegida cualquiera (ej. /api/address/departments) para probar el middleware
  const testRoute = '/api/address/departments';

  it('should return 401 if token is manipulated or signed with a wrong secret', async () => {
    const user = await createTestUser();
    const fakeToken = signToken(user._id, 'wrong_secret_key');
    
    const response = await request(app)
      .get(testRoute)
      .set('Cookie', [`token=${fakeToken}`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Token inválido');
  });

  it('should return 401 if the user account has been deactivated', async () => {
    const inactiveUser = await createTestUser(false); // isActive = false
    const validToken = signToken(inactiveUser._id);

    const response = await request(app)
      .get(testRoute)
      .set('Cookie', [`token=${validToken}`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('desactivada');
  });
});