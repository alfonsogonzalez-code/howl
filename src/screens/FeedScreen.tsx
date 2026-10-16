import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { PostCard } from '../components/PostCard';
import { NotesRow } from '../components/NotesRow';
import { usePosts } from '../context/PostsContext';
import { useNotifications } from '../context/NotificationsContext';
import { useChat } from '../context/ChatContext';
import { useRootNavigation } from '../navigationTypes';
import { Post, PostType } from '../types';
import { colors, logoFont, postTypeInfo } from '../theme';

type Filter = 'all' | PostType;

// Las fotos y videos tienen su propia pestaña (Multimedia), así que aquí no hay filtro de fotos
const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todo' },
  ...(['text', 'poll', 'product', 'event'] as const).map((type) => ({ key: type, label: postTypeInfo[type].plural })),
];

// Pantalla principal: siempre es lo primero que ves al abrir Howl.
export function FeedScreen() {
  const { posts, loading, loadError, refresh } = usePosts();
  const { unread } = useNotifications();
  const chat = useChat();
  const navigation = useRootNavigation();
  const focused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Jalar hacia abajo para recargar
  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    await refresh();
    setRefreshing(false);
  };

  // El video que más se ve en pantalla es el que se reproduce
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const video = viewableItems.find(
      (v) => v.isViewable && (v.item as Post).type === 'photo' && (v.item as { mediaType?: string }).mediaType === 'video',
    );
    setActiveId(video ? (video.item as Post).id : null);
  }).current;

  // Mensajes: si aún no estás en el grupo de tu carrera, primero te pregunta
  const openChats = () => {
    navigation.navigate('Chats');
    if (chat.membership === null) {
      Alert.alert(
        'Chat de tu carrera',
        `¿Quieres unirte al chat grupal de ${chat.career}? Recibirás avisos de los mensajes nuevos.`,
        [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Unirme',
            onPress: () =>
              chat
                .join()
                .then(() => navigation.navigate('ChatRoom'))
                .catch(() => Alert.alert('No se pudo unir', 'Revisa tu conexión e inténtalo de nuevo.')),
          },
        ],
      );
    }
  };

  const visiblePosts = filter === 'all' ? posts : posts.filter((p) => p.type === filter);

  const header = (
    <View>
      <NotesRow refreshKey={refreshKey} />

      {/* Filtros para ver solo un tipo de publicación */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, active && styles.chipActive]}>
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
          <Pressable hitSlop={10} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="heart-outline" size={28} color={colors.text} />
            {unread > 0 && <Badge count={unread} />}
          </Pressable>
          <Pressable hitSlop={10} onPress={openChats}>
            <Ionicons name="paper-plane-outline" size={26} color={colors.text} />
            {chat.unread > 0 && <Badge count={chat.unread} />}
          </Pressable>
        </View>
      </View>
      <FlatList
        data={visiblePosts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <PostCard post={item} active={focused && item.id === activeId} />}
        ListHeaderComponent={header}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ padding: 40 }} color={colors.primary} />
          ) : loadError ? (
            <Text style={styles.empty}>
              No se pudieron cargar las publicaciones:{'\n'}
              {loadError}
            </Text>
          ) : (
            <Text style={styles.empty}>
              {filter === 'all'
                ? 'Aún no hay publicaciones. ¡Sé el primero con el botón +!'
                : 'Aún no hay publicaciones de este tipo.'}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 16,
    height: 50,
  },
  logo: { fontFamily: logoFont, fontSize: 38, color: colors.text, marginTop: 4 },
  topIcons: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.heart,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  filters: { gap: 8, paddingHorizontal: 12, paddingBottom: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontWeight: '600', color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.muted, padding: 40 },
});
