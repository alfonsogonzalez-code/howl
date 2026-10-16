import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toAuthor } from '../lib/profiles';
import { cropImage, loadImage, uploadFile } from '../lib/media';
import { forgetPushToken } from '../lib/push';
import { Author } from '../types';

// Maneja el inicio de sesión y el perfil de quien usa la app.

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  profile: Author | null; // null = aún no llena su nombre y carrera
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  saveProfile: (name: string, career: string) => Promise<void>;
  updateProfile: (changes: ProfileChanges) => Promise<void>;
  setNote: (note: string | null) => Promise<void>;
  signOut: () => Promise<void>;
};

// Lo que se puede cambiar en "Editar perfil".
// avatarUri: foto nueva del celular, o null para quitar la foto.
export type ProfileChanges = {
  name?: string;
  career?: string;
  bio?: string;
  avatarUri?: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AVATAR_COLORS = ['#6D28D9', '#0EA5E9', '#F97316', '#14B8A6', '#EC4899', '#16A34A', '#F59E0B'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data ? toAuthor(data) : null);
  };

  useEffect(() => {
    // Revisa si ya había una sesión guardada y escucha cambios (entrar / salir)
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        // setTimeout evita bloquear a Supabase mientras termina de iniciar sesión
        setTimeout(() => loadProfile(newSession.user.id).finally(() => setLoading(false)), 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    loading,
    session,
    profile,

    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
    },

    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      // Si Supabase sigue pidiendo confirmar el correo, no regresa sesión
      if (!data.session) {
        throw new Error('Supabase está pidiendo confirmar el correo. Desactiva "Confirm email" en Authentication.');
      }
    },

    saveProfile: async (name, career) => {
      if (!session) return;
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: session.user.id, name: name.trim(), career, avatar_color: avatarColor });
      if (error) throw error;
      await loadProfile(session.user.id);
    },

    updateProfile: async (changes) => {
      if (!session) return;
      const row: Record<string, unknown> = {};
      if (changes.name !== undefined) row.name = changes.name.trim();
      if (changes.career !== undefined) row.career = changes.career;
      if (changes.bio !== undefined) row.bio = changes.bio.trim();
      if (changes.avatarUri === null) row.avatar_url = null;
      if (changes.avatarUri) {
        // La foto de perfil se recorta cuadrada y chiquita para que cargue rápido
        const image = await loadImage(changes.avatarUri);
        const side = Math.min(image.width, image.height);
        const square = await cropImage(
          image,
          { originX: (image.width - side) / 2, originY: (image.height - side) / 2, width: side, height: side },
          480,
        );
        row.avatar_url = await uploadFile(session.user.id, square.uri, 'image');
      }
      const { error } = await supabase.from('profiles').update(row).eq('id', session.user.id);
      if (error) throw error;
      await loadProfile(session.user.id);
    },

    setNote: async (note) => {
      if (!session) return;
      const text = note?.trim() || null;
      const { error } = await supabase
        .from('profiles')
        .update({ note: text, note_at: text ? new Date().toISOString() : null })
        .eq('id', session.user.id);
      if (error) throw error;
      await loadProfile(session.user.id);
    },

    signOut: async () => {
      // Primero este celular deja de recibir tus avisos
      await forgetPushToken().catch(() => {});
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}

// Atajo para pantallas que ya están dentro de la app (siempre hay perfil)
export function useCurrentUser(): Author {
  const { profile } = useAuth();
  if (!profile) throw new Error('No hay perfil');
  return profile;
}
