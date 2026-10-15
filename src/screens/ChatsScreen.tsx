import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Lista de grupos por carrera. En el paso 5 cada grupo tendrá su chat real.
const careerGroups = [
  { id: 'sw', name: 'Ing. en Software', lastMessage: 'Mañana entregamos el proyecto' },
  { id: 'meca', name: 'Mecatrónica', lastMessage: '¿Quién tiene el manual del PLC?' },
  { id: 'admin', name: 'Administración', lastMessage: 'Junta a las 12 en el aula 4' },
  { id: 'bio', name: 'Biotecnología', lastMessage: 'Ya subieron las calificaciones' },
];

export function ChatsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Grupos por carrera</Text>
      </View>
      <FlatList
        data={careerGroups}
        keyExtractor={(group) => group.id}
        renderItem={({ item }) => (
          <View style={styles.group}>
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  group: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { fontWeight: '700', fontSize: 16, color: colors.text },
  lastMessage: { color: colors.muted },
});
