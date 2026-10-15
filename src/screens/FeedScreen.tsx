import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../components/PostCard';
import { Avatar } from '../components/Avatar';
import { usePosts } from '../context/PostsContext';
import { currentUser } from '../data/currentUser';
import { useRootNavigation } from '../navigationTypes';
import { PostType } from '../types';
import { colors, postTypeInfo } from '../theme';

type Filter = 'all' | PostType;

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todo' },
  ...(Object.keys(postTypeInfo) as PostType[]).map((type) => ({
    key: type,
    label: postTypeInfo[type].label + 's',
  })),
];

// Pantalla principal: siempre es lo primero que ves al abrir Howl.
export function FeedScreen() {
  const { posts } = usePosts();
  const navigation = useRootNavigation();
  const [filter, setFilter] = useState<Filter>('all');

  const visiblePosts = filter === 'all' ? posts : posts.filter((p) => p.type === filter);

  const header = (
    <View>
      {/* "¿Qué estás pensando?" como en Facebook */}
      <Pressable style={styles.composer} onPress={() => navigation.navigate('Composer', { type: 'text' })}>
        <Avatar author={currentUser} size={40} />
        <View style={styles.composerInput}>
          <Text style={styles.composerPlaceholder}>¿Qué hay de nuevo en la UPVT?</Text>
        </View>
        <Pressable hitSlop={8} onPress={() => navigation.navigate('Composer', { type: 'photo' })}>
          <Ionicons name="images" size={26} color={postTypeInfo.photo.color} />
        </Pressable>
      </Pressable>

      {/* Filtros para ver solo un tipo de publicación */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>Howl</Text>
        <View style={styles.topIcons}>
          <Ionicons name="search-outline" size={26} color={colors.text} />
          <Ionicons name="notifications-outline" size={26} color={colors.text} />
        </View>
      </View>
      <FlatList
        data={visiblePosts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.empty}>Aún no hay publicaciones de este tipo.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logo: { fontSize: 30, fontWeight: '900', color: colors.primary, letterSpacing: -1 },
  topIcons: { flexDirection: 'row', gap: 18 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  composerPlaceholder: { color: colors.muted, fontSize: 15 },
  filters: { gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.text },
  chipText: { fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.muted, padding: 40 },
});
