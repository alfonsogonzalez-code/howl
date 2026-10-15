import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ProfileRow, toAuthor } from '../lib/profiles';
import { navigationRef } from '../navigationRef';
import { AppNotification, NotificationType } from '../types';
import { useCurrentUser } from './AuthContext';
import { useBanner } from './BannerContext';

// Tus notificaciones: quién le dio like, respondió, votó o asistirá a lo tuyo.
// La base de datos las crea sola; aquí solo se leen y se marcan como vistas.

type NotificationsContextValue = {
  notifications: AppNotification[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const NOTIFICATION_QUERY = `
  id, type, post_id, text, read, created_at,
  actor:profiles!notifications_actor_id_fkey(*),
  post:posts(type, data)
`;

type NotificationRow = {
  id: string;
  type: NotificationType;
  post_id: string;
  text: string | null;
  read: boolean;
  created_at: string;
  actor: ProfileRow;
  post: { type: string; data: any } | null;
};

// Texto corto de la publicación para saber de cuál se trata
function postPreview(post: NotificationRow['post']): string {
  if (!post) return '';
  const d = post.data ?? {};
  return d.text || d.caption || d.question || d.name || d.title || 'tu foto';
}

function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    actor: toAuthor(row.actor),
    postId: row.post_id,
    postPreview: postPreview(row.post),
    postImage: row.post?.data?.imageUrl ?? null,
    text: row.text,
    read: row.read,
    createdAt: new Date(row.created_at).getTime(),
  };
}

// Lo que dice cada aviso después del nombre
export function notificationMessage(n: AppNotification): string {
  switch (n.type) {
    case 'like':
      return 'le dio ❤️ a tu publicación';
    case 'reply':
      return `respondió: "${n.text ?? ''}"`;
    case 'thread':
      return `también respondió en un hilo: "${n.text ?? ''}"`;
    case 'vote':
      return 'votó en tu encuesta';
    case 'going':
      return 'asistirá a tu evento';
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const me = useCurrentUser();
  const showBanner = useBanner();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select(NOTIFICATION_QUERY)
      .order('created_at', { ascending: false })
      .limit(60);
    if (!error) setNotifications((data as unknown as NotificationRow[]).map(toNotification));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('howl-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me.id}` },
        async (payload) => {
          const { data } = await supabase
            .from('notifications')
            .select(NOTIFICATION_QUERY)
            .eq('id', (payload.new as { id: string }).id)
            .maybeSingle();
          if (!data) return;
          const notification = toNotification(data as unknown as NotificationRow);
          setNotifications((current) =>
            current.some((n) => n.id === notification.id) ? current : [notification, ...current],
          );
          showBanner({
            author: notification.actor,
            title: notification.actor.name,
            text: notificationMessage(notification),
            onPress: () =>
              navigationRef.isReady() &&
              navigationRef.navigate('Thread', { postId: notification.postId }),
          });
        },
      )
      // Si se borra (por ejemplo, alguien quitó su like) se vuelve a cargar la lista
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me.id, refresh, showBanner]);

  const value: NotificationsContextValue = {
    notifications,
    unread: notifications.filter((n) => !n.read).length,
    loading,
    refresh,
    markAllRead: () => {
      if (!notifications.some((n) => !n.read)) return;
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
      supabase.from('notifications').update({ read: true }).eq('user_id', me.id).eq('read', false).then();
    },
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>');
  return context;
}
