// services/auth-service/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const { initializeModels, db } = require('../src/models');

describe('Auth Service', () => {
  beforeAll(async () => {
    // Initialize test database
    process.env.NODE_ENV = 'test';
    await initializeModels();
    await db.sequelize.sync({ force: true }); // Reset database
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await db.User.destroy({ where: {}, force: true });
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('should return validation error for invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation Error');
    });

    test('should return error for duplicate email', async () => {
      // First registration
      await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    const userCredentials = {
      email: 'john@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Create a user before each login test
      await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: userCredentials.email,
          password: userCredentials.password,
          confirmPassword: userCredentials.password
        });
    });

    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send(userCredentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userCredentials.email);
      expect(response.body.data.token).toBeDefined();
    });

    test('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userCredentials.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    test('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      // Register and get token
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      authToken = registerResponse.body.data.token;
    });

    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('john@example.com');
    });

    test('should return unauthorized without token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});