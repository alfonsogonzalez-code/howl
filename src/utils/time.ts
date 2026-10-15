// Convierte una fecha en texto corto: "ahora", "5 min", "3 h", "2 d".
export function timeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// De "24/10/2026" saca { day: "24", month: "OCT" } para el cuadrito del evento.
export function splitDate(date: string): { day: string; month: string } | null {
  const [day, month] = date.split('/');
  const monthName = MONTHS[Number(month) - 1];
  if (!day || !monthName) return null;
  return { day, month: monthName };
}
