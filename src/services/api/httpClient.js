import { getAccessToken, setAccessToken, clearAccessToken } from './tokenManager';
import { getConfig } from '../config/configService';
import { circuitBreaker } from './circuitBreaker';
import { networkTracker } from './networkTracker';
import { isMaintenanceActive } from '../config/maintenanceHelper';
import { toast } from '../toast/toastService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Mutex for refreshing token concurrently.
 * When multiple requests fail with 401 simultaneously,
 * only ONE refresh request is issued. All others wait for the result.
 */
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed(error) {
  refreshSubscribers.forEach((cb) => cb(null, error));
  refreshSubscribers = [];
}

/**
 * Core HTTP Request Function
 * Features:
 * - Credentials: 'include' ensures HttpOnly `guidora_refresh` cookie is dispatched.
 * - Injects in-memory Access Token into Authorization header.
 * - Dynamic timeout enforcement via AbortController powered by config.json.
 * - Automatic silent refresh on 401 with concurrency locking.
 * - Circuit Breaker pattern with fast-fail protection when backend is down.
 * - In-flight request counting for graceful draining before maintenance mode.
 * - Automatic rate-limit (429) backoff toast and user notification.
 * - Sanitizes error responses according to .NET 10 WebAPI structure.
 */
export async function apiRequest(endpoint, options = {}) {
  const isHealthCheck = endpoint.includes('health/live') || endpoint.includes('health/ready');

  // 1. Check Maintenance Mode (except health checks)
  if (!isHealthCheck && isMaintenanceActive()) {
    throw new ApiError('Guidora şu anda planlı bakım modundadır.', 503, { isMaintenance: true });
  }

  // 2. Check Circuit Breaker (fast-fail if backend is down)
  if (!isHealthCheck && !circuitBreaker.canRequest()) {
    throw new ApiError(
      'Guidora sunucuları geçici olarak yanıt vermiyor. Sistem kısa süre içinde otomatik yeniden bağlanacak.',
      503,
      { isCircuitBreaker: true }
    );
  }

  const runtimeConfig = getConfig();
  const defaultTimeout = runtimeConfig?.network?.timeouts?.defaultMs || 8000;
  const timeoutMs = options.timeoutMs || defaultTimeout;

  const url = `${BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Setup AbortController for timeout guard
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config = {
    ...options,
    headers,
    signal: options.signal || controller.signal,
    credentials: 'include', // Crucial for HttpOnly cookies
  };

  // Track in-flight request for graceful draining
  const decrementInFlight = networkTracker.incrementInFlight();

  try {
    let response;
    try {
      response = await fetch(url, config);
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle 429 Too Many Requests (Rate Limiting)
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After');
      const fallbackSec = runtimeConfig?.network?.rateLimiting?.retryAfterFallbackSeconds || 15;
      const waitSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) || fallbackSec : fallbackSec;

      toast.warning(
        'İşlem Sınırı',
        `İşlemler çok hızlı yapıldı. Sistem güvenliği için lütfen ${waitSeconds} saniye bekleyin.`,
        { id: 'toast_rate_limit_429', durationMs: 3000 }
      );

      throw new ApiError(
        `Çok fazla istek yapıldı. Lütfen ${waitSeconds} saniye sonra tekrar deneyin.`,
        429,
        { retryAfter: waitSeconds }
      );
    }

    // If 401 Unauthorized, attempt transparent silent refresh
    const isAuthEndpoint = endpoint.includes('auth/login') ||
                           endpoint.includes('auth/register') ||
                           endpoint.includes('auth/refresh');

    if (response.status === 401 && !isAuthEndpoint) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${BASE_URL.replace(/\/+$/, '')}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData?.data?.accessToken?.token || refreshData?.data?.token;

            if (newAccessToken) {
              setAccessToken(newAccessToken);
              isRefreshing = false;
              onRefreshed(newAccessToken);

              // Retry original request with newly acquired token
              config.headers.set('Authorization', `Bearer ${newAccessToken}`);
              const retried = await fetch(url, config);
              circuitBreaker.recordSuccess();
              return await parseApiResponse(retried);
            }
          }

          // Refresh failed or revoked by server
          clearAccessToken();
          isRefreshing = false;
          onRefreshFailed(new Error('Session expired or revoked'));
        } catch (refreshErr) {
          clearAccessToken();
          isRefreshing = false;
          onRefreshFailed(refreshErr);
        }
      } else {
        // Wait for active refresh promise
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken, err) => {
            if (newToken) {
              config.headers.set('Authorization', `Bearer ${newToken}`);
              try {
                const res = await fetch(url, config);
                circuitBreaker.recordSuccess();
                resolve(await parseApiResponse(res));
              } catch (retryErr) {
                reject(retryErr);
              }
            } else {
              reject(err || new Error('Session refresh failed'));
            }
          });
        });
      }
    }

    // Check for 5xx Server Outages
    if (response.status >= 500) {
      circuitBreaker.recordFailure(new Error(`Server returned ${response.status}`));
    } else if (response.ok) {
      circuitBreaker.recordSuccess();
    }

    return await parseApiResponse(response);
  } catch (err) {
    if (err.name === 'AbortError') {
      circuitBreaker.recordFailure(err);
      throw new ApiError(`İstek zaman aşımına uğradı (${timeoutMs}ms). Sunucu yanıt vermedi.`, 408, null);
    }
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      // Network failure / server offline
      circuitBreaker.recordFailure(err);
      throw new ApiError('Sunucuya erişilemiyor veya ağ bağlantısı koptu.', 0, null);
    }
    throw err;
  } finally {
    decrementInFlight();
  }
}

/**
 * Standardizes .NET 10 WebAPI responses and exception middleware structures
 */
async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let body = null;
  if (isJson) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    // Extract error details from .NET ExceptionMiddleware / ValidationException
    let errorMessage = 'Bir hata oluştu.';
    if (body) {
      if (typeof body === 'string') {
        errorMessage = body;
      } else {
        const errorList = body.errors || body.Errors;
        if (Array.isArray(errorList) && errorList.length > 0) {
          errorMessage = errorList
            .map((e) => e.errorMessage || e.ErrorMessage || (typeof e === 'string' ? e : JSON.stringify(e)))
            .join(', ');
        } else if (body.message || body.Message) {
          errorMessage = body.message || body.Message;
        }
      }
    }

    throw new ApiError(errorMessage, response.status, body);
  }

  // If backend returns DataResult: { success, message, data }
  if (body && typeof body === 'object' && 'success' in body) {
    if (!body.success) {
      throw new ApiError(body.message || 'İşlem başarısız oldu.', response.status, body);
    }
    return body.data !== undefined ? body.data : body;
  }

  return body;
}

export class ApiError extends Error {
  constructor(message, statusCode, raw) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.raw = raw;
  }
}
