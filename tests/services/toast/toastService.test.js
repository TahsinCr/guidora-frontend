import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toast } from '@/services/toast/toastService';

describe('ToastService', () => {
  beforeEach(() => {
    toast.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    toast.clear();
    vi.useRealTimers();
  });

  it('adds a toast and notifies subscribers', () => {
    const subscriber = vi.fn();
    const unsub = toast.subscribe(subscriber);

    toast.info('Test Başlığı', 'Test Açıklaması', { id: 'test_1', durationMs: 3000 });

    expect(subscriber).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test_1',
          type: 'info',
          title: 'Test Başlığı',
          message: 'Test Açıklaması',
        }),
      ])
    );

    unsub();
  });

  it('prevents duplicate spam by updating toast if ID already exists', () => {
    toast.warning('Ağ Hatası', 'İlk Mesaj', { id: 'network_warn' });
    expect(toast.toasts.length).toBe(1);
    expect(toast.toasts[0].message).toBe('İlk Mesaj');

    // Trigger same warning ID
    toast.warning('Ağ Hatası', 'Güncellenmiş Mesaj', { id: 'network_warn' });
    expect(toast.toasts.length).toBe(1);
    expect(toast.toasts[0].message).toBe('Güncellenmiş Mesaj');
  });

  it('auto-dismisses toast after specified durationMs', () => {
    toast.success('İşlem Tamam', 'Kayıt başarılı', { id: 'auto_dismiss_test', durationMs: 3000 });
    expect(toast.toasts.length).toBe(1);

    // Advance timer by 2999ms (should still exist)
    vi.advanceTimersByTime(2999);
    expect(toast.toasts.length).toBe(1);

    // Advance timer past 3000ms
    vi.advanceTimersByTime(1);
    expect(toast.toasts.length).toBe(0);
  });

  it('removes toast immediately when dismiss(id) is invoked', () => {
    toast.error('Kritik Hata', 'Detay', { id: 'manual_dismiss' });
    expect(toast.toasts.length).toBe(1);

    toast.dismiss('manual_dismiss');
    expect(toast.toasts.length).toBe(0);
  });
});
