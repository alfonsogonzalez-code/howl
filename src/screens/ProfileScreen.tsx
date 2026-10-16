import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../components/Avatar';
import { NoteBubble } from '../components/NoteBubble';
import { GridTile } from '../components/GridTile';
import { PostCard } from '../components/PostCard';
import { usePosts } from '../context/PostsContext';
import { useAuth, useCurrentUser } from '../context/AuthContext';
import { useActionSheet } from '../context/ActionSheetContext';
import { supabase } from '../lib/supabase';
import { toAuthor } from '../lib/profiles';
import { RootScreenProps, useRootNavigation } from '../navigationTypes';
import { Author, Post } from '../types';
import { colors } from '../theme';

type Tab = 'grid' | 'list' | 'saved';

// Perfil de otra persona (se abre al tocar su nombre o su foto)
export function ProfileScreen({ route, navigation }: RootScreenProps<'Profile'>) {
  const me = useCurrentUser();
  const { posts } = usePosts();
  const { userId } = route.params;
  const isMe = userId === me.id;

  // Mientras carga se usa lo que ya sabemos de sus publicaciones
  const known = isMe ? me : posts.find((p) => p.author.id === userId)?.author ?? null;
  const [author, setAuthor] = useState<Author | null>(known);

  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setAuthor(toAuthor(data));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (!isMe) load();
    }, [isMe, load]),
  );

  const shown = isMe ? me : author;

  useLayoutEffect(() => {
    navigation.setOptions({ title: shown?.name ?? '' });
  }, [navigation, shown?.name]);

  if (!shown) return <ActivityIndicator style={{ padding: 40 }} color={colors.primary} />;
  return <ProfileView author={shown} isMe={isMe} />;
}

// Tu perfil, en la pestaña de abajo
export function MyProfileScreen() {
  const me = useCurrentUser();
  const { signOut } = useAuth();
  const navigation = useRootNavigation();

  const showActions = useActionSheet();

  const openMenu = () =>
    showActions({
      options: [
        { label: 'Editar perfil', icon: 'create-outline', onPress: () => navigation.navigate('EditProfile') },
        {
          label: me.note ? 'Cambiar mi nota' : 'Escribir una nota',
          icon: 'chatbubble-outline',
          onPress: () => navigation.navigate('Note'),
        },
        {
          label: 'Cerrar sesión',
          icon: 'log-out-outline',
          destructive: true,
          onPress: () =>
            Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Salir', style: 'destructive', onPress: signOut },
            ]),
        },
      ],
    });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topName} numberOfLines={1}>
          {me.name}
        </Text>
        <Pressable hitSlop={10} onPress={() => navigation.navigate('Composer', { type: 'photo' })}>
          <Ionicons name="add-circle-outline" size={28} color={colors.text} />
        </Pressable>
        <Pressable hitSlop={10} onPress={openMenu}>
          <Ionicons name="menu-outline" size={30} color={colors.text} />
        </Pressable>
      </View>
      <ProfileView author={me} isMe />
    </SafeAreaView>
  );
}

