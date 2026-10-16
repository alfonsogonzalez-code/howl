import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from './screens/FeedScreen';
import { MediaScreen } from './screens/MediaScreen';
import { MarketScreen } from './screens/MarketScreen';
import { ChatsScreen } from './screens/ChatsScreen';
import { ProfileScreen, MyProfileScreen } from './screens/ProfileScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { NoteScreen } from './screens/NoteScreen';
import { ThreadScreen } from './screens/ThreadScreen';
import { ComposerScreen } from './screens/ComposerScreen';
import { ChatRoomScreen } from './screens/ChatRoomScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { useCurrentUser } from './context/AuthContext';
import { CreateSheet } from './components/CreateSheet';
import { Avatar } from './components/Avatar';
import { PostType } from './types';
import { RootStackParamList, TabParamList, useRootNavigation } from './navigationTypes';
import { colors, postTypeInfo } from './theme';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Íconos de la barra de abajo: relleno cuando está activo y de contorno cuando no, como en Instagram
const tabIcons: Partial<Record<keyof TabParamList, keyof typeof Ionicons.glyphMap>> = {
  Inicio: 'home',
  Multimedia: 'film',
  Mercado: 'storefront',
};

function Tabs() {
  const navigation = useRootNavigation();
  const me = useCurrentUser();
  const [sheetOpen, setSheetOpen] = useState(false);
  // En Multimedia la barra se pone negra, como en los Reels
  const [activeTab, setActiveTab] = useState<keyof TabParamList>('Inicio');
  const dark = activeTab === 'Multimedia';
  const tint = dark ? '#fff' : colors.text;

  // Tipo elegido en el menú; se abre el formulario cuando el menú termina de cerrarse
  const [pendingType, setPendingType] = useState<PostType | null>(null);

  const chooseType = (type: PostType) => {
    setPendingType(type);
    setSheetOpen(false);
    if (Platform.OS !== 'ios') openComposer(type); // en Android no hay onDismiss
  };

  const openComposer = (type: PostType | null) => {
    if (!type) return;
    setPendingType(null);
    navigation.navigate('Composer', { type });
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenListeners={({ route }) => ({ focus: () => setActiveTab(route.name) })}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: tint,
          tabBarInactiveTintColor: tint,
          tabBarStyle: [styles.tabBar, dark && styles.tabBarDark],
          tabBarIcon: ({ color, focused }) => {
            const name = tabIcons[route.name];
            if (!name) return null;
            const icon = (focused ? name : `${name}-outline`) as keyof typeof Ionicons.glyphMap;
            return <Ionicons name={icon} size={26} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={FeedScreen} />
        <Tab.Screen name="Multimedia" component={MediaScreen} />
        <Tab.Screen
          name="Crear"
          component={EmptyScreen}
          options={{
            // El botón + no abre una pantalla: despliega el menú de opciones
            tabBarButton: () => (
              <Pressable style={styles.createButton} onPress={() => setSheetOpen(true)}>
                <MaterialCommunityIcons name="plus-box-outline" size={29} color={tint} />
              </Pressable>
            ),
          }}
        />
        <Tab.Screen name="Mercado" component={MarketScreen} />
        <Tab.Screen
          name="Perfil"
          component={MyProfileScreen}
          options={{
            // Tu foto de perfil como ícono, con un aro negro cuando estás ahí
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.profileIcon, { borderColor: focused ? color : 'transparent' }]}>
                <Avatar author={me} size={26} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
      <CreateSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={chooseType}
        onDismiss={() => openComposer(pendingType)}
      />
    </View>
  );
}

function EmptyScreen() {
  return null;
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Thread" component={ThreadScreen} options={{ title: 'Comentarios' }} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: '' }} />
      <Stack.Screen name="Chats" component={ChatsScreen} options={{ title: 'Mensajes' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '' }} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Editar perfil', presentation: 'modal', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Note"
        component={NoteScreen}
        options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
      />
      <Stack.Screen
        name="Composer"
        component={ComposerScreen}
        options={({ route }) => ({
          presentation: 'modal',
          title: route.params.type === 'photo' ? 'Nueva publicación' : `Nuevo: ${postTypeInfo[route.params.type].label}`,
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.background },
  tabBarDark: { backgroundColor: '#000', borderTopColor: '#262626' },
  createButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileIcon: { borderWidth: 1.5, borderRadius: 16, padding: 1.5 },
});
