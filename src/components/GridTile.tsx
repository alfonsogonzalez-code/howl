import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Post } from '../types';
import { postTypeInfo } from '../theme';
import { splitDate } from '../utils/time';

// Cuadrito de la cuadrícula del perfil (3 por fila, como Instagram).
// Las fotos y videos se ven tal cual; lo demás se dibuja con color.
export function GridTile({ post, onPress }: { post: Post; onPress: () => void }) {
  const { width } = useWindowDimensions();
  const size = { width: (width - 2) / 3, height: ((width - 2) / 3) * (4 / 3) };

  return (
    <Pressable onPress={onPress} style={[size, styles.tile]}>
      <TileContent post={post} />
    </Pressable>
  );
}

function TileContent({ post }: { post: Post }) {
  switch (post.type) {
    case 'photo': {
      const video = post.mediaType === 'video';
      return (
        <>
          <Image source={{ uri: video ? post.thumbUrl : post.imageUrl }} style={styles.fill} />
          {video && <Ionicons name="play" size={20} color="#fff" style={styles.corner} />}
        </>
      );
    }
    case 'product':
      return (
        <>
          <Image source={{ uri: post.imageUrl }} style={styles.fill} />
          <View style={styles.price}>
            <Text style={styles.priceText}>${post.price.toLocaleString('es-MX')}</Text>
          </View>
        </>
      );
    case 'text':
      return (
        <ColorTile colors={['#0EA5E9', '#6D28D9']} icon="chatbubble-ellipses">
          <Text style={styles.tileText} numberOfLines={6}>
            {post.text}
          </Text>
        </ColorTile>
      );
    case 'poll':
      return (
        <ColorTile colors={['#F59E0B', '#EC4899']} icon={postTypeInfo.poll.icon}>
          <Text style={styles.tileText} numberOfLines={5}>
            {post.question}
          </Text>
        </ColorTile>
      );
    case 'event': {
      const parts = splitDate(post.date);
      return (
        <ColorTile colors={['#8B5CF6', '#4C1D95']} icon={postTypeInfo.event.icon}>
          {parts && (
            <Text style={styles.eventDate}>
              {parts.day} {parts.month}
            </Text>
          )}
          <Text style={styles.tileText} numberOfLines={4}>
            {post.title}
          </Text>
        </ColorTile>
      );
    }
  }
}

function ColorTile({
  colors,
  icon,
  children,
}: {
  colors: readonly [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.fill, styles.colorTile]}>
      {children}
      <Ionicons name={icon} size={16} color="#fff" style={styles.corner} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: '#EFEFEF', overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  corner: { position: 'absolute', top: 7, right: 7, opacity: 0.95 },
  colorTile: { padding: 10, justifyContent: 'center' },
  tileText: { color: '#fff', fontWeight: '700', fontSize: 13, lineHeight: 17 },
  eventDate: { color: '#fff', fontWeight: '900', fontSize: 20, marginBottom: 4 },
  price: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
