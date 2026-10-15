import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';

// Conexión con la base de datos. La sesión se guarda en el teléfono
// para que no tengas que iniciar sesión cada vez que abres la app.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Renueva la sesión solo mientras la app está abierta
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

// Sube una foto del teléfono y regresa su dirección pública
export async function uploadImage(userId: string, uri: string): Promise<string> {
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const path = `${userId}/${Date.now()}.${ext}`;
  const body = await fetch(uri).then((res) => res.arrayBuffer());
  const { error } = await supabase.storage
    .from('images')
    .upload(path, body, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
  if (error) throw error;
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
}
