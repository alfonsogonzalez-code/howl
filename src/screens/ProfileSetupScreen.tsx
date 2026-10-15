import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { CAREERS } from '../config';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { colors } from '../theme';

// Primera vez que entras: tu nombre y tu carrera
export function ProfileSetupScreen() {
  const { saveProfile, signOut } = useAuth();
  const [name, setName] = useState('');
  const [career, setCareer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const keyboard = useKeyboardInset();

  const save = async () => {
    if (name.trim().length < 2) return Alert.alert('Falta tu nombre', 'Escribe tu nombre y apellido.');
    if (!career) return Alert.alert('Falta tu carrera', 'Elige tu carrera de la lista.');
    setBusy(true);
    try {
      await saveProfile(name, career);
    } catch (e) {
      Alert.alert('No se pudo guardar', (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={keyboard.onLayout}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: keyboard.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>¡Bienvenido a Howl! 🐺</Text>
        <Text style={styles.subtitle}>Cuéntanos quién eres.</Text>

        <Text style={styles.label}>Nombre y apellido</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej. Alfonso Gonzalez"
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCapitalize="words"
          maxLength={60}
        />

        <Text style={styles.label}>Tu carrera</Text>
        <View style={styles.careers}>
          {CAREERS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCareer(c)}
              style={[styles.chip, career === c && styles.chipActive]}
            >
              <Text style={[styles.chipText, career === c && { color: '#fff' }]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar a Howl</Text>}
        </Pressable>
        <Pressable onPress={signOut} style={{ alignSelf: 'center', padding: 8 }}>
          <Text style={{ color: colors.muted }}>Salir</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '900', color: colors.text, marginTop: 20 },
  subtitle: { color: colors.muted, fontSize: 16, marginBottom: 16 },
  label: { fontWeight: '700', color: colors.text, marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  careers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontWeight: '600', color: colors.text },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
