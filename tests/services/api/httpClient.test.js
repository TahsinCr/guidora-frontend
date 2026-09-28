import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiRequest, ApiError } from '@/services/api/httpClient';
import { setAccessToken, getAccessToken, clearAccessToken } from '@/services/api/tokenManager';
import { circuitBreaker, CIRCUIT_STATE } from '@/services/api/circuitBreaker';
import { configService } from '@/services/config/configService';

describe('HTTP Client & API Security Engine', () => {
  beforeEach(() => {
    clearAccessToken();
    circuitBreaker.reset();
    configService.resetToSafeDefaults();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearAccessToken();
    circuitBreaker.reset();
    configService.resetToSafeDefaults();
  });

  it('injects in-memory JWT Access Token and credentials: include into outgoing request', async () => {
    setAccessToken('mock_jwt_access_token_123');

    let capturedRequest = null;
    globalThis.fetch = vi.fn().mockImplementation((url, config) => {
      capturedRequest = { url, config };
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true, data: { status: 'healthy' } }),
      });
    });

    const result = await apiRequest('/categories');

    expect(capturedRequest.config.credentials).toBe('include');
    expect(capturedRequest.config.headers.get('Authorization')).toBe('Bearer mock_jwt_access_token_123');
    expect(capturedRequest.config.headers.get('Content-Type')).toBe('application/json');
    expect(result).toEqual({ status: 'healthy' });
  });

  it('performs transparent silent refresh on 401 and retries original request', async () => {
    setAccessToken('expired_token');

    let requestCount = 0;
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      requestCount++;

      // First call to /tools fails with 401
      if (url.includes('/tools') && requestCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        });
      }

      // Second call is /auth/refresh
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                accessToken: { token: 'new_fresh_token_456' },
              },
            }),
        });
      }

      // Third call is the retried original request with new token
      if (url.includes('/tools') && requestCount === 3) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true, data: [{ id: 1, name: 'NeuroGen' }] }),
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const data = await apiRequest('/tools');

    expect(data).toEqual([{ id: 1, name: 'NeuroGen' }]);
    expect(getAccessToken()).toBe('new_fresh_token_456');
    expect(requestCount).toBe(3);
  });

  it('mutex locks concurrent 401s so only ONE refresh request is issued for multiple calls', async () => {
    setAccessToken('expired_token');

    let refreshCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation((url, config) => {
      if (url.includes('/auth/refresh')) {
        refreshCallCount++;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              success: true,
              data: { accessToken: { token: 'mutex_resolved_token_789' } },
            }),
        });
      }

      const authHeader = config.headers.get('Authorization');
      if (authHeader === 'Bearer expired_token') {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        });
      }

      if (authHeader === 'Bearer mutex_resolved_token_789') {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true, data: { processedWith: authHeader } }),
        });
      }

      throw new Error('Unexpected state');
    });

    // Fire 3 simultaneous API calls that all encounter 401
    const [res1, res2, res3] = await Promise.all([
      apiRequest('/endpoint1'),
      apiRequest('/endpoint2'),
      apiRequest('/endpoint3'),
    ]);

    // Crucial check: Only 1 refresh call was made, not 3!
    expect(refreshCallCount).toBe(1);
    expect(res1.processedWith).toBe('Bearer mutex_resolved_token_789');
    expect(res2.processedWith).toBe('Bearer mutex_resolved_token_789');
    expect(res3.processedWith).toBe('Bearer mutex_resolved_token_789');
  });

  it('fast-fails immediately without network fetch when CircuitBreaker is OPEN', async () => {
    // Trip circuit breaker to OPEN
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure(new Error('Backend down'));
    }
    expect(circuitBreaker.state).toBe(CIRCUIT_STATE.OPEN);

    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;

    await expect(apiRequest('/catalog/products')).rejects.toThrow(ApiError);
    // Verify zero network requests were dispatched!
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses .NET 10 WebAPI validation exception list from body.errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () =>
        Promise.resolve({
          errors: [
            { errorMessage: 'ToolName must not be empty.' },
            { errorMessage: 'WebsiteUrl is not a valid HTTPS address.' },
          ],
        }),
    });

    await expect(apiRequest('/tools', { method: 'POST' })).rejects.toThrow(
      'ToolName must not be empty., WebsiteUrl is not a valid HTTPS address.'
    );
  });

  it('handles 429 Too Many Requests and reads Retry-After header', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({
        'content-type': 'application/json',
        'Retry-After': '30',
      }),
      json: () => Promise.resolve({ message: 'Rate limit exceeded' }),
    });

    await expect(apiRequest('/search')).rejects.toThrow(
      'Çok fazla istek yapıldı. Lütfen 30 saniye sonra tekrar deneyin.'
    );
  });
});
