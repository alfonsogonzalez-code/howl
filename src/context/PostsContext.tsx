import { createContext, ReactNode, useContext, useState } from 'react';
import { Post, PostDraft } from '../types';
import { samplePosts } from '../data/posts';
import { currentUser } from '../data/currentUser';

// Aquí viven todas las publicaciones y las acciones sobre ellas.
// Cualquier pantalla puede usarlas con usePosts().
// Por ahora todo se guarda solo en el teléfono; luego se conectará a Supabase.

type PostsContextValue = {
  posts: Post[];
  addPost: (draft: PostDraft) => void;
  toggleLike: (postId: string) => void;
  vote: (postId: string, optionId: string) => void;
  toggleGoing: (postId: string) => void;
  addReply: (postId: string, text: string) => void;
};

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(samplePosts);

  // Cambia una sola publicación y deja las demás igual
  const updatePost = (postId: string, change: (post: Post) => Post) =>
    setPosts((current) => current.map((p) => (p.id === postId ? change(p) : p)));

  const value: PostsContextValue = {
    posts,

    addPost: (draft) => {
      const post = {
        ...draft,
        id: String(Date.now()),
        author: currentUser,
        createdAt: Date.now(),
        likes: 0,
        liked: false,
        replies: [],
      } as Post;
      setPosts((current) => [post, ...current]);
    },

    toggleLike: (postId) =>
      updatePost(postId, (p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) })),

    vote: (postId, optionId) =>
      updatePost(postId, (p) => {
        if (p.type !== 'poll') return p;
        // Quita el voto anterior (si había) y suma el nuevo
        const options = p.options.map((o) => ({
          ...o,
          votes: o.votes - (o.id === p.myVote ? 1 : 0) + (o.id === optionId ? 1 : 0),
        }));
        return { ...p, options, myVote: optionId };
      }),

    toggleGoing: (postId) =>
      updatePost(postId, (p) =>
        p.type === 'event'
          ? { ...p, imGoing: !p.imGoing, going: p.going + (p.imGoing ? -1 : 1) }
          : p,
      ),

    addReply: (postId, text) =>
      updatePost(postId, (p) => ({
        ...p,
        replies: [
          ...p.replies,
          { id: String(Date.now()), author: currentUser, text, createdAt: Date.now() },
        ],
      })),
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts debe usarse dentro de <PostsProvider>');
  return context;
}
