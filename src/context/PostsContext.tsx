import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase, uploadImage } from '../lib/supabase';
import { Author, Post, PostDraft } from '../types';
import { useCurrentUser } from './AuthContext';

// Aquí viven todas las publicaciones y las acciones sobre ellas.
// Se guardan en Supabase y se actualizan solas cuando alguien más publica.

type PostsContextValue = {
  posts: Post[];
  loading: boolean;
  refresh: () => Promise<void>;
  addPost: (draft: PostDraft) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => void;
  vote: (postId: string, optionId: string) => void;
  toggleGoing: (postId: string) => void;
  addReply: (postId: string, text: string) => Promise<void>;
};

const PostsContext = createContext<PostsContextValue | null>(null);

// Lo que pedimos a la base de datos: la publicación con su autor, likes, votos, asistentes y respuestas
const POST_QUERY = `
  id, type, data, created_at,
  author:profiles(*),
  likes(user_id),
  poll_votes(user_id, option_id),
  event_attendees(user_id),
  replies(id, text, created_at, author:profiles(*))
`;

type ProfileRow = { id: string; name: string; career: string; avatar_color: string };
type PostRow = {
  id: string;
  type: Post['type'];
  data: any;
  created_at: string;
  author: ProfileRow;
  likes: { user_id: string }[];
  poll_votes: { user_id: string; option_id: string }[];
  event_attendees: { user_id: string }[];
  replies: { id: string; text: string; created_at: string; author: ProfileRow }[];
};

const toAuthor = (row: ProfileRow): Author => ({
  id: row.id,
  name: row.name,
  career: row.career,
  avatarColor: row.avatar_color,
});

// Convierte una fila de la base de datos en una publicación de la app
function toPost(row: PostRow, myId: string): Post {
  const base = {
    id: row.id,
    author: toAuthor(row.author),
    createdAt: new Date(row.created_at).getTime(),
    likes: row.likes.length,
    liked: row.likes.some((l) => l.user_id === myId),
    replies: row.replies
      .map((r) => ({
        id: r.id,
        text: r.text,
        author: toAuthor(r.author),
        createdAt: new Date(r.created_at).getTime(),
      }))
      .sort((a, b) => a.createdAt - b.createdAt),
  };

  switch (row.type) {
    case 'poll':
      return {
        ...base,
        type: 'poll',
        question: row.data.question,
        options: (row.data.options as { id: string; label: string }[]).map((o) => ({
          ...o,
          votes: row.poll_votes.filter((v) => v.option_id === o.id).length,
        })),
        myVote: row.poll_votes.find((v) => v.user_id === myId)?.option_id ?? null,
      };
    case 'event':
      return {
        ...base,
        type: 'event',
        ...row.data,
        going: row.event_attendees.length,
        imGoing: row.event_attendees.some((a) => a.user_id === myId),
      };
    default:
      return { ...base, type: row.type, ...row.data } as Post;
  }
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const me = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_QUERY)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) setPosts((data as unknown as PostRow[]).map((row) => toPost(row, me.id)));
    setLoading(false);
  }, [me.id]);

  // Carga inicial y actualización en tiempo real
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    refresh();
    const scheduleRefresh = () => {
      // Si llegan muchos cambios juntos, recarga una sola vez
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(refresh, 400);
    };
    const channel = supabase.channel('howl-feed');
    for (const table of ['posts', 'likes', 'poll_votes', 'event_attendees', 'replies']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh);
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Cambia una publicación en pantalla al instante (antes de que responda el servidor)
  const updateLocal = (postId: string, change: (post: Post) => Post) =>
    setPosts((current) => current.map((p) => (p.id === postId ? change(p) : p)));

  // Si el servidor marca error, recarga para mostrar lo que de verdad está guardado
  const check = async (request: PromiseLike<{ error: unknown }>) => {
    const { error } = await request;
    if (error) refresh();
  };

  const value: PostsContextValue = {
    posts,
    loading,
    refresh,

    addPost: async (draft) => {
      const { type, ...data } = draft as PostDraft & { imageUrl?: string };
      // Las fotos se suben primero a la nube
      if ('imageUrl' in data && data.imageUrl && !data.imageUrl.startsWith('http')) {
        data.imageUrl = await uploadImage(me.id, data.imageUrl);
      }
      // Los votos y asistentes viven en sus propias tablas, no dentro de la publicación
      if (type === 'poll') {
        const poll = data as { question: string; options: { id: string; label: string }[] };
        Object.assign(data, { options: poll.options.map(({ id, label }) => ({ id, label })) });
        delete (data as { myVote?: unknown }).myVote;
      }
      if (type === 'event') {
        delete (data as { going?: unknown }).going;
        delete (data as { imGoing?: unknown }).imGoing;
      }
      const { error } = await supabase.from('posts').insert({ author_id: me.id, type, data });
      if (error) throw error;
      await refresh();
    },

    deletePost: async (postId) => {
      setPosts((current) => current.filter((p) => p.id !== postId));
      await check(supabase.from('posts').delete().eq('id', postId));
    },

    toggleLike: (postId) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      updateLocal(postId, (p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }));
      check(
        post.liked
          ? supabase.from('likes').delete().match({ post_id: postId, user_id: me.id })
          : supabase.from('likes').insert({ post_id: postId }),
      );
    },

    vote: (postId, optionId) => {
      updateLocal(postId, (p) => {
        if (p.type !== 'poll') return p;
        // Quita el voto anterior (si había) y suma el nuevo
        const options = p.options.map((o) => ({
          ...o,
          votes: o.votes - (o.id === p.myVote ? 1 : 0) + (o.id === optionId ? 1 : 0),
        }));
        return { ...p, options, myVote: optionId };
      });
      check(supabase.from('poll_votes').upsert({ post_id: postId, user_id: me.id, option_id: optionId }));
    },

    toggleGoing: (postId) => {
      const post = posts.find((p) => p.id === postId);
      if (!post || post.type !== 'event') return;
      updateLocal(postId, (p) =>
        p.type === 'event' ? { ...p, imGoing: !p.imGoing, going: p.going + (p.imGoing ? -1 : 1) } : p,
      );
      check(
        post.imGoing
          ? supabase.from('event_attendees').delete().match({ post_id: postId, user_id: me.id })
          : supabase.from('event_attendees').insert({ post_id: postId }),
      );
    },

    addReply: async (postId, text) => {
      const { error } = await supabase.from('replies').insert({ post_id: postId, text });
      if (error) throw error;
      await refresh();
    },
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts debe usarse dentro de <PostsProvider>');
  return context;
}
