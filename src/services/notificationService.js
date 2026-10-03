const NOTIFICATIONS_KEY = 'guidora_notifications';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Yeni Araç Doğrulandı 🚀',
    message: 'NeuroGen Studio sürüm v2.4.1 başarıyla admin onayından geçti ve yayına alındı.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    isRead: false,
    type: 'tool',
    link: 'neurogen-studio',
  },
  {
    id: 'notif-2',
    title: 'Yönetim Paneli Güncellemesi ⚡',
    message: 'Toplu araç doğrulama ve JSON sistem yedekleme özellikleri Admin Portalı\'na eklendi.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    isRead: false,
    type: 'system',
  },
  {
    id: 'notif-3',
    title: 'Haftalık AI Trendleri Bülteni 📰',
    message: 'Bu hafta en çok görüntülenen 10 açık kaynaklı kodlama asistanı listelendi.',
    timestamp: new Date(Date.now() - 1000 * 3600 * 24).toISOString(), // 1 day ago
    isRead: true,
    type: 'announcement',
  },
];

export function getNotifications() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
}

export function markAsRead(id) {
  const notifs = getNotifications();
  const updated = notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  return updated;
}

export function markAllAsRead() {
  const notifs = getNotifications();
  const updated = notifs.map((n) => ({ ...n, isRead: true }));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  return updated;
}

export function clearAllNotifications() {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  return [];
}

