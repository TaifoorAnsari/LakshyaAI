/**
 * User Endpoints Integration Tests
 * 
 * Verifies:
 * - GET /users/me
 * - POST /users/me/onboarding
 * - PATCH /users/me
 * - POST /users/me/change-password
 * - DELETE /users/me
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { env } = require('../../src/config/env');

describe('User Endpoints End-to-End', () => {
  let userToken = null;
  const testUserData = {
    name: 'Alan Turing',
    email: 'alan.turing@test.pathforge.dev',
    password: 'password123',
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }

    // Clean up
    await User.deleteMany({ email: testUserData.email });

    // Register user
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUserData);

    userToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUserData.email });
    await mongoose.connection.close();
  });

  it('should reject unauthenticated request to /users/me', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('should return authenticated user profile on GET /users/me', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUserData.email);
    expect(res.body.data.user.name).toBe(testUserData.name);
  });

  it('should save onboarding answers on POST /users/me/onboarding', async () => {
    const onboardingPayload = {
      goalText: 'Master full stack development with Node.js and React',
      skillLevel: 'intermediate',
      hoursPerWeek: 15,
      learningStyle: 'hands-on',
    };

    const res = await request(app)
      .post('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send(onboardingPayload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.onboarding.goalText).toBe(onboardingPayload.goalText);
    expect(res.body.data.onboarding.skillLevel).toBe('intermediate');
    expect(res.body.data.onboarding.hoursPerWeek).toBe(15);
    expect(res.body.data.onboarding.learningStyle).toBe('hands-on');
    expect(res.body.data.onboarding.completedAt).toBeDefined();
  });

  it('should update display name on PATCH /users/me', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Alan M. Turing' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Alan M. Turing');
  });

  it('should change password on POST /users/me/change-password', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/change-password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        currentPassword: testUserData.password,
        newPassword: 'newSecretPassword123',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    // Verify login with new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUserData.email,
        password: 'newSecretPassword123',
      })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    userToken = loginRes.body.data.accessToken;
  });

  it('should delete user account on DELETE /users/me', async () => {
    const res = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify user is gone
    const checkUser = await User.findOne({ email: testUserData.email });
    expect(checkUser).toBeNull();
  });
});
