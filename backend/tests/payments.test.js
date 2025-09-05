const request = require('supertest');

jest.mock('pg', () => ({ Pool: jest.fn() }));

// Mock the stripeClient provider so controllers calling getStripe() receive our fake
let stripeMock = null;

describe('Payments routes', () => {
  let app;
  let poolMock;

  beforeAll(() => {
  // Install the stripeClient mock here so it can reference the stripeMock variable
  jest.doMock('../server/services/stripeClient', () => ({ getStripe: () => stripeMock }));
    poolMock = { query: jest.fn() };
    const { Pool } = require('pg');
    Pool.mockImplementation(() => poolMock);

    // Mock stripe.paymentIntents.create
    stripeMock = {
      paymentIntents: {
        create: jest.fn().mockResolvedValue({ client_secret: 'secret_abc', id: 'pi_123' })
      }
    };

    const server = require('../server/index.js');
    app = server.app;
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('POST /api/payments/create-payment-intent without token returns 401', async () => {
    const res = await request(app).post('/api/payments/create-payment-intent').send({ amount: 1000 });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided.');
  });

  test('POST /api/payments/create-payment-intent with invalid token returns 401', async () => {
    // supply an invalid token
    const res = await request(app).post('/api/payments/create-payment-intent').set('Authorization', 'Bearer invalid.token').send({ amount: 1000 });
    expect(res.status).toBe(401);
  });

  test('POST /api/payments/create-payment-intent with valid token creates PI', async () => {
    // Mock jwt verify by replacing the secret env var
    process.env.JWT_SECRET = 'testsecret';
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: 55 }));

    const res = await request(app).post('/api/payments/create-payment-intent').set('Authorization', 'Bearer faketoken').send({ amount: 1500, currency: 'usd' });
  expect(res.status).toBe(200);
  expect(res.body.clientSecret).toBeTruthy();
  expect(res.body.id).toBeTruthy();
  });
});
