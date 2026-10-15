// Colores de Howl en un solo lugar para cambiarlos fácil.
export const colors = {
  primary: '#6D28D9', // morado Howl
  primarySoft: '#EDE9FE',
  background: '#FFFFFF',
  surface: '#F4F4F5',
  text: '#09090B',
  muted: '#71717A',
  border: '#E4E4E7',
  heart: '#EF4444',
  price: '#16A34A',
};

// Estilo e ícono de cada tipo de publicación (se usa en el Feed y en el botón +)
export const postTypeInfo = {
  text: { label: 'Mensaje', icon: 'chatbubble-ellipses', color: '#0EA5E9' },
  photo: { label: 'Foto', icon: 'image', color: '#EC4899' },
  poll: { label: 'Encuesta', icon: 'stats-chart', color: '#F59E0B' },
  product: { label: 'Producto', icon: 'pricetag', color: '#16A34A' },
  event: { label: 'Evento', icon: 'calendar', color: '#6D28D9' },
} as const;
