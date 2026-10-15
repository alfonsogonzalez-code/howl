import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../components/PostCard';
import { Avatar } from '../components/Avatar';
import { usePosts } from '../context/PostsContext';
import { currentUser } from '../data/currentUser';
import { RootScreenProps } from '../navigationTypes';
import { colors } from '../theme';
import { timeAgo } from '../utils/time';

// Hilo de una publicación: la publicación arriba y todas sus respuestas abajo.
// Como no hay chats personales, aquí es donde se platica sobre cada publicación.
export function ThreadScreen({ route }: RootScreenProps<'Thread'>) {
  const { posts, addReply } = usePosts();
  const post = posts.find((p) => p.id === route.params.postId);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (route.params.focusReply) setTimeout(() => inputRef.current?.focus(), 400);
  }, [route.params.focusReply]);

  if (!post) return <Text style={styles.empty}>Esta publicación ya no existe.</Text>;

  const send = () => {
    if (!text.trim()) return;
    addReply(post.id, text.trim());
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <FlatList
        ref={listRef}
        data={post.replies}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={
          <View>
            <PostCard post={post} inThread onReplyPress={() => inputRef.current?.focus()} />
            <Text style={styles.sectionTitle}>
              {post.replies.length === 0
                ? 'Sé el primero en responder'
                : `${post.replies.length} ${post.replies.length === 1 ? 'respuesta' : 'respuestas'}`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reply}>
            <Avatar author={item.author} size={34} />
            <View style={styles.bubble}>
              <Text style={styles.replyAuthor}>
                {item.author.name} <Text style={styles.replyTime}>· {timeAgo(item.createdAt)}</Text>
              </Text>
              <Text style={styles.replyText}>{item.text}</Text>
            </View>
          </View>
        )}
      />
      <SafeAreaView edges={['bottom']} style={styles.inputBar}>
        <Avatar author={currentUser} size={34} />
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={`Responder a ${post.author.name}…`}
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />
        <Pressable onPress={send} disabled={!text.trim()} hitSlop={8}>
          <Ionicons name="send" size={24} color={text.trim() ? colors.primary : colors.border} />
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { textAlign: 'center', color: colors.muted, padding: 40 },
  sectionTitle: { fontWeight: '700', color: colors.text, paddingHorizontal: 14, paddingVertical: 12 },
  reply: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginBottom: 12 },
  bubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyAuthor: { fontWeight: '700', color: colors.text },
  replyTime: { fontWeight: '400', color: colors.muted, fontSize: 12 },
  replyText: { color: colors.text, fontSize: 15, marginTop: 2 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: 15,
    color: colors.text,
  },
});
