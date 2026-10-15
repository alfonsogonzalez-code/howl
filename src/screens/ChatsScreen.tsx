import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GroupAvatar } from '../components/GroupAvatar';
import { useChat } from '../context/ChatContext';
import { useCurrentUser } from '../context/AuthContext';
import { useRootNavigation } from '../navigationTypes';
import { colors } from '../theme';
import { chatListTime } from '../utils/time';

// Lista de chats, como WhatsApp. Solo aparece el grupo de tu carrera.
export function ChatsScreen() {
  const { career, membership, messages, memberCount, unread, join } = useChat();
  const me = useCurrentUser();
  const navigation = useRootNavigation();
  const [joining, setJoining] = useState(false);

  const joinGroup = async () => {
    setJoining(true);
    try {
      await join();
      navigation.navigate('ChatRoom');
    } catch {
      Alert.alert('No se pudo unir', 'Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setJoining(false);
    }
  };

  const last = messages[messages.length - 1];
  const lastText = last
    ? `${last.author.id === me.id ? 'Tú' : last.author.name.split(' ')[0]}: ${last.text}`
    : 'Aún no hay mensajes. ¡Saluda al grupo! 👋';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Mensajes</Text>

      {membership === undefined ? (
        <ActivityIndicator style={{ padding: 40 }} color={colors.primary} />
      ) : membership === null ? (
        // Todavía no se une: invitación al grupo de su carrera
        <View style={styles.invite}>
          <GroupAvatar career={career} size={96} />
          <Text style={styles.inviteTitle}>Chat de {career}</Text>
          <Text style={styles.inviteText}>
            {memberCount > 0
              ? `${memberCount} ${memberCount === 1 ? 'compañero ya está' : 'compañeros ya están'} aquí.`
              : 'Sé el primero de tu carrera en unirte.'}
            {'\n'}Platica con tu carrera, comparte tareas y avisos.
          </Text>
          <Pressable style={[styles.joinButton, joining && { opacity: 0.6 }]} onPress={joinGroup} disabled={joining}>
            {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.joinText}>Unirme al grupo</Text>}
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable style={styles.row} onPress={() => navigation.navigate('ChatRoom')}>
            <GroupAvatar career={career} />
            <View style={{ flex: 1 }}>
              <View style={styles.rowTop}>
                <Text style={styles.groupName} numberOfLines={1}>
                  {career}
                </Text>
                {last && (
                  <Text style={[styles.time, unread > 0 && { color: colors.primary, fontWeight: '700' }]}>
                    {chatListTime(last.createdAt)}
                  </Text>
                )}
              </View>
              <View style={styles.rowTop}>
                <Text style={[styles.lastMessage, unread > 0 && styles.unreadText]} numberOfLines={1}>
                  {lastText}
                </Text>
                {membership.muted && <Ionicons name="notifications-off" size={15} color={colors.muted} />}
                {unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
          <Text style={styles.hint}>
            <Ionicons name="lock-closed" size={12} color={colors.muted} /> Solo ves el grupo de tu carrera.
          </Text>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupName: { flex: 1, fontWeight: '700', fontSize: 16, color: colors.text },
  lastMessage: { flex: 1, color: colors.muted, marginTop: 3, fontSize: 14 },
  unreadText: { color: colors.text, fontWeight: '600' },
  time: { color: colors.muted, fontSize: 12 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 24 },
  invite: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40, gap: 12 },
  inviteTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 6 },
  inviteText: { color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 10,
    minWidth: 220,
    alignItems: 'center',
  },
  joinText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
