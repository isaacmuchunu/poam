// Simple notification system for user feedback
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  show(notification: Omit<Notification, 'id'>) {
    const id = Math.random().toString(36).substring(7);
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    };

    this.notifications.push(newNotification);
    this.notify();

    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newNotification.duration);
    }

    return id;
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.notify();
  }

  success(title: string, message?: string, options?: Partial<Notification>) {
    return this.show({ type: 'success', title, message, ...options });
  }

  error(title: string, message?: string, options?: Partial<Notification>) {
    return this.show({ type: 'error', title, message, duration: 10000, ...options });
  }

  warning(title: string, message?: string, options?: Partial<Notification>) {
    return this.show({ type: 'warning', title, message, ...options });
  }

  info(title: string, message?: string, options?: Partial<Notification>) {
    return this.show({ type: 'info', title, message, ...options });
  }
}

export const notifications = new NotificationManager();

// React hook for using notifications
import { useState, useEffect } from 'react';

export function useNotifications() {
  const [notificationList, setNotificationList] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notifications.subscribe(setNotificationList);
    return unsubscribe;
  }, []);

  return {
    notifications: notificationList,
    show: notifications.show.bind(notifications),
    dismiss: notifications.dismiss.bind(notifications),
    clear: notifications.clear.bind(notifications),
    success: notifications.success.bind(notifications),
    error: notifications.error.bind(notifications),
    warning: notifications.warning.bind(notifications),
    info: notifications.info.bind(notifications),
  };
}
