import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FeedScreen } from './src/screens/FeedScreen';
import { ChatsScreen } from './src/screens/ChatsScreen';
import { colors } from './src/theme';

export default function App() {
  // La app siempre abre en el Feed. Más adelante usaremos Expo Router para la navegación.
  const [screen, setScreen] = useState<'feed' | 'chats'>('feed');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
        {screen === 'feed' ? (
          <FeedScreen onOpenChats={() => setScreen('chats')} />
        ) : (
          <ChatsScreen onBack={() => setScreen('feed')} />
        )}
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
