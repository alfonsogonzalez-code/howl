// Tipos de datos de Howl.

export type Author = {
  id: string;
  name: string;
  career: string; // carrera, por ejemplo "Ing. en Software"
  avatarColor: string;
};

// Respuesta dentro del hilo de una publicación
export type Reply = {
  id: string;
  author: Author;
  text: string;
  createdAt: number; // fecha en milisegundos
};

type BasePost = {
  id: string;
  author: Author;
  createdAt: number;
  likes: number;
  liked: boolean; // si yo ya le di corazón
  replies: Reply[];
};

// Mensaje corto estilo tweet
export type TextPost = BasePost & {
  type: 'text';
  text: string;
};

// Foto con texto opcional
export type PhotoPost = BasePost & {
  type: 'photo';
  imageUrl: string;
  caption: string;
};

// Encuesta con incisos, como en WhatsApp
export type PollPost = BasePost & {
  type: 'poll';
  question: string;
  options: { id: string; label: string; votes: number }[];
  myVote: string | null; // id del inciso que elegí
};

// Producto del marketplace estudiantil
export type ProductPost = BasePost & {
  type: 'product';
  name: string;
  price: number;
  description: string;
  imageUrl: string;
};

// Evento del campus
export type EventPost = BasePost & {
  type: 'event';
  title: string;
  date: string; // formato dd/mm/aaaa
  time: string; // por ejemplo 10:00
  place: string;
  description: string;
  going: number;
  imGoing: boolean;
};

export type Post = TextPost | PhotoPost | PollPost | ProductPost | EventPost;
export type PostType = Post['type'];

// Lo que llena el usuario al crear una publicación (sin id, autor, likes, etc.)
type DraftOf<T> = T extends Post
  ? Omit<T, 'id' | 'author' | 'createdAt' | 'likes' | 'liked' | 'replies'>
  : never;
export type PostDraft = DraftOf<Post>;

// Mensaje del chat grupal de una carrera
export type ChatMessage = {
  id: string;
  author: Author;
  text: string;
  createdAt: number;
  pending?: boolean; // todavía se está enviando
};

// Aviso de que alguien interactuó con algo tuyo
export type NotificationType = 'like' | 'reply' | 'thread' | 'vote' | 'going';
export type AppNotification = {
  id: string;
  type: NotificationType;
  actor: Author;
  postId: string;
  postPreview: string; // de qué publicación se trata
  postImage: string | null;
  text: string | null; // lo que respondieron
  read: boolean;
  createdAt: number;
};
