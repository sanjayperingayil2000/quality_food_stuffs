'use client';

import * as React from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: (id: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const hideNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = React.useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000, // Default 5 seconds
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-hide after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, newNotification.duration);
    }
  }, [hideNotification]);

  const showSuccess = React.useCallback((message: string) => {
    showNotification({ type: 'success', message });
  }, [showNotification]);

  const showError = React.useCallback((message: string) => {
    showNotification({ type: 'error', message });
  }, [showNotification]);

  const showInfo = React.useCallback((message: string) => {
    showNotification({ type: 'info', message });
  }, [showNotification]);

  const showWarning = React.useCallback((message: string) => {
    showNotification({ type: 'warning', message });
  }, [showNotification]);

  const value: NotificationContextType = {
    notifications,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
