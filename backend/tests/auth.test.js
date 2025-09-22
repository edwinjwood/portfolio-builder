const request = require('supertest');

// We'll mock the pg Pool and bcrypt/jwt behavior where needed
jest.mock('pg', () => ({ Pool: jest.fn() }));
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth routes', () => {
  let app;
  let poolMock;

  beforeAll(() => {
    // create a fake pool with a query mock
    poolMock = { query: jest.fn() };
    const { Pool } = require('pg');
    Pool.mockImplementation(() => poolMock);

    // require server after mocking
    const server = require('../server/index.js');
    app = server.app;
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('POST /api/login returns 400 when missing fields', async () => {
  const res = await request(app).post('/api/users/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password required.');
  });

  test('POST /api/login returns 401 with invalid creds', async () => {
    poolMock.query.mockResolvedValueOnce({ rows: [] });
  const res = await request(app).post('/api/users/login').send({ email: 'noone@example.com', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials.');
  });

  test('POST /api/login succeeds with valid creds', async () => {
    const fakeUser = { id: 123, email: 'u@example.com', password: 'hashedpw', username: 'u', role: 'user', first_name: 'A', last_name: 'B' };
    poolMock.query.mockResolvedValueOnce({ rows: [fakeUser] });
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
  const res = await request(app).post('/api/users/login').send({ email: 'u@example.com', password: 'Password123' });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('u@example.com');
    expect(res.body.token).toBeDefined();
  });

  test('password validator rejects weak passwords', () => {
    // require lazily so the test's Pool mock is in place
    const usersController = require('../server/controllers/usersController');
    const errs = usersController.__test_only_validatePassword('short');
    expect(errs.length).toBeGreaterThan(0);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('at least 8')]));
  });

  test('password validator accepts strong passwords', () => {
    const usersController = require('../server/controllers/usersController');
    const errs = usersController.__test_only_validatePassword('GoodPassw0rd!');
    expect(errs.length).toBe(0);
  });
});
