import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../components/PostCard';
import { samplePosts } from '../data/posts';
import { colors } from '../theme';

// Pantalla principal: siempre es lo primero que ves al abrir Howl.
export function FeedScreen({ onOpenChats }: { onOpenChats: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>Howl</Text>
        {/* Ícono tipo "avión" de Instagram para ir a los chats por carrera */}
        <Pressable onPress={onOpenChats} hitSlop={10}>
          <Ionicons name="paper-plane-outline" size={26} color={colors.text} />
        </Pressable>
      </View>
      <FlatList
        data={samplePosts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <PostCard post={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: 26, fontWeight: '800', color: colors.primary },
});
