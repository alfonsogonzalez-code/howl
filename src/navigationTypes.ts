import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationProp, NavigatorScreenParams, useNavigation } from '@react-navigation/native';
import { PostType } from './types';

// Pestañas de la barra de abajo
export type TabParamList = {
  Inicio: undefined;
  Mercado: undefined;
  Crear: undefined;
  Mensajes: undefined;
  Perfil: undefined;
};

// Pantallas que se abren encima de las pestañas
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Thread: { postId: string; focusReply?: boolean };
  Composer: { type: PostType };
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export function useRootNavigation() {
  return useNavigation<NavigationProp<RootStackParamList>>();
}
