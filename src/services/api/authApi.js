import { apiRequest } from './httpClient';
import { setAccessToken, clearAccessToken } from './tokenManager';

/**
 * Authentication API Service
 * Directly interacts with .NET 10 WebAPI /api/auth
 */

export async function login({ email, password, rememberMe = false }) {
  const result = await apiRequest('auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      rememberMe,
    }),
  });

  const token = result?.accessToken?.token || result?.token;
  if (token) {
    setAccessToken(token);
  }

  return result;
}

export async function register({ email, password, firstName = '', lastName = '', rememberMe = false }) {
  const result = await apiRequest('auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      rememberMe,
    }),
  });

  const token = result?.accessToken?.token || result?.token;
  if (token) {
    setAccessToken(token);
  }

  return result;
}

export async function refreshSession() {
  const result = await apiRequest('auth/refresh', {
    method: 'POST',
  });

  const token = result?.accessToken?.token || result?.token;
  if (token) {
    setAccessToken(token);
  }

  return result;
}

export async function logout() {
  try {
    await apiRequest('auth/logout', {
      method: 'POST',
    });
  } finally {
    clearAccessToken();
  }
}

export async function requestEmailVerification() {
  return await apiRequest('auth/email-verification/request', {
    method: 'POST',
  });
}

export async function confirmEmailVerification(token) {
  return await apiRequest('auth/email-verification/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
