// Convierte una fecha en texto corto: "ahora", "5 min", "3 h", "2 d".
// Con `long`: "hace 5 minutos", "hace 3 horas", "hace 2 días" (debajo de las publicaciones).
export function timeAgo(timestamp: number, long = false): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (!long) {
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours} h`;
    if (days < 7) return `${days} d`;
    return `${Math.floor(days / 7)} sem`;
  }
  const plural = (n: number, word: string) => `hace ${n} ${word}${n === 1 ? '' : word.endsWith('s') ? '' : 's'}`;
  if (minutes < 1) return 'justo ahora';
  if (minutes < 60) return plural(minutes, 'minuto');
  if (hours < 24) return plural(hours, 'hora');
  if (days < 7) return plural(days, 'día');
  return plural(Math.floor(days / 7), 'semana');
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// De "24/10/2026" saca { day: "24", month: "OCT" } para el cuadrito del evento.
export function splitDate(date: string): { day: string; month: string } | null {
  const [day, month] = date.split('/');
  const monthName = MONTHS[Number(month) - 1];
  if (!day || !monthName) return null;
  return { day, month: monthName };
}

// Hora en formato 9:41 p. m. para los mensajes del chat
export function clockTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'a. m.' : 'p. m.'}`;
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "Hoy", "Ayer" o "12 oct" para separar los días en el chat
export function dayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

// En la lista de chats: la hora si fue hoy, "Ayer" o la fecha
export function chatListTime(timestamp: number): string {
  const label = dayLabel(timestamp);
  return label === 'Hoy' ? clockTime(timestamp) : label;
}
