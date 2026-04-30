import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { getNotifications, markAllRead, clearNotifications, getUnreadCount } from '../utils/notificationStore';

const typeColors = {
  success: 'bg-green-100 text-green-700 border-green-200',
  info:    'bg-blue-100 text-blue-700 border-blue-200',
  error:   'bg-red-100 text-red-700 border-red-200'
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [unread, setUnread] = useState(() => getUnreadCount());
  const panelRef = useRef(null);

  const refresh = useCallback(() => {
    setNotifications(getNotifications());
    setUnread(getUnreadCount());
  }, []);

  // Listen for new notifications and read events
  useEffect(() => {
    window.addEventListener('app-notification', refresh);
    window.addEventListener('app-notification-read', refresh);
    return () => {
      window.removeEventListener('app-notification', refresh);
      window.removeEventListener('app-notification-read', refresh);
    };
  }, [refresh]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open && unread > 0) {
      markAllRead();
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    clearNotifications();
    setOpen(false);
  };

  const formatTime = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-violet-50 text-gray-500 hover:text-violet-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <CheckCheck className="w-8 h-8 mb-2" />
                <p className="text-sm">All caught up</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${
                    !n.read ? 'bg-violet-50/40' : ''
                  }`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(n.timestamp)}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
