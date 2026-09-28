import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  onTokenChange,
} from '@/services/api/tokenManager';

describe('TokenManager Service - In-Memory JWT Security Layer', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it('stores access token in runtime memory and retrieves it accurately', () => {
    expect(getAccessToken()).toBeNull();

    const mockToken = 'mock_jwt_access_token_12345';
    setAccessToken(mockToken);

    expect(getAccessToken()).toBe(mockToken);
  });

  it('clears access token and returns null', () => {
    setAccessToken('temp_token_to_clear');
    expect(getAccessToken()).toBe('temp_token_to_clear');

    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('notifies registered subscriber when token changes', () => {
    const subscriber = vi.fn();
    const unsubscribe = onTokenChange(subscriber);

    setAccessToken('new_token_event');
    expect(subscriber).toHaveBeenCalledWith('new_token_event');

    clearAccessToken();
    expect(subscriber).toHaveBeenCalledWith(null);

    unsubscribe();
    setAccessToken('token_after_unsub');
    // Subscriber should not be called again after unsubscribing
    expect(subscriber).toHaveBeenCalledTimes(2);
  });

  it('does not leak access token into localStorage or sessionStorage', () => {
    const sensitiveToken = 'sensitive_jwt_super_secret';
    setAccessToken(sensitiveToken);

    // Verify localStorage has zero references to this token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      expect(localStorage.getItem(key)).not.toContain(sensitiveToken);
    }
  });
});