// Lo que se ve en cualquier perfil: foto, nota, números, descripción y publicaciones
function ProfileView({ author, isMe }: { author: Author; isMe: boolean }) {
  const { posts, refresh } = usePosts();
  const navigation = useRootNavigation();
  const [tab, setTab] = useState<Tab>('grid');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isMe && tab === 'saved') setTab('grid');
  }, [isMe, tab]);

  const theirPosts = posts.filter((p) => p.author.id === author.id);
  const savedPosts = posts.filter((p) => p.saved);
  const likes = theirPosts.reduce((sum, p) => sum + p.likes, 0);
  const comments = theirPosts.reduce((sum, p) => sum + p.replies.length, 0);
  const data: Post[] = tab === 'saved' ? savedPosts : theirPosts;
  const asGrid = tab !== 'list';

  const openPost = (post: Post) => navigation.navigate('Thread', { postId: post.id });
  const shareProfile = () =>
    Share.share({ message: `Mira el perfil de ${author.name} (${author.career}) en Howl, la app de la UPVT 🐺` });

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const header = (
    <View>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.avatarWrap}
          disabled={!isMe}
          onPress={() => navigation.navigate('Note')}
        >
          {/* La nota sale arriba de la foto, como en Instagram */}
          {author.note ? (
            <View style={styles.noteSpot}>
              <NoteBubble text={author.note} small />
            </View>
          ) : isMe ? (
            <View style={styles.noteSpot}>
              <NoteBubble text="Nota…" muted small />
            </View>
          ) : null}
          <Avatar author={author} size={86} ring={!!author.note} />
        </Pressable>
        <View style={styles.stats}>
          <Stat value={theirPosts.length} label="publicaciones" />
          <Stat value={likes} label="me gusta" />
          <Stat value={comments} label="comentarios" />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{author.name}</Text>
        <Text style={styles.career}>{author.career} · UPVT</Text>
        {author.bio ? <Text style={styles.bio}>{author.bio}</Text> : null}
      </View>

      <View style={styles.buttons}>
        {isMe && (
          <Pressable style={styles.button} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.buttonText}>Editar perfil</Text>
          </Pressable>
        )}
        <Pressable style={styles.button} onPress={shareProfile}>
          <Text style={styles.buttonText}>Compartir perfil</Text>
        </Pressable>
      </View>

      {/* Pestañas: cuadrícula, lista y guardados */}
      <View style={styles.tabs}>
        <TabIcon icon="grid-outline" active={tab === 'grid'} onPress={() => setTab('grid')} />
        <TabIcon icon="reorder-four-outline" active={tab === 'list'} onPress={() => setTab('list')} />
        {isMe && <TabIcon icon="bookmark-outline" active={tab === 'saved'} onPress={() => setTab('saved')} />}
      </View>
    </View>
  );

  const empty = (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={tab === 'saved' ? 'bookmark-outline' : 'camera-outline'} size={34} color={colors.text} />
      </View>
      <Text style={styles.emptyTitle}>{tab === 'saved' ? 'Guarda lo que te guste' : 'Aún no hay publicaciones'}</Text>
      <Text style={styles.emptyText}>
        {tab === 'saved'
          ? 'Toca el marcador de cualquier publicación para guardarla aquí. Solo tú ves lo que guardas.'
          : isMe
            ? 'Toca el + de abajo para compartir tu primera foto o video.'
            : 'Cuando publique algo, aparecerá aquí.'}
      </Text>
    </View>
  );

  return (
    <FlatList
      key={asGrid ? 'grid' : 'list'}
      style={styles.container}
      data={data}
      keyExtractor={(p) => p.id}
      numColumns={asGrid ? 3 : 1}
      columnWrapperStyle={asGrid ? styles.gridRow : undefined}
      ItemSeparatorComponent={asGrid ? () => <View style={{ height: 1 }} /> : undefined}
      renderItem={({ item }) =>
        asGrid ? <GridTile post={item} onPress={() => openPost(item)} /> : <PostCard post={item} />
      }
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabIcon({
  icon,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? colors.text : colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 16, paddingVertical: 8 },
  topName: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  avatarWrap: { alignItems: 'center', paddingTop: 34 },
  noteSpot: { position: 'absolute', top: 0, zIndex: 2 },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 18 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 13, color: colors.text },
  info: { paddingHorizontal: 16, paddingTop: 10, gap: 2 },
  name: { fontWeight: '700', fontSize: 15, color: colors.text },
  career: { color: colors.muted, fontSize: 14 },
  bio: { color: colors.text, fontSize: 14, lineHeight: 19, marginTop: 2 },
  buttons: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 14 },
  button: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  buttonText: { fontWeight: '700', color: colors.text, fontSize: 14 },
  tabs: {
    flexDirection: 'row',
    marginTop: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.text },
  gridRow: { gap: 1 },
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 40, gap: 10 },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
