import { describe, it, expect, beforeEach } from 'vitest';
import { createMockApiHandler } from '../../infra/mock-server/mockHandler.js';
import { EventEmitter } from 'events';

// Helper to simulate Node.js IncomingMessage and ServerResponse
function createMockHttpExchange({ method = 'GET', url = '/', headers = {}, body = null }) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = { host: 'localhost:5173', ...headers };

  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    headersSent: false,
    writeHead(status, headers = {}) {
      this.statusCode = status;
      this.headers = { ...this.headers, ...headers };
      this.headersSent = true;
    },
    setHeader(key, val) {
      this.headers[key] = val;
    },
    end(chunk = '') {
      this.body = chunk;
    },
  };

  process.nextTick(() => {
    if (body) {
      req.emit('data', typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.emit('end');
  });

  return { req, res };
}

describe('Mock API Handler Engine', () => {
  let mockHandler;
  const testAdminEmail = 'tahsincrs@gmail.com';
  const testAdminPass = '9PS1CgoOmsBIj5O9V7SQfDZMIibHvI4Q';
  const testAdminUser = 'tahsincr';

  beforeEach(() => {
    mockHandler = createMockApiHandler({
      adminEmail: testAdminEmail,
      adminPassword: testAdminPass,
      adminUsername: testAdminUser,
    });
  });

  it('serves /health/live and /api/health/live probe with 200 Healthy', async () => {
    const { req, res } = createMockHttpExchange({ method: 'GET', url: '/api/health/live' });
    const handled = await mockHandler(req, res);

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.status).toBe('Healthy');
    expect(parsed.version).toBe('1.0.0-mock');
  });

  it('authenticates admin successfully with env-configured credentials and returns HttpOnly cookie', async () => {
    const { req, res } = createMockHttpExchange({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: testAdminEmail, password: testAdminPass },
    });
    const handled = await mockHandler(req, res);

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(true);
    expect(parsed.data.user.role).toBe('admin');
    expect(parsed.data.accessToken.token).toContain('mock_jwt_access_token_admin');
    expect(res.headers['Set-Cookie']).toContain('guidora_refresh=');
  });

  it('rejects invalid password with 400 Bad Request matching .NET validation error schema', async () => {
    const { req, res } = createMockHttpExchange({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: testAdminEmail, password: 'WrongPassword123' },
    });
    const handled = await mockHandler(req, res);

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(400);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(false);
    expect(parsed.errors).toBeDefined();
    expect(parsed.errors[0].errorMessage).toContain('Geçersiz e-posta veya şifre.');
  });

  it('executes silent refresh on /api/auth/refresh when refresh cookie is presented', async () => {
    const { req, res } = createMockHttpExchange({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: 'guidora_refresh=mock_existing_valid_token' },
    });
    const handled = await mockHandler(req, res);

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(true);
    expect(parsed.data.accessToken.token).toBeDefined();
    expect(res.headers['Set-Cookie']).toContain('guidora_refresh=');
  });

  it('serves categories list on /api/categories', async () => {
    const { req, res } = createMockHttpExchange({ method: 'GET', url: '/api/categories' });
    const handled = await mockHandler(req, res);

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(true);
    expect(Array.isArray(parsed.data)).toBe(true);
    expect(parsed.data.length).toBeGreaterThan(0);
    expect(parsed.data[0].slug).toBeDefined();
  });

  it('serves paginated products with search filtering on /api/products', async () => {
    const { req, res } = createMockHttpExchange({
      method: 'GET',
      url: '/api/products?page=1&pageSize=10&search=neurogen',
    });
    const handled = await mockHandler(req, res);

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.success).toBe(true);
    expect(parsed.data.items).toBeDefined();
    expect(parsed.data.items.length).toBe(1);
    expect(parsed.data.items[0].slug).toBe('neurogen-studio');
  });

  it('clears session cookie on /api/auth/logout with 204 No Content', async () => {
    const { req, res } = createMockHttpExchange({ method: 'POST', url: '/api/auth/logout' });
    const handled = await mockHandler(req, res);

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(204);
    expect(res.headers['Set-Cookie']).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });
});
