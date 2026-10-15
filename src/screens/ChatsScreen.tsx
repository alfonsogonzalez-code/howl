import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Grupos por carrera. En el paso 5 cada grupo tendrá su chat en tiempo real.
const careerGroups = [
  { id: 'sw', name: 'Ing. en Software', lastMessage: 'Ana: Mañana entregamos el proyecto', time: '9:41', unread: 3, color: '#8B5CF6' },
  { id: 'meca', name: 'Mecatrónica', lastMessage: 'Luis: ¿Quién tiene el manual del PLC?', time: '9:12', unread: 0, color: '#0EA5E9' },
  { id: 'admin', name: 'Administración', lastMessage: 'Sofía: Junta a las 12 en el aula 4', time: 'Ayer', unread: 1, color: '#F97316' },
  { id: 'bio', name: 'Biotecnología', lastMessage: 'Diego: Ya subieron las calificaciones', time: 'Ayer', unread: 0, color: '#14B8A6' },
  { id: 'upvt', name: 'Avisos UPVT', lastMessage: 'Consejo: Feria de proyectos el viernes', time: 'Lun', unread: 0, color: '#16A34A' },
];

export function ChatsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Mensajes</Text>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput placeholder="Buscar grupo" placeholderTextColor={colors.muted} style={{ flex: 1 }} />
      </View>
      <FlatList
        data={careerGroups}
        keyExtractor={(group) => group.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.group}
            onPress={() => Alert.alert(item.name, 'Los chats por carrera llegan en el paso 5 😉')}
          >
            <View style={[styles.groupIcon, { backgroundColor: item.color }]}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text
                style={[styles.lastMessage, item.unread > 0 && styles.unreadText]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.time}>{item.time}</Text>
              {item.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, paddingHorizontal: 16, paddingTop: 8 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  group: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  groupIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  groupName: { fontWeight: '700', fontSize: 16, color: colors.text },
  lastMessage: { color: colors.muted, marginTop: 2 },
  unreadText: { color: colors.text, fontWeight: '600' },
  time: { color: colors.muted, fontSize: 12 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
