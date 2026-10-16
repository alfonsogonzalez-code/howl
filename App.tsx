import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, GrandHotel_400Regular } from '@expo-google-fonts/grand-hotel';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PostsProvider } from './src/context/PostsContext';
import { BannerProvider } from './src/context/BannerContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { ChatProvider } from './src/context/ChatContext';
import { ActionSheetProvider } from './src/context/ActionSheetContext';
import { usePushNotifications } from './src/lib/push';
import { navigationRef } from './src/navigationRef';
import { RootNavigator } from './src/navigation';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { colors } from './src/theme';

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

export default function App() {
  // Letra del logo "Howl" (como la de Instagram)
  const [fontsLoaded, fontError] = useFonts({ GrandHotel_400Regular });
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

// Decide qué mostrar: cargando, inicio de sesión, registro de perfil o la app
function Gate() {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!session) return <LoginScreen />;
  if (!profile) return <ProfileSetupScreen />;

  // La app siempre abre en la pestaña Inicio (el Feed)
  return (
    <PostsProvider>
      <NavigationContainer theme={theme} ref={navigationRef}>
        <ActionSheetProvider>
          <BannerProvider>
            <NotificationsProvider>
              <ChatProvider>
                <PushNotifications userId={profile.id} />
                <RootNavigator />
              </ChatProvider>
            </NotificationsProvider>
          </BannerProvider>
        </ActionSheetProvider>
      </NavigationContainer>
    </PostsProvider>
  );
}

// Registra el celular para recibir avisos y abre lo que digan al tocarlos
function PushNotifications({ userId }: { userId: string }) {
  usePushNotifications(userId);
  return null;
}
