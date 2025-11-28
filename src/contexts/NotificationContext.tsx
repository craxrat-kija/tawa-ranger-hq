import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '@/lib/api';
import { useAuth } from './AuthContext';

export interface Notification {
  id: number;
  user_id: number | null;
  type: 'info' | 'success' | 'warning' | 'error' | 'activity';
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  getUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await notificationsApi.getAll();
      setNotifications(response.data || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const count = await notificationsApi.getCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsApi.markAsRead(id.toString());
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationsApi.delete(id.toString());
      const deleted = notifications.find(n => n.id === id);
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        getUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications, getUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

