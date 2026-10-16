import { Author } from '../types';

// Cómo viene un perfil desde la base de datos
export type ProfileRow = {
  id: string;
  name: string;
  career: string;
  avatar_color: string;
  avatar_url?: string | null;
  bio?: string | null;
  note?: string | null;
  note_at?: string | null;
};

// Las notas duran 24 horas, como en Instagram
export const NOTE_HOURS = 24;

export function noteIsActive(note: string | null | undefined, noteAt: string | null | undefined) {
  if (!note || !noteAt) return false;
  return Date.now() - new Date(noteAt).getTime() < NOTE_HOURS * 3600 * 1000;
}

export const toAuthor = (row: ProfileRow): Author => ({
  id: row.id,
  name: row.name,
  career: row.career,
  avatarColor: row.avatar_color,
  avatarUrl: row.avatar_url ?? null,
  bio: row.bio ?? '',
  note: noteIsActive(row.note, row.note_at) ? row.note! : null,
});
