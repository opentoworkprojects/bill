// Push Notification Service for BillByteKOT
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Check if push notifications are supported
export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

// Get notification permission status
export const getNotificationPermission = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isPushSupported()) {
    toast.error('Push notifications not supported on this device');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Notifications enabled!');
      return true;
    } else {
      toast.error('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};

// Subscribe to push notifications
export const subscribeToPush = async (API) => {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Send subscription to backend
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      await fetch(`${API}/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          subscription: subscription.toJSON()
        })
      });
    }

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
};

// Unsubscribe from push
export const unsubscribeFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    return true;
  } catch (error) {
    console.error('Unsubscribe failed:', error);
    return false;
  }
};

// Show local notification (for in-app notifications)
export const showLocalNotification = (title, options = {}) => {
  if (Notification.permission !== 'granted') return;

  const defaultOptions = {
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: 'billbytekot-notification',
    renotify: true,
    requireInteraction: false,
    ...options
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, defaultOptions);
    });
  } else {
    new Notification(title, defaultOptions);
  }
};

// Helper function
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// In-App Notification System (doesn't require permission)
let notificationContainer = null;

const createNotificationContainer = () => {
  if (notificationContainer) return notificationContainer;
  
  const container = document.createElement('div');
  container.id = 'app-notifications';
  container.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    left: 16px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  `;
  document.body.appendChild(container);
  notificationContainer = container;
  return container;
};

export const showInAppNotification = ({ title, message, type = 'info', duration = 5000, action = null }) => {
  const container = createNotificationContainer();
  
  const colors = {
    info: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '📢' },
    success: { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', icon: '✅' },
    warning: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '⚠️' },
    error: { bg: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', icon: '❌' },
    order: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '🍽️' },
    promo: { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', icon: '🎉' }
  };
  
  const { bg, icon } = colors[type] || colors.info;
  
  const notification = document.createElement('div');
  notification.style.cssText = `
    background: ${bg};
    color: white;
    padding: 16px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    display: flex;
    align-items: flex-start;
    gap: 12px;
    pointer-events: auto;
    transform: translateX(120%);
    transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    cursor: pointer;
    max-width: 400px;
    margin-left: auto;
  `;
  
  notification.innerHTML = `
    <div style="font-size: 28px; line-height: 1;">${icon}</div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">${title}</div>
      <div style="font-size: 13px; opacity: 0.9; line-height: 1.4;">${message}</div>
      ${action ? `<button style="margin-top: 8px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">${action.label}</button>` : ''}
    </div>
    <button style="background: none; border: none; color: white; opacity: 0.7; cursor: pointer; padding: 0; font-size: 18px; line-height: 1;">×</button>
  `;
  
  container.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });
  
  // Play sound
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
  
  // Vibrate on mobile
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
  
  const dismiss = () => {
    notification.style.transform = 'translateX(120%)';
    setTimeout(() => notification.remove(), 400);
  };
  
  // Close button
  notification.querySelector('button:last-child').onclick = (e) => {
    e.stopPropagation();
    dismiss();
  };
  
  // Action button
  if (action) {
    notification.querySelector('button:first-of-type').onclick = (e) => {
      e.stopPropagation();
      action.onClick?.();
      dismiss();
    };
  }
  
  // Click to dismiss
  notification.onclick = dismiss;
  
  // Auto dismiss
  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
  
  return { dismiss };
};

// Poll for notifications from backend
let pollInterval = null;

export const startNotificationPolling = (API, interval = 30000) => {
  if (pollInterval) return;
  
  const checkNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) return;
      
      const lastCheck = localStorage.getItem('lastNotificationCheck') || '0';
      const response = await fetch(`${API}/notifications/check?user_id=${user.id}&since=${lastCheck}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.notifications?.length > 0) {
          data.notifications.forEach(notif => {
            showInAppNotification({
              title: notif.title,
              message: notif.message,
              type: notif.type || 'info',
              duration: 8000
            });
          });
        }
        localStorage.setItem('lastNotificationCheck', Date.now().toString());
      }
    } catch (error) {
      // Silent fail
    }
  };
  
  checkNotifications();
  pollInterval = setInterval(checkNotifications, interval);
};

export const stopNotificationPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};
