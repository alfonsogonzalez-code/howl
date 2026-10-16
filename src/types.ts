// Tipos de datos de Howl.

export type Author = {
  id: string;
  name: string;
  career: string; // carrera, por ejemplo "Ing. en Software"
  avatarColor: string;
  avatarUrl: string | null; // foto de perfil (si no hay, se ve la inicial)
  bio: string; // descripción del perfil
  note: string | null; // nota tipo Instagram; dura 24 horas
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
  saved: boolean; // si la guardé (el marcador)
  replies: Reply[];
};

// Mensaje corto estilo tweet
export type TextPost = BasePost & {
  type: 'text';
  text: string;
};

// Foto o video con texto opcional
export type PhotoPost = BasePost & {
  type: 'photo';
  mediaType?: 'image' | 'video'; // las publicaciones viejas no lo traen: son fotos
  imageUrl: string; // la foto, o el video
  thumbUrl?: string; // portada del video
  aspectRatio?: number; // ancho / alto del recorte (las viejas eran cuadradas)
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
  aspectRatio?: number;
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
  ? Omit<T, 'id' | 'author' | 'createdAt' | 'likes' | 'liked' | 'saved' | 'replies'>
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
