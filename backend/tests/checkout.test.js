const request = require('supertest');

// Hoisted mocks
jest.mock('pg', () => ({ Pool: jest.fn() }));

describe('Checkout routes', () => {
  let poolMock;
  let app;

  beforeAll(() => {
    poolMock = { query: jest.fn() };
    const { Pool } = require('pg');
    Pool.mockImplementation(() => poolMock);

    const checkoutMock = {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.example/session', id: 'cs_test_1' }),
        retrieve: jest.fn().mockResolvedValue({ id: 'cs_test_1', metadata: { userId: '55' }, subscription: null, payment_intent: null })
      }
    };
    // mock the stripeClient service used by controllers
    jest.doMock('../server/services/stripeClient', () => ({ getStripe: () => ({ checkout: checkoutMock }) }));

    const express = require('express');
    const bodyParser = require('body-parser');
  const checkoutCtrl = require('../server/controllers/checkoutController');
    app = express();
    app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
    app.post('/api/checkout/create-session', checkoutCtrl.createSession);
    app.get('/api/checkout/session', checkoutCtrl.getSession);
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('POST /api/checkout/create-session without priceId returns 400', async () => {
    const res = await request(app).post('/api/checkout/create-session').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('priceId is required.');
  });

  test('POST /api/checkout/create-session with priceId and token creates session', async () => {
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: 55 }));

    // pool.query: first call for user email, second call for plan map
    poolMock.query.mockResolvedValueOnce({ rows: [{ email: 'u@example.com' }] });
    poolMock.query.mockResolvedValueOnce({ rows: [{ plan_key: 'pro' }] });

    const res = await request(app).post('/api/checkout/create-session').set('Authorization', 'Bearer faketoken').send({ priceId: 'price_123' });
    expect(res.status).toBe(200);
    expect(res.body.url).toBeTruthy();
    expect(res.body.id).toBeTruthy();
  });

  test('GET /api/checkout/session without session_id returns 400', async () => {
    const res = await request(app).get('/api/checkout/session');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('session_id required');
  });

  test('GET /api/checkout/session with session_id returns session and signed token when user exists', async () => {
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'sign').mockImplementation(() => 'signed-token-xyz');

    poolMock.query.mockResolvedValueOnce({ rows: [{ id: 55, email: 'u@example.com', username: 'u', role: 'user', first_name: 'First', last_name: 'Last' }] });

    const res = await request(app).get('/api/checkout/session').query({ session_id: 'cs_test_1' });
    expect(res.status).toBe(200);
    expect(res.body.session).toBeTruthy();
    expect(res.body.user).toBeTruthy();
    expect(res.body.token).toBe('signed-token-xyz');
  });
});
