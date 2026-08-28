import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { fetchNotifications, type AppNotification } from '../services/notifications';
import { connectXpSocket } from '../services/xp-socket';

const LAST_SEEN_KEY = 'notifications_last_seen';
const POLL_INTERVAL_MS = 60_000;

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState(() => localStorage.getItem(LAST_SEEN_KEY) ?? new Date(0).toISOString());

  const refresh = useCallback(async () => {
    if (!user?.auth0Id) return;
    try {
      setNotifications(await fetchNotifications(user.auth0Id));
    } catch {
      // Background refresh
    }
  }, [user]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => { void refresh(); }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!user?.auth0Id) return;
    let cancelled = false;
    let socket: Awaited<ReturnType<typeof connectXpSocket>> | undefined;
    connectXpSocket()
      .then(s => {
        if (cancelled) { s.disconnect(); return; }
        socket = s;
        s.on('xp-given-all', () => { void refresh(); });
      })
      .catch(() => undefined);
    return () => { cancelled = true; socket?.disconnect(); };
  }, [user, refresh]);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_KEY, now);
    setLastSeenAt(now);
  }, []);

  const unreadCount = notifications.filter(n => new Date(n.timestamp).getTime() > new Date(lastSeenAt).getTime()).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}