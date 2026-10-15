import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PostsProvider } from './src/context/PostsContext';
import { BannerProvider } from './src/context/BannerContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { ChatProvider } from './src/context/ChatContext';
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
        <BannerProvider>
          <NotificationsProvider>
            <ChatProvider>
              <RootNavigator />
            </ChatProvider>
          </NotificationsProvider>
        </BannerProvider>
      </NavigationContainer>
    </PostsProvider>
  );
}
