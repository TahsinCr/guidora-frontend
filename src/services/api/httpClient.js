import { getAccessToken, setAccessToken, clearAccessToken } from './tokenManager';

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
 * - Automatic silent refresh on 401 with concurrency locking.
 * - Sanitizes error responses according to .NET 10 WebAPI structure.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Crucial for HttpOnly cookies
  };

  try {
    let response = await fetch(url, config);

    // If 401 Unauthorized, attempt transparent silent refresh
    // Note: Do not attempt refresh on auth endpoints themselves to avoid infinite recursion
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
              return await fetch(url, config).then(parseApiResponse);
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

    return await parseApiResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      // Network failure / server offline
      throw new ApiError('Sunucuya erişilemiyor veya ağ bağlantısı koptu.', 0, null);
    }
    throw err;
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
