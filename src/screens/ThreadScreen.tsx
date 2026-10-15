import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../components/PostCard';
import { Avatar } from '../components/Avatar';
import { usePosts } from '../context/PostsContext';
import { useCurrentUser } from '../context/AuthContext';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { RootScreenProps } from '../navigationTypes';
import { colors } from '../theme';
import { timeAgo } from '../utils/time';

// Hilo de una publicación: la publicación arriba y todas sus respuestas abajo.
// Como no hay chats personales, aquí es donde se platica sobre cada publicación.
export function ThreadScreen({ route }: RootScreenProps<'Thread'>) {
  const { posts, addReply, deleteReply } = usePosts();
  const currentUser = useCurrentUser();
  const [sending, setSending] = useState(false);
  const post = posts.find((p) => p.id === route.params.postId);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const keyboard = useKeyboardInset();

  useEffect(() => {
    if (route.params.focusReply) setTimeout(() => inputRef.current?.focus(), 400);
  }, [route.params.focusReply]);

  if (!post) return <Text style={styles.empty}>Esta publicación ya no existe.</Text>;

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addReply(post.id, text.trim());
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('No se pudo enviar', 'Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container} onLayout={keyboard.onLayout}>
      <FlatList
        ref={listRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
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
          <Pressable
            style={styles.reply}
            // Deja presionada tu respuesta para borrarla
            onLongPress={
              item.author.id === currentUser.id
                ? () =>
                    Alert.alert('Borrar respuesta', '¿Seguro?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Borrar', style: 'destructive', onPress: () => deleteReply(post.id, item.id) },
                    ])
                : undefined
            }
          >
            <Avatar author={item.author} size={34} />
            <View style={styles.bubble}>
              <Text style={styles.replyAuthor}>
                {item.author.name} <Text style={styles.replyTime}>· {timeAgo(item.createdAt)}</Text>
              </Text>
              <Text style={styles.replyText}>{item.text}</Text>
            </View>
          </Pressable>
        )}
      />
      <View
        style={[
          styles.inputBar,
          { paddingBottom: keyboard.keyboardOpen ? keyboard.bottom + 8 : Math.max(keyboard.bottom, 10) },
        ]}
      >
        <View style={{ paddingBottom: 3 }}>
          <Avatar author={currentUser} size={34} />
        </View>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={`Responder a ${post.author.name}…`}
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={send}
          disabled={!text.trim() || sending}
          hitSlop={6}
          style={[styles.sendButton, (!text.trim() || sending) && { backgroundColor: colors.border }]}
        >
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
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
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: colors.text,
  },
});
