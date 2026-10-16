import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Avatar } from '../components/Avatar';
import { DoubleTap } from '../components/DoubleTap';
import { HeartButton, sharePost, usePostMenu } from '../components/PostCard';
import { usePosts } from '../context/PostsContext';
import { useRootNavigation } from '../navigationTypes';
import { PhotoPost } from '../types';
import { colors } from '../theme';
import { timeAgo } from '../utils/time';

// Multimedia: todas las fotos y videos a pantalla completa, uno tras otro
// deslizando hacia arriba, como los Reels de Instagram.
export function MediaScreen() {
  const { posts, loading, refresh } = usePosts();
  const navigation = useRootNavigation();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [height, setHeight] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const media = posts.filter((p): p is PhotoPost => p.type === 'photo');

  // Cuál está en pantalla (ese es el que se reproduce)
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first) setActiveId((first.item as PhotoPost).id);
  }).current;

  useEffect(() => {
    if (!activeId && media.length) setActiveId(media[0].id);
  }, [activeId, media]);

  const onLayout = (e: LayoutChangeEvent) => setHeight(Math.round(e.nativeEvent.layout.height));

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {focused && <StatusBar style="light" />}
      {height > 0 && (
        <FlatList
          data={media}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <MediaPage post={item} height={height} active={focused && item.id === activeId} />
          )}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={[styles.empty, { height }]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="film-outline" size={64} color="#fff" />
                  <Text style={styles.emptyTitle}>Aún no hay fotos ni videos</Text>
                  <Text style={styles.emptyText}>Sube el primero y aparecerá aquí para toda la UPVT.</Text>
                  <Pressable
                    style={styles.emptyButton}
                    onPress={() => navigation.navigate('Composer', { type: 'photo' })}
                  >
                    <Text style={styles.emptyButtonText}>Subir foto o video</Text>
                  </Pressable>
                </>
              )}
            </View>
          }
        />
      )}
      <View style={[styles.topBar, { top: insets.top + 6 }]} pointerEvents="box-none">
        <Text style={styles.title}>Multimedia</Text>
        <Pressable hitSlop={10} onPress={() => navigation.navigate('Composer', { type: 'photo' })}>
          <Ionicons name="camera-outline" size={28} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

// Una foto o video a pantalla completa con sus botones a la derecha
function MediaPage({ post, height, active }: { post: PhotoPost; height: number; active: boolean }) {
  const { toggleLike, toggleSave } = usePosts();
  const navigation = useRootNavigation();
  const openMenu = usePostMenu(post);
  const [expanded, setExpanded] = useState(false);
  const ratio = post.aspectRatio ?? 1;
  // Lo vertical llena la pantalla; lo horizontal se ve completo con negro arriba y abajo
  const fit = ratio < 0.7 ? 'cover' : 'contain';

  const like = () => {
    if (!post.liked) toggleLike(post.id);
  };
  const openProfile = () => navigation.navigate('Profile', { userId: post.author.id });
  const openThread = () => navigation.navigate('Thread', { postId: post.id, focusReply: true });

  return (
    <View style={{ height, backgroundColor: '#000' }}>
      {/* Si la foto no llena la pantalla, atrás se ve ella misma borrosa (se ve mejor que negro) */}
      {fit === 'contain' && (
        <>
          <Image
            source={{ uri: post.thumbUrl ?? post.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={40}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
        </>
      )}
      {post.mediaType === 'video' ? (
        <PageVideo post={post} active={active} fit={fit} onDoubleTap={like} />
      ) : (
        <DoubleTap onDoubleTap={like} style={StyleSheet.absoluteFill} heartSize={120}>
          <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFill} resizeMode={fit} />
        </DoubleTap>
      )}

      {/* Sombra abajo para que se lean las letras */}
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={styles.shade}
      />

      <View style={styles.side}>
        <SideButton count={post.likes}>
          <HeartButton liked={post.liked} onPress={() => toggleLike(post.id)} size={30} color="#fff" />
        </SideButton>
        <SideButton count={post.replies.length} onPress={openThread}>
          <Ionicons name="chatbubble-outline" size={28} color="#fff" style={styles.flip} />
        </SideButton>
        <SideButton onPress={() => sharePost(post)}>
          <Ionicons name="paper-plane-outline" size={27} color="#fff" />
        </SideButton>
        <SideButton onPress={() => toggleSave(post.id)}>
          <Ionicons name={post.saved ? 'bookmark' : 'bookmark-outline'} size={27} color="#fff" />
        </SideButton>
        <SideButton onPress={openMenu}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </SideButton>
      </View>

      <View style={styles.info} pointerEvents="box-none">
        <Pressable style={styles.authorRow} onPress={openProfile}>
          <Avatar author={post.author} size={34} />
          <Text style={styles.author}>{post.author.name}</Text>
          <Text style={styles.time}>· {timeAgo(post.createdAt)}</Text>
        </Pressable>
        {post.caption ? (
          <Pressable onPress={() => setExpanded(!expanded)}>
            <Text style={styles.caption} numberOfLines={expanded ? 8 : 2}>
              {post.caption}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// Video a pantalla completa: se reproduce con sonido; un toque lo pausa
function PageVideo({
  post,
  active,
  fit,
  onDoubleTap,
}: {
  post: PhotoPost;
  active: boolean;
  fit: 'cover' | 'contain';
  onDoubleTap: () => void;
}) {
  const [paused, setPaused] = useState(false);
  const player = useVideoPlayer(post.imageUrl, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    if (active && !paused) player.play();
    else player.pause();
  }, [active, paused, player]);

  // Al salir de la pantalla y volver, empieza reproduciéndose otra vez
  useEffect(() => {
    if (!active) setPaused(false);
  }, [active]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  return (
    <DoubleTap onDoubleTap={onDoubleTap} onSingleTap={togglePause} style={StyleSheet.absoluteFill} heartSize={120}>
      {post.thumbUrl && fit === 'cover' && (
        <Image source={{ uri: post.thumbUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit={fit} nativeControls={false} />
      {paused && (
        <View style={styles.pauseIcon} pointerEvents="none">
          <Ionicons name="play" size={44} color="#fff" />
        </View>
      )}
    </DoubleTap>
  );
}

function SideButton({ children, count, onPress }: { children: React.ReactNode; count?: number; onPress?: () => void }) {
  return (
    <Pressable style={styles.sideButton} onPress={onPress} disabled={!onPress} hitSlop={6}>
      {children}
      {count !== undefined && <Text style={styles.sideCount}>{count}</Text>}
    </Pressable>
  );
}

const textShadow = { textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', ...textShadow },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 220 },
  side: { position: 'absolute', right: 10, bottom: 24, alignItems: 'center', gap: 18 },
  sideButton: { alignItems: 'center', gap: 3 },
  sideCount: { color: '#fff', fontSize: 13, fontWeight: '600', ...textShadow },
  flip: { transform: [{ scaleX: -1 }] },
  info: { position: 'absolute', left: 14, right: 72, bottom: 24, gap: 8 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  author: { color: '#fff', fontWeight: '700', fontSize: 15, ...textShadow },
  time: { color: 'rgba(255,255,255,0.8)', fontSize: 13, ...textShadow },
  caption: { color: '#fff', fontSize: 14, lineHeight: 19, ...textShadow },
  pauseIcon: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 5,
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20 },
  emptyButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700' },
});
