describe('captcha service', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.CAPTCHA_SECRET;
    delete process.env.CAPTCHA_PROVIDER;
  });

  test('throws if captcha not configured', async () => {
    const { verifyCaptcha } = require('../server/services/captcha');
    await expect(verifyCaptcha('token')).rejects.toThrow('Captcha not configured');
  });

  test('throws if token missing', async () => {
    process.env.CAPTCHA_SECRET = 'secret';
    const { verifyCaptcha } = require('../server/services/captcha');
    await expect(verifyCaptcha()).rejects.toThrow('Captcha token required');
  });

  test('throws when provider responds non-ok', async () => {
    process.env.CAPTCHA_SECRET = 'secret';
    const fakeFetch = jest.fn().mockResolvedValue({ ok: false });
    global.fetch = fakeFetch;
    jest.resetModules();
    const captcha = require('../server/services/captcha');
    await expect(captcha.verifyCaptcha('t')).rejects.toThrow('Captcha provider rejected request');
    delete global.fetch;
  });

  test('successful verification with fetch', async () => {
    process.env.CAPTCHA_SECRET = 'secret';
    const fakeFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    global.fetch = fakeFetch;
    jest.resetModules();
    const { verifyCaptcha } = require('../server/services/captcha');
    await expect(verifyCaptcha('token-123')).resolves.toBe(true);
    expect(fakeFetch).toHaveBeenCalled();
    delete global.fetch;
  });
});
