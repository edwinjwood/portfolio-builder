const request = require('supertest');

jest.mock('pg', () => ({ Pool: jest.fn() }));
const bcrypt = require('bcryptjs');

describe('Signup / Create user', () => {
  let app;
  let poolMock;

  beforeAll(() => {
    poolMock = { query: jest.fn() };
    const { Pool } = require('pg');
    Pool.mockImplementation(() => poolMock);
    const server = require('../server/index.js');
    app = server.app;
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('retries on username unique-violation and succeeds', async () => {
    // 1) email exists check -> no rows
    poolMock.query.mockResolvedValueOnce({ rows: [] });
    // Next, the INSERT will be attempted; first two attempts throw unique-violation on username
    const uniqueErr = new Error('duplicate key');
    uniqueErr.code = '23505';
    uniqueErr.constraint = 'users_username_unique_idx';
    poolMock.query.mockRejectedValueOnce(uniqueErr);
    poolMock.query.mockRejectedValueOnce(uniqueErr);
    // Final attempt succeeds and returns an inserted user row
    poolMock.query.mockResolvedValueOnce({ rows: [{ id: 999, email: 'ed@example.com', username: 'ed.wood2', role: 'user', first_name: 'Ed', last_name: 'Wood' }] });

    // For bcrypt.hash called in controller, we allow the real implementation or mock
    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashedpw');

    const payload = { name: 'Ed Wood', email: 'ed@example.com', password: 'GoodPassw0rd!' };
    const res = await request(app).post('/api/users').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toMatch(/ed\.wood/);
  });
});
