/**
 * Simple in-app notification store using CustomEvents + localStorage.
 * Components subscribe via addEventListener('app-notification', ...).
 */

const STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 20;

export function getNotifications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function pushNotification({ title, message, type = 'info', icon = '🔔' }) {
  const notifications = getNotifications();
  const notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    type,   // 'success' | 'info' | 'error'
    icon,
    read: false,
    timestamp: Date.now()
  };

  const updated = [notification, ...notifications].slice(0, MAX_NOTIFICATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Broadcast to all subscribers
  window.dispatchEvent(new CustomEvent('app-notification', { detail: notification }));
  return notification;
}

export function markAllRead() {
  const notifications = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent('app-notification-read'));
}

export function clearNotifications() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('app-notification-read'));
}

export function getUnreadCount() {
  return getNotifications().filter(n => !n.read).length;
}
