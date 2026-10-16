import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
export function ThreadScreen({ route, navigation }: RootScreenProps<'Thread'>) {
  const { posts, loading, addReply, deleteReply } = usePosts();
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

  if (!post) {
    return loading ? (
      <ActivityIndicator style={{ padding: 40 }} color={colors.primary} />
    ) : (
      <Text style={styles.empty}>Esta publicación ya no existe.</Text>
    );
  }

  const openProfile = (userId: string) => navigation.navigate('Profile', { userId });

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
    <View style={styles.container} ref={keyboard.ref} onLayout={keyboard.onLayout}>
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
                ? 'Aún no hay comentarios. ¡Sé el primero!'
                : `${post.replies.length} ${post.replies.length === 1 ? 'comentario' : 'comentarios'}`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.reply}
            // Deja presionado tu comentario para borrarlo
            onLongPress={
              item.author.id === currentUser.id
                ? () =>
                    Alert.alert('Borrar comentario', '¿Seguro?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Borrar', style: 'destructive', onPress: () => deleteReply(post.id, item.id) },
                    ])
                : undefined
            }
          >
            <Pressable onPress={() => openProfile(item.author.id)}>
              <Avatar author={item.author} size={34} ring={!!item.author.note} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.replyAuthor} onPress={() => openProfile(item.author.id)}>
                {item.author.name} <Text style={styles.replyTime}>{timeAgo(item.createdAt)}</Text>
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
          placeholder={`Agrega un comentario para ${post.author.name.split(' ')[0]}…`}
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />
        <Pressable onPress={send} disabled={!text.trim() || sending} hitSlop={8} style={styles.sendButton}>
          {sending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.sendText, !text.trim() && { opacity: 0.4 }]}>Publicar</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { textAlign: 'center', color: colors.muted, padding: 40 },
  sectionTitle: {
    fontWeight: '600',
    color: colors.muted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  reply: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, marginBottom: 16 },
  replyAuthor: { fontWeight: '700', color: colors.text, fontSize: 13 },
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
  sendButton: { height: 40, justifyContent: 'center', paddingHorizontal: 4 },
  sendText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: colors.text,
  },
});
