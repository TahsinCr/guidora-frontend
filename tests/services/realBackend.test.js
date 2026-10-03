import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import * as productsApi from '@/services/api/productsApi';
import * as taxonomiesApi from '@/services/api/taxonomiesApi';
import * as authApi from '@/services/api/authApi';
import { getTools, getToolById, getCategories } from '@/services/toolsService';
import { login, userFromAccessToken } from '@/services/authService';
import { getNotifications } from '@/services/notificationService';

describe('Real backend mode', () => {
  beforeEach(() => { localStorage.clear(); vi.stubEnv('VITE_USE_MOCK', 'false'); });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
  it('keeps an empty backend catalog empty', async () => {
    vi.spyOn(productsApi, 'fetchProducts').mockResolvedValue({ items: [], totalCount: 0 });
    expect((await getTools()).items).toEqual([]);
    expect(getNotifications()).toEqual([]);
  });
  it('loads actual paginated products and resolves slug to backend numeric detail ID', async () => {
    const first = { productId: 42, slug: 'real-product', name: 'Real Product', shortDescription: 'Actual data' };
    vi.spyOn(productsApi, 'fetchProducts').mockResolvedValueOnce({ items: [first], totalCount: 2 }).mockResolvedValueOnce({ items: [{ ...first, productId: 43, slug: 'another-product' }], totalCount: 2 });
    const result = await getTools();
    expect(result.total).toBe(2);
    expect(productsApi.fetchProducts).toHaveBeenLastCalledWith({ page: 2, pageSize: 100 });
    vi.spyOn(productsApi, 'fetchProductVerificationSummary').mockResolvedValue({ adminVerified: false, communityVerified: false });
    const detail = vi.spyOn(productsApi, 'fetchProductById').mockResolvedValue({ ...first, description: 'Backend detail' });
    expect((await getToolById('real-product')).description).toBe('Backend detail');
    expect(detail).toHaveBeenCalledWith(42);
    expect(result.items[0].verified.admin).toBe(false);
  });
  it('does not replace empty or unavailable categories with demo data', async () => {
    const request = vi.spyOn(taxonomiesApi, 'fetchCategories').mockResolvedValue([]);
    expect(await getCategories()).toEqual([]);
    request.mockRejectedValue(new Error('offline'));
    await expect(getCategories()).rejects.toThrow('offline');
  });
  it('does not authenticate local users when the backend is offline', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(Object.assign(new Error('offline'), { statusCode: 502 }));
    await expect(login({ usernameOrEmail: 'tahsincr', password: 'anything' })).rejects.toThrow('offline');
    expect(localStorage.getItem('guidora_current_user')).toBeNull();
  });
  it('derives real session identity and permissions from the backend token', () => {
    const claims = { sub: '42', email: 'admin@example.com', unique_name: 'Admin', role: ['Role.Manage'] };
    const token = `header.${btoa(JSON.stringify(claims))}.signature`;
    expect(userFromAccessToken(token)).toMatchObject({ id: '42', email: 'admin@example.com', role: 'admin' });
  });
});
