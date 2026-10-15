import { StyleSheet, Text, View } from 'react-native';
import { Author } from '../types';

// Círculo de color con la inicial del nombre
export function Avatar({ author, size = 38 }: { author: Author; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: author.avatarColor },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{author.name[0]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '700' },
});
