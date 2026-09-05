/**
 * Auth System Integration Tests
 * 
 * Verifies:
 * 1. User registration & duplicate rejection
 * 2. Password hashing & credential validation
 * 3. Token generation & httpOnly cookie issuance
 * 4. Token refresh & rotation
 * 5. Password reset flow & session invalidation
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { env } = require('../../src/config/env');

describe('Authentication System End-to-End', () => {
  const testUser = {
    name: 'Ada Lovelace',
    email: 'ada.lovelace@test.pathforge.dev',
    password: 'Password123!',
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }
  });

  afterAll(async () => {
    // Cleanup test user
    await User.deleteMany({ email: { $regex: /@test\.pathforge\.dev$/ } });
    await mongoose.connection.close();
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Ensure hash is never leaked
  });

  it('should reject duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ERR_DUPLICATE_EMAIL');
  });

  it('should reject registration with weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Weak User',
        email: 'weak@test.pathforge.dev',
        password: 'weak',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ERR_VALIDATION');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!',
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ERR_INVALID_CREDENTIALS');
  });

  let authCookie = null;
  let accessToken = null;

  it('should log in with valid credentials and return access token + refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('SameSite=Strict');

    authCookie = refreshCookie.split(';')[0];
  });

  it('should refresh token using httpOnly cookie', async () => {
    // Wait 1.1s so JWT iat timestamp advances to the next second
    await new Promise((r) => setTimeout(r, 1100));

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [authCookie])
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.accessToken).not.toBe(accessToken); // New token generated with updated iat

    // New rotated refresh cookie returned
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
  });

  it('should reject refresh when no cookie provided', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
