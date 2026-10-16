import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
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
  error: string | null;
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
  return d.text || d.caption || d.question || d.name || d.title || (d.mediaType === 'video' ? 'tu video' : 'tu foto');
}

function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    actor: toAuthor(row.actor),
    postId: row.post_id,
    postPreview: postPreview(row.post),
    postImage: row.post?.data?.thumbUrl ?? row.post?.data?.imageUrl ?? null,
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
  const [error, setError] = useState<string | null>(null);

  // Trae tu historial de notificaciones (se guarda en la base de datos,
  // así que sigue ahí aunque cierres sesión o cambies de celular)
  const refresh = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('notifications')
      .select(NOTIFICATION_QUERY)
      .eq('user_id', me.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (loadError) {
      setError(loadError.message);
    } else {
      setError(null);
      setNotifications(
        (data as unknown as NotificationRow[])
          .filter((row) => row.actor) // por si alguien borró su cuenta
          .map(toNotification),
      );
    }
    setLoading(false);
  }, [me.id]);

  // Al volver a la app se actualiza, por si llegaron avisos mientras estaba cerrada
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    refresh();
    const channel = supabase
      // Nombre único: si cierras sesión y vuelves a entrar no choca con el anterior
      .channel(`howl-notifications-${me.id}-${Date.now()}`)
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
      // Al reconectarse (por ejemplo, después de estar sin internet) vuelve a cargar
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refresh();
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me.id, refresh, showBanner]);

  const value: NotificationsContextValue = {
    notifications,
    unread: notifications.filter((n) => !n.read).length,
    loading,
    error,
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
