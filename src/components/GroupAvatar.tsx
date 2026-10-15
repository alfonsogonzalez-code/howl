import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { careerColor } from '../config';

// Foto del grupo de una carrera: círculo de color con un ícono de personas
export function GroupAvatar({ career, size = 54 }: { career: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: careerColor(career),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="people" size={size * 0.46} color="#fff" />
    </View>
  );
}
