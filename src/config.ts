// Configuración de Howl. Los datos de Supabase están en Project Settings → API.
// La llave "publishable" es segura de poner aquí: la seguridad la dan las reglas de la base de datos.

export const SUPABASE_URL = 'https://xjauqwruyptcbeonohwh.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_zTsRI0DJB71i3eHhvNJ8rw_fHnC8tDK';

// Revisa que el correo tenga forma de correo (algo@algo.algo)
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Carreras de la UPVT (cámbialas por las reales). Se usan en el registro y en los grupos.
export const CAREERS = [
  'Ing. en Software',
  'Ing. en TICs',
  'Mecatrónica',
  'Biotecnología',
  'Administración',
];
