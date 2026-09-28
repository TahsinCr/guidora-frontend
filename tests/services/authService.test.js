import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { login, logout, changePassword } from '@/services/authService';
import * as authApi from '@/services/api/authApi';
import { getAccessToken } from '@/services/api/tokenManager';

describe('AuthService - Identity & Session Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('successfully logs in via authApi, stores session in localStorage, and dispatches event', async () => {
    const mockAuthResponse = {
      success: true,
      message: 'Giriş başarılı.',
      data: {
        accessToken: {
          token: 'mock_jwt_token_admin_987',
          expiration: '2026-09-28T21:00:00Z',
          role: 'admin',
        },
        user: {
          id: 'usr_admin_01',
          name: 'Tahsin Cr',
          username: 'tahsincr',
          email: 'tahsincrs@gmail.com',
          role: 'admin',
          avatar: 'TC',
          title: 'Lead AI Engineer & Product Architect',
        },
      },
    };

    vi.spyOn(authApi, 'login').mockResolvedValue(mockAuthResponse);

    const eventSpy = vi.fn();
    window.addEventListener('guidora_auth_change', (e) => eventSpy(e.detail));

    const user = await login({
      usernameOrEmail: 'tahsincrs@gmail.com',
      password: 'SecretPassword123',
    });

    expect(user).toBeDefined();
    expect(user.role).toBe('admin');
    expect(user.email).toBe('tahsincrs@gmail.com');
    expect(user.name).toBe('Tahsin Cr');

    // Confirm stored in localStorage
    const stored = JSON.parse(localStorage.getItem('guidora_current_user'));
    expect(stored.email).toBe('tahsincrs@gmail.com');

    // Confirm custom event dispatched
    expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({ email: 'tahsincrs@gmail.com' }));
  });

  it('propagates validation errors from authApi directly to caller', async () => {
    const apiError = new Error('Geçersiz e-posta veya şifre.');
    apiError.statusCode = 400;
    vi.spyOn(authApi, 'login').mockRejectedValue(apiError);

    await expect(
      login({ usernameOrEmail: 'wrong@user.com', password: 'badpassword' })
    ).rejects.toThrow('Geçersiz e-posta veya şifre.');
  });

  it('logs out cleanly, clears tokens, purges storage, and dispatches null user event', async () => {
    // Setup existing session
    localStorage.setItem('guidora_current_user', JSON.stringify({ id: 'usr_1', email: 'test@guidora.io' }));
    vi.spyOn(authApi, 'logout').mockResolvedValue(true);

    const eventSpy = vi.fn();
    window.addEventListener('guidora_auth_change', (e) => eventSpy(e.detail));

    const result = await logout();

    expect(result).toBe(true);
    expect(localStorage.getItem('guidora_current_user')).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(eventSpy).toHaveBeenCalledWith(null);
  });

  it('validates password requirements in changePassword', () => {
    // No session
    expect(() => changePassword('old', 'newpass123')).toThrow('Oturum açmış kullanıcı bulunamadı.');

    // With active session
    localStorage.setItem('guidora_current_user', JSON.stringify({ id: 'usr_1', email: 'test@guidora.io' }));

    // Empty passwords
    expect(() => changePassword('', '123456')).toThrow('Lütfen tüm şifre alanlarını doldurun.');
    expect(() => changePassword('oldpass', '')).toThrow('Lütfen tüm şifre alanlarını doldurun.');

    // Password length too short
    expect(() => changePassword('oldpass', '12345')).toThrow('Yeni şifre en az 6 karakter olmalıdır.');

    // Valid inputs
    expect(changePassword('oldpass', 'validNewPassword123')).toBe(true);
  });
});
