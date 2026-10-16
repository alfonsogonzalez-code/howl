import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../components/Avatar';
import { GroupAvatar } from '../components/GroupAvatar';
import { useChat } from '../context/ChatContext';
import { useCurrentUser } from '../context/AuthContext';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { RootScreenProps } from '../navigationTypes';
import { ChatMessage } from '../types';
import { colors } from '../theme';
import { clockTime, dayLabel } from '../utils/time';

const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();

// Conversación del grupo de tu carrera, estilo WhatsApp / Instagram
export function ChatRoomScreen({ navigation }: RootScreenProps<'ChatRoom'>) {
  const { career, membership, messages, memberCount, send, deleteMessage, markRead, setMuted, leave } = useChat();
  const me = useCurrentUser();
  const keyboard = useKeyboardInset();
  const [text, setText] = useState('');

  // Si sales del grupo, regresa a la lista
  useEffect(() => {
    if (membership === null) navigation.goBack();
  }, [membership, navigation]);

  // Al ver el chat, todo queda como leído
  useFocusEffect(
    useCallback(() => {
      markRead();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length]),
  );

  const openOptions = useCallback(() => {
    const muted = membership?.muted ?? false;
    Alert.alert(career, `${memberCount} ${memberCount === 1 ? 'miembro' : 'miembros'}`, [
      {
        text: muted ? 'Activar avisos del grupo' : 'Silenciar avisos del grupo',
        onPress: () => setMuted(!muted),
      },
      {
        text: 'Salir del grupo',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Salir del grupo', 'Dejarás de ver los mensajes. Puedes volver a unirte cuando quieras.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', style: 'destructive', onPress: () => leave() },
          ]),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [career, memberCount, membership?.muted, setMuted, leave]);

  // Encabezado con la foto y el nombre del grupo
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Pressable style={styles.headerTitle} onPress={openOptions}>
          <GroupAvatar career={career} size={34} />
          <View>
            <Text style={styles.headerName} numberOfLines={1}>
              {career}
            </Text>
            <Text style={styles.headerSub}>
              {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
              {membership?.muted ? ' · silenciado' : ''}
            </Text>
          </View>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={openOptions} hitSlop={10}>
          <Ionicons name="ellipsis-horizontal-circle-outline" size={26} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, career, memberCount, membership?.muted, openOptions]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    send(value).catch(() => {
      setText(value);
      Alert.alert('No se pudo enviar', 'Revisa tu conexión e inténtalo de nuevo.');
    });
  };

  const confirmDelete = (message: ChatMessage) =>
    Alert.alert('Borrar mensaje', 'Se borrará para todos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => deleteMessage(message.id) },
    ]);

  // La lista va "volteada": el mensaje más nuevo queda abajo, junto a la barra de escribir
  const newestFirst = [...messages].reverse();

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const older = newestFirst[index + 1];
    const newer = newestFirst[index - 1];
    const mine = item.author.id === me.id;
    const newDay = !older || !sameDay(older.createdAt, item.createdAt);
    // Mensajes seguidos de la misma persona se agrupan
    const firstOfGroup = newDay || older.author.id !== item.author.id;
    const lastOfGroup = !newer || newer.author.id !== item.author.id || !sameDay(newer.createdAt, item.createdAt);

    return (
      <View>
        {newDay && (
          <View style={styles.dayChip}>
            <Text style={styles.dayText}>{dayLabel(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, mine && styles.mineRow, { marginTop: firstOfGroup ? 10 : 2 }]}>
          {!mine && (
            <Pressable
              style={styles.avatarSlot}
              disabled={!lastOfGroup}
              onPress={() => navigation.navigate('Profile', { userId: item.author.id })}
            >
              {lastOfGroup && <Avatar author={item.author} size={28} />}
            </Pressable>
          )}
          <Pressable
            onLongPress={mine && !item.pending ? () => confirmDelete(item) : undefined}
            style={[
              styles.bubble,
              mine ? styles.mineBubble : styles.otherBubble,
              mine && !lastOfGroup && { borderBottomRightRadius: 6 },
              mine && !firstOfGroup && { borderTopRightRadius: 6 },
              !mine && !lastOfGroup && { borderBottomLeftRadius: 6 },
              !mine && !firstOfGroup && { borderTopLeftRadius: 6 },
            ]}
          >
            {!mine && firstOfGroup && (
              <Text style={[styles.author, { color: item.author.avatarColor }]}>{item.author.name}</Text>
            )}
            <Text style={[styles.messageText, mine && { color: '#fff' }]}>
              {item.text}
              {/* Espacio para que la hora no se encime con el texto */}
              <Text style={styles.timeSpacer}>{'   ' + clockTime(item.createdAt) + (mine ? '      ' : ' ')}</Text>
            </Text>
            <View style={styles.timeWrap}>
              <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.75)' }]}>
                {clockTime(item.createdAt)}
              </Text>
              {mine && (
                <Ionicons
                  name={item.pending ? 'time-outline' : 'checkmark-done'}
                  size={13}
                  color="rgba(255,255,255,0.85)"
                />
              )}
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} ref={keyboard.ref} onLayout={keyboard.onLayout}>
      {messages.length === 0 ? (
        <View style={styles.empty}>
          <GroupAvatar career={career} size={80} />
          <Text style={styles.emptyTitle}>{career}</Text>
          <Text style={styles.emptyText}>Aún no hay mensajes. ¡Saluda a tu carrera! 👋</Text>
        </View>
      ) : (
        <FlatList
          inverted
          data={newestFirst}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />
      )}

      <View
        style={[
          styles.inputBar,
          { paddingBottom: keyboard.keyboardOpen ? keyboard.bottom + 8 : Math.max(keyboard.bottom, 10) },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Mensaje…"
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
          maxLength={2000}
        />
        <Pressable
          onPress={submit}
          disabled={!text.trim()}
          style={[styles.sendButton, !text.trim() && { backgroundColor: colors.border }]}
          hitSlop={6}
        >
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 240 },
  headerName: { fontWeight: '700', fontSize: 16, color: colors.text },
  headerSub: { color: colors.muted, fontSize: 12 },
  list: { paddingHorizontal: 12, paddingVertical: 10 },
  dayChip: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 14,
    marginBottom: 4,
  },
  dayText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  mineRow: { justifyContent: 'flex-end' },
  avatarSlot: { width: 28 },
  bubble: { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 8 },
  mineBubble: { backgroundColor: colors.primary },
  otherBubble: { backgroundColor: colors.surface },
  author: { fontWeight: '700', fontSize: 13, marginBottom: 2 },
  messageText: { fontSize: 16, lineHeight: 21, color: colors.text },
  timeSpacer: { fontSize: 11, color: 'transparent' },
  timeWrap: { position: 'absolute', right: 10, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  time: { fontSize: 11, color: colors.muted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 15 },
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
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
