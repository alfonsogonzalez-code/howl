import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../components/Avatar';
import { notificationMessage, useNotifications } from '../context/NotificationsContext';
import { usePosts } from '../context/PostsContext';
import { RootScreenProps } from '../navigationTypes';
import { NotificationType } from '../types';
import { colors } from '../theme';
import { timeAgo } from '../utils/time';

// Ícono chiquito sobre la foto de quien hizo algo
const typeIcon: Record<NotificationType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  like: { name: 'heart', color: colors.heart },
  reply: { name: 'chatbubble', color: '#0EA5E9' },
  thread: { name: 'chatbubbles', color: '#0EA5E9' },
  vote: { name: 'stats-chart', color: '#F59E0B' },
  going: { name: 'calendar', color: colors.primary },
};

// Notificaciones, como el corazón de Instagram
export function NotificationsScreen({ navigation }: RootScreenProps<'Notifications'>) {
  const { notifications, loading, refresh, markAllRead } = useNotifications();
  const { posts } = usePosts();
  const [refreshing, setRefreshing] = useState(false);

  // Las que eran nuevas al abrir se quedan resaltadas mientras estás aquí
  const newIds = useRef<Set<string> | null>(null);
  if (newIds.current === null) newIds.current = new Set(notifications.filter((n) => !n.read).map((n) => n.id));

  useFocusEffect(
    useCallback(() => {
      markAllRead();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notifications.length]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const open = (postId: string) => {
    if (posts.some((p) => p.id === postId)) navigation.navigate('Thread', { postId });
    else Alert.alert('Publicación no disponible', 'Puede que ya la hayan borrado.');
  };

  return (
    <FlatList
      style={styles.container}
      data={notifications}
      keyExtractor={(n) => n.id}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator style={{ padding: 40 }} color={colors.primary} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyText}>
              Aquí verás cuando alguien le dé ❤️, responda, vote o asista a lo que publicas.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => {
        const icon = typeIcon[item.type];
        return (
          <Pressable
            style={[styles.row, newIds.current?.has(item.id) && styles.unread]}
            onPress={() => open(item.postId)}
          >
            <View>
              <Avatar author={item.actor} size={46} />
              <View style={[styles.typeIcon, { backgroundColor: icon.color }]}>
                <Ionicons name={icon.name} size={11} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.text} numberOfLines={3}>
                <Text style={styles.bold}>{item.actor.name} </Text>
                {notificationMessage(item)} <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              </Text>
              {!item.postImage && item.postPreview ? (
                <Text style={styles.preview} numberOfLines={1}>
                  {item.postPreview}
                </Text>
              ) : null}
            </View>
            {item.postImage && <Image source={{ uri: item.postImage }} style={styles.thumb} />}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  unread: { backgroundColor: colors.primarySoft + '80' },
  typeIcon: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: colors.text, fontSize: 14, lineHeight: 19 },
  bold: { fontWeight: '700' },
  time: { color: colors.muted },
  preview: { color: colors.muted, fontSize: 13, marginTop: 2 },
  thumb: { width: 46, height: 46, borderRadius: 8, backgroundColor: colors.surface },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
