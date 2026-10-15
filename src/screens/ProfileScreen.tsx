import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import { usePosts } from '../context/PostsContext';
import { currentUser } from '../data/currentUser';
import { colors } from '../theme';

// Tu perfil con tus publicaciones
export function ProfileScreen() {
  const { posts } = usePosts();
  const myPosts = posts.filter((p) => p.author.name === currentUser.name);
  const likesReceived = myPosts.reduce((sum, p) => sum + p.likes, 0);
  const replies = myPosts.reduce((sum, p) => sum + p.replies.length, 0);

  const header = (
    <View style={styles.header}>
      <Avatar author={currentUser} size={86} />
      <Text style={styles.name}>{currentUser.name}</Text>
      <Text style={styles.career}>{currentUser.career} · UPVT</Text>
      <View style={styles.stats}>
        <Stat value={myPosts.length} label="Publicaciones" />
        <Stat value={likesReceived} label="Me gusta" />
        <Stat value={replies} label="Respuestas" />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={myPosts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Text style={styles.empty}>Aún no publicas nada. Toca el + de abajo para empezar.</Text>
        }
      />
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 8,
    borderBottomColor: colors.surface,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 10 },
  career: { color: colors.muted, marginTop: 2 },
  stats: { flexDirection: 'row', marginTop: 18, paddingHorizontal: 20 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { color: colors.muted, fontSize: 13 },
  empty: { textAlign: 'center', color: colors.muted, padding: 40 },
});
