import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// Globito de la nota que sale arriba de la foto de perfil
export function NoteBubble({ text, muted = false, small = false }: { text: string; muted?: boolean; small?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.bubble, small && styles.small]}>
        <Text style={[styles.text, small && styles.smallText, muted && { color: colors.muted }]} numberOfLines={small ? 2 : 3}>
          {text}
        </Text>
      </View>
      {/* Las bolitas de "pensamiento" debajo del globo */}
      <View style={[styles.dot, styles.dotBig]} />
      <View style={[styles.dot, styles.dotSmall]} />
    </View>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.12,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 2 },
  bubble: {
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: 180,
    ...shadow,
  },
  small: { maxWidth: 88, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 13 },
  text: { fontSize: 13, color: colors.text, textAlign: 'center' },
  smallText: { fontSize: 11 },
  dot: { backgroundColor: colors.background, borderRadius: 10, ...shadow, alignSelf: 'center' },
  dotBig: { width: 8, height: 8, marginTop: 2, marginRight: 14 },
  dotSmall: { width: 4, height: 4, marginTop: 1, marginRight: 20 },
});
