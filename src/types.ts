// Tipos de publicaciones que puede haber en el Feed de Howl.

export type Author = {
  name: string;
  career: string; // carrera, por ejemplo "Ing. en Software"
  avatarColor: string;
};

type BasePost = {
  id: string;
  author: Author;
  createdAt: string; // texto corto como "hace 5 min"
};

// Mensaje corto estilo tweet
export type TextPost = BasePost & {
  type: 'text';
  text: string;
};

// Encuesta con incisos, como en WhatsApp
export type PollPost = BasePost & {
  type: 'poll';
  question: string;
  options: { id: string; label: string; votes: number }[];
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
  date: string;
  place: string;
  description: string;
};

// Foto con texto opcional
export type PhotoPost = BasePost & {
  type: 'photo';
  imageUrl: string;
  caption?: string;
};

export type Post = TextPost | PollPost | ProductPost | EventPost | PhotoPost;
