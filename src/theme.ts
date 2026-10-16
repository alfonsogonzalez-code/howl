// Colores de Howl en un solo lugar para cambiarlos fácil.
// Casi todo es blanco y negro como Instagram; el morado Howl es el toque de color.
export const colors = {
  primary: '#6D28D9', // morado Howl
  primarySoft: '#EDE9FE',
  background: '#FFFFFF',
  surface: '#EFEFEF', // gris de botones y cajas de texto
  text: '#000000',
  muted: '#737373',
  border: '#DBDBDB',
  heart: '#FF3040', // rojo del corazón de Instagram
  price: '#16A34A',
};

// Degradado de los aros de perfil (amarillo → rosa → morado Howl)
export const gradient = ['#FBBF24', '#F43F5E', '#C026D3', '#6D28D9'] as const;

// Letra del logo, como la de Instagram (se carga en App.tsx)
export const logoFont = 'GrandHotel_400Regular';

// Estilo e ícono de cada tipo de publicación (se usa en el Feed y en el botón +)
export const postTypeInfo = {
  photo: { label: 'Foto o video', plural: 'Fotos', icon: 'images', color: '#EC4899' },
  text: { label: 'Mensaje', plural: 'Mensajes', icon: 'chatbubble-ellipses', color: '#0EA5E9' },
  poll: { label: 'Encuesta', plural: 'Encuestas', icon: 'stats-chart', color: '#F59E0B' },
  product: { label: 'Producto', plural: 'Productos', icon: 'pricetag', color: '#16A34A' },
  event: { label: 'Evento', plural: 'Eventos', icon: 'calendar', color: '#6D28D9' },
} as const;
