import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationProp, NavigatorScreenParams, useNavigation } from '@react-navigation/native';
import { PostType } from './types';

// Pestañas de la barra de abajo
export type TabParamList = {
  Inicio: undefined;
  Multimedia: undefined;
  Crear: undefined;
  Mercado: undefined;
  Perfil: undefined;
};

// Pantallas que se abren encima de las pestañas
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Thread: { postId: string; focusReply?: boolean };
  Composer: { type: PostType };
  ChatRoom: undefined;
  Chats: undefined;
  Notifications: undefined;
  Profile: { userId: string };
  EditProfile: undefined;
  Note: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export function useRootNavigation() {
  return useNavigation<NavigationProp<RootStackParamList>>();
}
