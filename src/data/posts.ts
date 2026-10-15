import { Author, Post } from '../types';

// Datos de ejemplo. Más adelante vendrán de la base de datos (Supabase).

const ana: Author = { name: 'Ana López', career: 'Ing. en Software', avatarColor: '#7C3AED' };
const luis: Author = { name: 'Luis Pérez', career: 'Mecatrónica', avatarColor: '#0EA5E9' };
const sofia: Author = { name: 'Sofía Ramírez', career: 'Administración', avatarColor: '#F97316' };
const consejo: Author = { name: 'Consejo Estudiantil', career: 'UPVT', avatarColor: '#16A34A' };

export const samplePosts: Post[] = [
  {
    id: '1',
    type: 'text',
    author: ana,
    createdAt: 'hace 5 min',
    text: '¿Alguien sabe si mañana sí hay clase de Cálculo a las 7? 😅',
  },
  {
    id: '2',
    type: 'poll',
    author: consejo,
    createdAt: 'hace 20 min',
    question: '¿Qué día prefieren para el torneo de fútbol?',
    options: [
      { id: 'a', label: 'Viernes', votes: 42 },
      { id: 'b', label: 'Sábado', votes: 31 },
      { id: 'c', label: 'Domingo', votes: 9 },
    ],
  },
  {
    id: '3',
    type: 'product',
    author: luis,
    createdAt: 'hace 1 h',
    name: 'Calculadora científica Casio fx-991',
    price: 350,
    description: 'Casi nueva, con estuche. Entrega en la cafetería.',
    imageUrl: 'https://picsum.photos/seed/calculadora/600/400',
  },
  {
    id: '4',
    type: 'event',
    author: consejo,
    createdAt: 'hace 2 h',
    title: 'Feria de proyectos 2026',
    date: 'Vie 24 de octubre · 10:00',
    place: 'Explanada principal',
    description: 'Presenta tu proyecto o ven a ver los de otras carreras.',
  },
  {
    id: '5',
    type: 'photo',
    author: sofia,
    createdAt: 'hace 3 h',
    imageUrl: 'https://picsum.photos/seed/campus/600/450',
    caption: 'Así amaneció el campus hoy 🌅',
  },
];
