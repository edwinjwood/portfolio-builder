const portfoliosController = require('../server/controllers/portfoliosController');
const pool = require('../server/db');

jest.mock('../server/db', () => ({
  query: jest.fn(),
}));

describe('onboardPortfolio', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns draft for existing portfolio owned by user', async () => {
    const fakePortfolio = { id: 1, name: 'Test Portfolio', user_id: 2 };
    pool.query.mockResolvedValueOnce({ rows: [fakePortfolio] });

    const req = {
      user: { id: 2, email: 'test@example.com' },
      params: { id: '1' },
      body: { messages: [{ role: 'user', content: 'Hello' }] },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    await portfoliosController.onboardPortfolio(req, res);

    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM portfolios WHERE id = $1 AND user_id = $2', ['1', 2]);
    expect(res.json).toHaveBeenCalled();
    const arg = res.json.mock.calls[0][0];
    expect(arg).toHaveProperty('draft');
    expect(arg.draft.name).toBe('Test Portfolio');
  });
});
