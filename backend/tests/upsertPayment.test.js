describe('stripeHelpers.upsertPayment', () => {
  let poolMock;
  beforeEach(() => {
    jest.resetModules();
    // Provide a mock pool with a query function we can control per test
    poolMock = { query: jest.fn() };
    jest.doMock('../server/db', () => poolMock);
  });

  test('updates existing payment when select finds a row', async () => {
    // Select returns existing row
    poolMock.query.mockResolvedValueOnce({ rows: [{ id: 42 }] });
    // Update resolves
    poolMock.query.mockResolvedValueOnce({ rows: [] });

    const { upsertPayment } = require('../server/services/stripeHelpers');
    const id = await upsertPayment({ canonicalId: 'can1', stripeId: 's1', amount: 150 });
    expect(id).toBe(42);
    // Expect at least two queries: select and update
    expect(poolMock.query.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(poolMock.query.mock.calls[0][0]).toMatch(/SELECT \* FROM payments/);
    expect(poolMock.query.mock.calls[1][0]).toMatch(/UPDATE payments SET/);
  });

  test('inserts new payment when no existing row found', async () => {
    // Select returns no rows
    poolMock.query.mockResolvedValueOnce({ rows: [] });
    // Insert returns new id
    poolMock.query.mockResolvedValueOnce({ rows: [{ id: 99 }] });

    const { upsertPayment } = require('../server/services/stripeHelpers');
    const newId = await upsertPayment({ canonicalId: 'can2', stripeId: 's2', amount: 250 });
    expect(newId).toBe(99);
    // Expect the insert SQL to have been executed
    expect(poolMock.query.mock.calls[1][0]).toMatch(/INSERT INTO payments/);
  });

  test('propagates db errors', async () => {
    poolMock.query.mockRejectedValueOnce(new Error('db down'));
    const { upsertPayment } = require('../server/services/stripeHelpers');
    await expect(upsertPayment({ stripeId: 's3' })).rejects.toThrow('db down');
  });
});
