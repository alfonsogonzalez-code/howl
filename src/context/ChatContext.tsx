import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ProfileRow, toAuthor } from '../lib/profiles';
import { navigationRef } from '../navigationRef';
import { ChatMessage } from '../types';
import { useCurrentUser } from './AuthContext';
import { useBanner } from './BannerContext';

// Chat grupal de tu carrera. Solo puedes entrar al de tu carrera,
// y primero te tienes que unir.

type Membership = { lastReadAt: number; muted: boolean };

type ChatContextValue = {
  career: string;
  // undefined = cargando, null = aún no te unes
  membership: Membership | null | undefined;
  messages: ChatMessage[]; // del más viejo al más nuevo
  memberCount: number;
  unread: number;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  send: (text: string) => Promise<void>;
  deleteMessage: (id: string) => void;
  markRead: () => void;
  setMuted: (muted: boolean) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const MESSAGE_QUERY = 'id, text, created_at, author:profiles!messages_author_id_fkey(*)';

type MessageRow = { id: string; text: string; created_at: string; author: ProfileRow };

const toMessage = (row: MessageRow): ChatMessage => ({
  id: row.id,
  text: row.text,
  author: toAuthor(row.author),
  createdAt: new Date(row.created_at).getTime(),
});

const isChatOpen = () => navigationRef.isReady() && navigationRef.getCurrentRoute()?.name === 'ChatRoom';

export function ChatProvider({ children }: { children: ReactNode }) {
  const me = useCurrentUser();
  const showBanner = useBanner();
  const career = me.career;
  const [membership, setMembership] = useState<Membership | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memberCount, setMemberCount] = useState(0);

  // El aviso de mensaje nuevo necesita saber si silenciaste el grupo
  const membershipRef = useRef(membership);
  membershipRef.current = membership;

  const loadMemberCount = useCallback(async () => {
    const { count } = await supabase
      .from('group_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('career', career);
    setMemberCount(count ?? 0);
  }, [career]);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select(MESSAGE_QUERY)
      .eq('career', career)
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setMessages((data as unknown as MessageRow[]).map(toMessage).reverse());
  }, [career]);

  const loadMembership = useCallback(async () => {
    const { data } = await supabase
      .from('group_members')
      .select('last_read_at, muted')
      .eq('career', career)
      .eq('user_id', me.id)
      .maybeSingle();
    const next = data ? { lastReadAt: new Date(data.last_read_at).getTime(), muted: data.muted } : null;
    setMembership(next);
    if (next) loadMessages();
    loadMemberCount();
  }, [career, me.id, loadMessages, loadMemberCount]);

  useEffect(() => {
    loadMembership();
  }, [loadMembership]);

  // Mensajes nuevos en tiempo real (solo llegan los de tu grupo).
  // Se conecta al unirte y se desconecta al salirte.
  const isMember = !!membership;
  useEffect(() => {
    if (!isMember) return;
    const channel = supabase
      .channel(`howl-chat-${me.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const row = payload.new as { id: string; career: string; author_id: string };
          if (row.career !== career) return;
          const { data } = await supabase.from('messages').select(MESSAGE_QUERY).eq('id', row.id).maybeSingle();
          if (!data) return;
          const message = toMessage(data as unknown as MessageRow);
          setMessages((current) =>
            current.some((m) => m.id === message.id) ? current : [...current, message],
          );
          if (message.author.id === me.id) return;
          if (isChatOpen()) {
            markReadNow();
          } else if (!membershipRef.current?.muted) {
            showBanner({
              author: message.author,
              title: `${message.author.name} · ${career}`,
              text: message.text,
              onPress: () => navigationRef.isReady() && navigationRef.navigate('ChatRoom'),
            });
          }
        },
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        const id = (payload.old as { id?: string }).id;
        if (id) setMessages((current) => current.filter((m) => m.id !== id));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMember, career, me.id, showBanner]);

  const markReadNow = () => {
    const now = Date.now();
    setMembership((current) => (current ? { ...current, lastReadAt: now } : current));
    supabase
      .from('group_members')
      .update({ last_read_at: new Date(now).toISOString() })
      .eq('career', career)
      .eq('user_id', me.id)
      .then();
  };

  const value: ChatContextValue = {
    career,
    membership,
    messages,
    memberCount,
    unread: membership
      ? messages.filter((m) => m.author.id !== me.id && m.createdAt > membership.lastReadAt).length
      : 0,

    join: async () => {
      const { error } = await supabase.from('group_members').insert({ career });
      if (error && !error.message.includes('duplicate')) throw error;
      await loadMembership();
    },

    leave: async () => {
      const { error } = await supabase.from('group_members').delete().eq('career', career).eq('user_id', me.id);
      if (error) throw error;
      setMembership(null);
      setMessages([]);
      loadMemberCount();
    },

    send: async (text) => {
      // Aparece al instante con un relojito y se confirma cuando llega al servidor
      const tempId = `temp-${Date.now()}`;
      setMessages((current) => [
        ...current,
        { id: tempId, text, author: me, createdAt: Date.now(), pending: true },
      ]);
      const { data, error } = await supabase
        .from('messages')
        .insert({ career, text })
        .select(MESSAGE_QUERY)
        .single();
      if (error || !data) {
        setMessages((current) => current.filter((m) => m.id !== tempId));
        throw error ?? new Error('No se pudo enviar');
      }
      const saved = toMessage(data as unknown as MessageRow);
      setMessages((current) => {
        const withoutTemp = current.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === saved.id) ? withoutTemp : [...withoutTemp, saved];
      });
      markReadNow();
    },

    deleteMessage: (id) => {
      setMessages((current) => current.filter((m) => m.id !== id));
      supabase.from('messages').delete().eq('id', id).then(({ error }) => error && loadMessages());
    },

    markRead: markReadNow,

    setMuted: (muted) => {
      setMembership((current) => (current ? { ...current, muted } : current));
      supabase.from('group_members').update({ muted }).eq('career', career).eq('user_id', me.id).then();
    },
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat debe usarse dentro de <ChatProvider>');
  return context;
}
