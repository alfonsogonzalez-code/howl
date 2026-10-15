import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../config';
import { colors } from '../theme';

// Entrar o crear cuenta con correo y contraseña
export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const keyboard = useKeyboardInset();

  const submit = async () => {
    if (!isValidEmail(email)) return Alert.alert('Correo no válido', 'Revisa que tu correo esté bien escrito.');
    if (password.length < 6) return Alert.alert('Contraseña muy corta', 'Usa al menos 6 caracteres.');
    setBusy(true);
    try {
      if (mode === 'login') await signIn(email, password);
      else await signUp(email, password);
      // Al entrar, la app cambia sola a la siguiente pantalla
    } catch (e) {
      const message = (e as Error).message;
      Alert.alert(
        mode === 'login' ? 'No se pudo entrar' : 'No se pudo crear la cuenta',
        message.includes('Invalid login credentials')
          ? 'Correo o contraseña incorrectos.'
          : message.includes('already registered')
            ? 'Ese correo ya tiene cuenta. Toca "Ya tengo cuenta" para entrar.'
            : message,
      );
      setBusy(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={keyboard.onLayout}>
      {/* Con el teclado abierto, todo sube para que se vea el botón */}
      <View style={[styles.content, { paddingBottom: keyboard.bottom + 24 }]}>
        <Text style={styles.logo}>Howl</Text>
        <Text style={styles.subtitle}>La comunidad de la UPVT en un solo lugar</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@gmail.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
            placeholderTextColor={colors.muted}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Crear cuenta'}</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => setMode(isLogin ? 'signup' : 'login')}
            style={{ alignSelf: 'center', padding: 8 }}
          >
            <Text style={styles.link}>
              {isLogin ? '¿No tienes cuenta? Crea una' : 'Ya tengo cuenta'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, fontWeight: '900', color: colors.primary, textAlign: 'center', letterSpacing: -2 },
  subtitle: { textAlign: 'center', color: colors.muted, fontSize: 16, marginBottom: 40 },
  form: { gap: 10 },
  label: { fontWeight: '700', color: colors.text, marginTop: 4 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: colors.primary, fontWeight: '600' },
});
