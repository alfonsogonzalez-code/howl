import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from './supabase';
import { navigationRef } from '../navigationRef';

// Avisos al celular (como los de WhatsApp o Instagram), aunque la app esté cerrada.
// La base de datos los manda solita; aquí solo se registra el celular y se
// decide a dónde ir cuando tocas el aviso.

// Con la app abierta no sale el aviso del sistema: ya sale el aviso de Howl arriba
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Expo Go en Android ya no puede recibir avisos (en el APK y en iPhone sí)
const pushUnavailable =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let myToken: string | null = null;

async function registerForPush() {
  if (!Device.isDevice || pushUnavailable) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Avisos de Howl',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#6D28D9',
    });
  }

  // Pide permiso la primera vez
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  myToken = token;
  await supabase.rpc('save_push_token', { t: token });
}

// Al cerrar sesión este celular deja de recibir tus avisos
export async function forgetPushToken() {
  if (!myToken) return;
  const token = myToken;
  myToken = null;
  await supabase.rpc('forget_push_token', { t: token });
}

// Abre la pantalla de lo que dice el aviso
function openFromPush(data: Record<string, unknown> | undefined, tries = 0) {
  if (!data) return;
  if (!navigationRef.isReady()) {
    if (tries < 20) setTimeout(() => openFromPush(data, tries + 1), 250);
    return;
  }
  if (data.chat) navigationRef.navigate('ChatRoom');
  else if (typeof data.postId === 'string') navigationRef.navigate('Thread', { postId: data.postId });
}

// Se usa una vez dentro de la app (ya con sesión iniciada)
export function usePushNotifications(userId: string) {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    registerForPush().catch((e) => console.log('No se pudieron activar los avisos:', e?.message ?? e));

    // Tocaste un aviso con la app abierta o en segundo plano
    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      openFromPush(response.notification.request.content.data),
    );

    // La app estaba cerrada y se abrió tocando un aviso
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      Notifications.clearLastNotificationResponse();
      openFromPush(last.notification.request.content.data);
    }

    return () => subscription.remove();
  }, [userId]);
}
