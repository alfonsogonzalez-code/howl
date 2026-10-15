import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Author } from '../types';

// Maneja el inicio de sesión y el perfil de quien usa la app.

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  profile: Author | null; // null = aún no llena su nombre y carrera
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  saveProfile: (name: string, career: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AVATAR_COLORS = ['#6D28D9', '#0EA5E9', '#F97316', '#14B8A6', '#EC4899', '#16A34A', '#F59E0B'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(
      data ? { id: data.id, name: data.name, career: data.career, avatarColor: data.avatar_color } : null,
    );
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

    signOut: async () => {
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
