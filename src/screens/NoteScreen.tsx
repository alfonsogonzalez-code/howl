import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth, useCurrentUser } from '../context/AuthContext';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { colors } from '../theme';
import { Avatar } from '../components/Avatar';
import { NoteBubble } from '../components/NoteBubble';
import { RootScreenProps } from '../navigationTypes';

const MAX_NOTE = 60;

// Ventanita para escribir tu nota (como las notas de Instagram). Dura 24 horas.
export function NoteScreen({ navigation }: RootScreenProps<'Note'>) {
  const onClose = () => navigation.goBack();
  const me = useCurrentUser();
  const { setNote } = useAuth();
  const [text, setText] = useState(me.note ?? '');
  const [busy, setBusy] = useState(false);
  const keyboard = useKeyboardInset();

  const save = async (value: string | null) => {
    setBusy(true);
    try {
      await setNote(value);
      onClose();
    } catch (e) {
      Alert.alert('No se pudo guardar la nota', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.backdrop} ref={keyboard.ref} onLayout={keyboard.onLayout}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: keyboard.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Tu nota</Text>
          <View style={styles.preview}>
            <NoteBubble text={text.trim() || 'Comparte lo que piensas…'} muted={!text.trim()} />
            <Avatar author={me} size={84} />
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="¿Qué andas pensando?"
            placeholderTextColor={colors.muted}
            style={styles.input}
            maxLength={MAX_NOTE}
            autoFocus
          />
          <Text style={styles.help}>
            {text.length}/{MAX_NOTE} · La verán todos en Howl durante 24 horas.
          </Text>
          <Pressable
            style={[styles.button, (!text.trim() || busy) && { opacity: 0.5 }]}
            disabled={!text.trim() || busy}
            onPress={() => save(text)}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Compartir</Text>}
          </Pressable>
          {me.note && !busy && (
            <Pressable style={styles.delete} onPress={() => save(null)}>
              <Text style={styles.deleteText}>Borrar nota</Text>
            </Pressable>
          )}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontWeight: '700', fontSize: 16, textAlign: 'center', color: colors.text },
  preview: { alignItems: 'center', paddingTop: 8, gap: 4 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  help: { color: colors.muted, fontSize: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  delete: { alignItems: 'center', paddingVertical: 4 },
  deleteText: { color: colors.heart, fontWeight: '600' },
});
