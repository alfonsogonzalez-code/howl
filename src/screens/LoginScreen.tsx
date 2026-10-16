import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../config';
import { colors, logoFont } from '../theme';

// Entrar o crear cuenta con correo y contraseña
export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const keyboard = useKeyboardInset();
  const passwordRef = useRef<TextInput>(null);

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
    <SafeAreaView style={styles.container} edges={['top']} ref={keyboard.ref} onLayout={keyboard.onLayout}>
      {/* Con el teclado abierto, el espacio de abajo crece y todo sube para que
          siempre veas donde escribes; si no cabe, se puede deslizar */}
      <ScrollView
        style={{ flex: 1, marginBottom: keyboard.bottom }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.logo, keyboard.keyboardOpen && styles.logoSmall]}>Howl</Text>
        {!keyboard.keyboardOpen && <Text style={styles.subtitle}>La comunidad de la UPVT en un solo lugar</Text>}

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
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            submitBehavior="submit"
          />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
            placeholderTextColor={colors.muted}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            returnKeyType="go"
            onSubmitEditing={submit}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontFamily: logoFont, fontSize: 72, color: colors.text, textAlign: 'center' },
  logoSmall: { fontSize: 52, marginBottom: 8 },
  subtitle: { textAlign: 'center', color: colors.muted, fontSize: 16, marginBottom: 36 },
  form: { gap: 10 },
  label: { fontWeight: '700', color: colors.text, marginTop: 4 },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: colors.primary, fontWeight: '600' },
});
