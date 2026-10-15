import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from './screens/FeedScreen';
import { MarketScreen } from './screens/MarketScreen';
import { ChatsScreen } from './screens/ChatsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ThreadScreen } from './screens/ThreadScreen';
import { ComposerScreen } from './screens/ComposerScreen';
import { CreateSheet } from './components/CreateSheet';
import { PostType } from './types';
import { RootStackParamList, TabParamList, useRootNavigation } from './navigationTypes';
import { colors, postTypeInfo } from './theme';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const tabIcons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Inicio: 'home',
  Mercado: 'storefront',
  Crear: 'add',
  Mensajes: 'chatbubbles',
  Perfil: 'person-circle',
};

function Tabs() {
  const navigation = useRootNavigation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const openComposer = (type: PostType) => {
    setSheetOpen(false);
    navigation.navigate('Composer', { type });
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.muted,
          tabBarIcon: ({ color, focused, size }) => {
            const name = tabIcons[route.name];
            // Ícono relleno cuando está activo y de contorno cuando no, como en Instagram
            const icon = (focused ? name : `${name}-outline`) as keyof typeof Ionicons.glyphMap;
            return <Ionicons name={icon} size={size + 2} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={FeedScreen} />
        <Tab.Screen name="Mercado" component={MarketScreen} />
        <Tab.Screen
          name="Crear"
          component={EmptyScreen}
          options={{
            // El botón + no abre una pantalla: despliega el menú de opciones
            tabBarButton: () => (
              <Pressable style={styles.createButtonWrap} onPress={() => setSheetOpen(true)}>
                <View style={styles.createButton}>
                  <Ionicons name="add" size={28} color="#fff" />
                </View>
              </Pressable>
            ),
          }}
        />
        <Tab.Screen name="Mensajes" component={ChatsScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
      </Tab.Navigator>
      <CreateSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onSelect={openComposer} />
    </View>
  );
}

function EmptyScreen() {
  return null;
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text, headerBackTitle: 'Atrás' }}>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Thread" component={ThreadScreen} options={{ title: 'Hilo' }} />
      <Stack.Screen
        name="Composer"
        component={ComposerScreen}
        options={({ route }) => ({
          presentation: 'modal',
          title: `Nuevo: ${postTypeInfo[route.params.type].label}`,
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  createButtonWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  createButton: {
    width: 46,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
