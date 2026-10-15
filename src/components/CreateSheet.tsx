import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PostType } from '../types';
import { colors, postTypeInfo } from '../theme';

const types = Object.keys(postTypeInfo) as PostType[];

// Menú que sale desde abajo al tocar el botón +
export function CreateSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: PostType) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>¿Qué quieres publicar?</Text>
        <View style={styles.grid}>
          {types.map((type) => {
            const info = postTypeInfo[type];
            return (
              <Pressable key={type} style={styles.option} onPress={() => onSelect(type)}>
                <View style={[styles.iconCircle, { backgroundColor: info.color }]}>
                  <Ionicons name={info.icon} size={26} color="#fff" />
                </View>
                <Text style={styles.optionLabel}>{info.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  option: { width: '33.33%', alignItems: 'center', gap: 8 },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
});
