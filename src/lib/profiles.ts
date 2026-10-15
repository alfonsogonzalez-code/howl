import { Author } from '../types';

// Cómo viene un perfil desde la base de datos
export type ProfileRow = { id: string; name: string; career: string; avatar_color: string };

export const toAuthor = (row: ProfileRow): Author => ({
  id: row.id,
  name: row.name,
  career: row.career,
  avatarColor: row.avatar_color,
});
