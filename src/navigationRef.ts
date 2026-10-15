import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './navigationTypes';

// Permite navegar desde fuera de las pantallas (por ejemplo, al tocar un aviso)
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
