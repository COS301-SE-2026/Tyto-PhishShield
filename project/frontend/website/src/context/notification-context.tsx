import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { fetchNotifications, type AppNotification } from '../services/notifications';
import { connectXpSocket } from '../services/xp-socket';

const LAST_SEEN_KEY = 'notifications_last_seen';
const PREFERENCES_KEY = 'notification_preferences';
const POLL_INTERVAL_MS = 60_000;

export interface NotificationPreferences {
  training: boolean; /** New training */
  leaderboard: boolean; /** XP gained/lost */
  digest: boolean; /** Weekly email digest (bonus feature) */
}

const DEFAULT_PREFERENCES: NotificationPreferences = { training: true, leaderboard: false, digest: true };

function loadPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<NotificationPreferences>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function applyPreferences(notifications: AppNotification[], prefs: NotificationPreferences): AppNotification[] {
  return notifications.filter(n => {
    if (n.type === 'training') return prefs.training;
    if (n.type === 'xp') return prefs.leaderboard;
    return true;
  });
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  preferences: NotificationPreferences;
  setPreferences: (prefs: NotificationPreferences) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rawNotifications, setRawNotifications] = useState<AppNotification[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState(() => localStorage.getItem(LAST_SEEN_KEY) ?? new Date(0).toISOString());
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(() => loadPreferences());

  const refresh = useCallback(async () => {
    if (!user?.auth0Id) return;
    try {
      setRawNotifications(await fetchNotifications(user.auth0Id));
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

  const setPreferences = useCallback((prefs: NotificationPreferences) => {
    setPreferencesState(prefs);
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch {
      // Preferences will not persist across reloads
    }
  }, []);

  const notifications = applyPreferences(rawNotifications, preferences);
  const unreadCount = notifications.filter(n => new Date(n.timestamp).getTime() > new Date(lastSeenAt).getTime()).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, preferences, setPreferences }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}