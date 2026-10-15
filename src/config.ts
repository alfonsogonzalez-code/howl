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

// Color del grupo de cada carrera
const CAREER_COLORS = ['#8B5CF6', '#0EA5E9', '#F97316', '#14B8A6', '#EC4899', '#16A34A', '#F59E0B'];
export function careerColor(career: string) {
  const index = CAREERS.indexOf(career);
  return CAREER_COLORS[(index >= 0 ? index : career.length) % CAREER_COLORS.length];
}
