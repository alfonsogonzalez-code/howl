import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Author } from '../types';
import { colors, gradient } from '../theme';

type Props = {
  author: Pick<Author, 'name' | 'avatarColor' | 'avatarUrl'>;
  size?: number;
  // Aro de colores alrededor, como cuando alguien tiene historia en Instagram
  ring?: boolean;
};

// Foto de perfil. Si no hay foto, círculo de color con la inicial del nombre.
export function Avatar({ author, size = 38, ring = false }: Props) {
  const circle = { width: size, height: size, borderRadius: size / 2 };
  const picture = author.avatarUrl ? (
    <Image source={{ uri: author.avatarUrl }} style={[circle, styles.photo]} />
  ) : (
    <View style={[circle, styles.avatar, { backgroundColor: author.avatarColor }]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{author.name[0]?.toUpperCase()}</Text>
    </View>
  );

  if (!ring) return picture;

  // El aro: degradado, una rayita blanca y la foto adentro
  const gap = Math.max(2, Math.round(size * 0.045));
  const outer = size + gap * 4;
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{ width: outer, height: outer, borderRadius: outer / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: size + gap * 2,
          height: size + gap * 2,
          borderRadius: (size + gap * 2) / 2,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {picture}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  photo: { backgroundColor: colors.surface },
  initial: { color: '#fff', fontWeight: '700' },
});
