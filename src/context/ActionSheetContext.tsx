import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Menú de opciones que sale desde abajo (como los "..." de Instagram).
// Uso: const showActions = useActionSheet(); showActions({ options: [...] })

type Action = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

type Sheet = { title?: string; options: Action[] };

const ActionSheetContext = createContext<(sheet: Sheet) => void>(() => {});

export function ActionSheetProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((next: Sheet) => {
    setSheet(next);
    setVisible(true);
  }, []);

  // La acción se hace cuando el menú termina de cerrarse (así no chocan dos ventanas)
  const close = (action: Action | null) => {
    setVisible(false);
    if (action) setTimeout(() => action.onPress(), 450);
  };

  return (
    <ActionSheetContext.Provider value={show}>
      {children}
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => close(null)}>
        <Pressable style={styles.backdrop} onPress={() => close(null)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          {sheet?.title ? <Text style={styles.title}>{sheet.title}</Text> : null}
          <View style={styles.group}>
            {sheet?.options.map((option, i) => (
              <Pressable
                key={option.label}
                style={({ pressed }) => [styles.option, i > 0 && styles.divider, pressed && { opacity: 0.5 }]}
                onPress={() => close(option)}
              >
                {option.icon && (
                  <Ionicons name={option.icon} size={22} color={option.destructive ? colors.heart : colors.text} />
                )}
                <Text style={[styles.label, option.destructive && { color: colors.heart }]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </ActionSheetContext.Provider>
  );
}

export function useActionSheet() {
  return useContext(ActionSheetContext);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  title: { textAlign: 'center', fontWeight: '700', color: colors.text, marginBottom: 12 },
  group: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  label: { fontSize: 16, color: colors.text },
});
