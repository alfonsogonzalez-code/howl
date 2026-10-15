import { Author, Post } from '../types';

// Datos de ejemplo. Más adelante vendrán de la base de datos (Supabase).

const ana: Author = { name: 'Ana López', career: 'Ing. en Software', avatarColor: '#8B5CF6' };
const luis: Author = { name: 'Luis Pérez', career: 'Mecatrónica', avatarColor: '#0EA5E9' };
const sofia: Author = { name: 'Sofía Ramírez', career: 'Administración', avatarColor: '#F97316' };
const diego: Author = { name: 'Diego Torres', career: 'Biotecnología', avatarColor: '#14B8A6' };
const consejo: Author = { name: 'Consejo Estudiantil', career: 'UPVT', avatarColor: '#16A34A' };

const minutesAgo = (m: number) => Date.now() - m * 60000;

export const samplePosts: Post[] = [
  {
    id: '1',
    type: 'text',
    author: ana,
    createdAt: minutesAgo(5),
    text: '¿Alguien sabe si mañana sí hay clase de Cálculo a las 7? 😅',
    likes: 12,
    liked: false,
    replies: [
      { id: 'r1', author: luis, text: 'Sí hay, el profe lo confirmó en clase', createdAt: minutesAgo(3) },
      { id: 'r2', author: diego, text: 'Nooo yo pensé que no 😭', createdAt: minutesAgo(1) },
    ],
  },
  {
    id: '2',
    type: 'photo',
    author: sofia,
    createdAt: minutesAgo(18),
    imageUrl: 'https://picsum.photos/seed/campus/800/800',
    caption: 'Así amaneció el campus hoy 🌅',
    likes: 87,
    liked: true,
    replies: [{ id: 'r3', author: ana, text: 'Qué bonita foto!!', createdAt: minutesAgo(10) }],
  },
  {
    id: '3',
    type: 'poll',
    author: consejo,
    createdAt: minutesAgo(40),
    question: '¿Qué día prefieren para el torneo de fútbol?',
    options: [
      { id: 'a', label: 'Viernes', votes: 42 },
      { id: 'b', label: 'Sábado', votes: 31 },
      { id: 'c', label: 'Domingo', votes: 9 },
    ],
    myVote: null,
    likes: 23,
    liked: false,
    replies: [],
  },
  {
    id: '4',
    type: 'product',
    author: luis,
    createdAt: minutesAgo(65),
    name: 'Calculadora científica Casio fx-991',
    price: 350,
    description: 'Casi nueva, con estuche. Entrego en la cafetería.',
    imageUrl: 'https://picsum.photos/seed/calculadora/800/600',
    likes: 5,
    liked: false,
    replies: [
      { id: 'r4', author: diego, text: '¿Sigue disponible? ¿La dejas en 300?', createdAt: minutesAgo(30) },
    ],
  },
  {
    id: '5',
    type: 'event',
    author: consejo,
    createdAt: minutesAgo(120),
    title: 'Feria de proyectos 2026',
    date: '24/10/2026',
    time: '10:00',
    place: 'Explanada principal',
    description: 'Presenta tu proyecto o ven a ver los de otras carreras. Habrá premios 🏆',
    going: 64,
    imGoing: false,
    likes: 41,
    liked: false,
    replies: [],
  },
  {
    id: '6',
    type: 'product',
    author: sofia,
    createdAt: minutesAgo(200),
    name: 'Bata de laboratorio talla M',
    price: 180,
    description: 'Usada un semestre, sin manchas.',
    imageUrl: 'https://picsum.photos/seed/bata/800/600',
    likes: 2,
    liked: false,
    replies: [],
  },
];
