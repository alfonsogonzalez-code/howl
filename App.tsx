import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostsProvider } from './src/context/PostsContext';
import { RootNavigator } from './src/navigation';
import { colors } from './src/theme';

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

export default function App() {
  // La app siempre abre en la pestaña Inicio (el Feed).
  return (
    <SafeAreaProvider>
      <PostsProvider>
        <NavigationContainer theme={theme}>
          <RootNavigator />
        </NavigationContainer>
      </PostsProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
