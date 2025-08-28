const path = require('path');

describe('mailer', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('noop when no SMTP config', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    jest.resetModules();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mailer = require('../server/mailer');
    const res = await mailer.sendMail({ to: 'a@example.com' });
    expect(res).toEqual({ noop: true });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('uses nodemailer transport when configured', async () => {
    jest.resetModules();
    process.env.SMTP_HOST = 'smtp.example';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_SECURE = 'false';

    const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'msg-id' });
    const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));
    jest.doMock('nodemailer', () => ({ createTransport: createTransportMock }));

    const mailer = require('../server/mailer');
    const msg = { to: 'b@example.com', subject: 'hi', text: 'hello' };
    const result = await mailer.sendMail(msg);

    expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({ host: 'smtp.example', auth: { user: 'user', pass: 'pass' } }));
    expect(sendMailMock).toHaveBeenCalledWith(msg);
    expect(result).toEqual({ messageId: 'msg-id' });
  });
});
