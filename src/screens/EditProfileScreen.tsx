import { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/Avatar';
import { useAuth, useCurrentUser } from '../context/AuthContext';
import { useActionSheet } from '../context/ActionSheetContext';
import { usePosts } from '../context/PostsContext';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { pickMedia } from '../lib/media';
import { CAREERS } from '../config';
import { RootScreenProps } from '../navigationTypes';
import { colors } from '../theme';

const MAX_BIO = 150;

// Editar perfil: foto, nombre, carrera, descripción y nota
export function EditProfileScreen({ navigation }: RootScreenProps<'EditProfile'>) {
  const me = useCurrentUser();
  const { updateProfile } = useAuth();
  const { refresh } = usePosts();
  const showActions = useActionSheet();
  const keyboard = useKeyboardInset();

  const [name, setName] = useState(me.name);
  const [career, setCareer] = useState(me.career);
  const [bio, setBio] = useState(me.bio);
  // undefined = no cambió, null = quitar la foto, texto = foto nueva
  const [avatarUri, setAvatarUri] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const preview = {
    ...me,
    name: name || me.name,
    avatarUrl: avatarUri === undefined ? me.avatarUrl : avatarUri,
  };

  const changePhoto = () =>
    showActions({
      title: 'Foto de perfil',
      options: [
        {
          label: 'Elegir de la galería',
          icon: 'image-outline',
          onPress: async () => {
            const asset = await pickMedia(false);
            if (asset) setAvatarUri(asset.uri);
          },
        },
        ...(preview.avatarUrl
          ? [{ label: 'Quitar foto', icon: 'trash-outline' as const, destructive: true, onPress: () => setAvatarUri(null) }]
          : []),
      ],
    });

  const save = async () => {
    if (name.trim().length < 2) return Alert.alert('Falta tu nombre', 'Escribe tu nombre y apellido.');
    setSaving(true);
    try {
      await updateProfile({ name, career, bio, avatarUri });
      refresh(); // para que tu foto nueva salga en tus publicaciones
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('No se pudo guardar', (e as Error).message);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.cancel}>Cancelar</Text>
        </Pressable>
      ),
      headerRight: () =>
        saving ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Pressable onPress={save} hitSlop={10}>
            <Text style={styles.done}>Listo</Text>
          </Pressable>
        ),
    });
  });

  return (
    <View style={styles.container} ref={keyboard.ref} onLayout={keyboard.onLayout}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: keyboard.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.photo} onPress={changePhoto}>
          <Avatar author={preview} size={96} />
          <Text style={styles.link}>Cambiar foto</Text>
        </Pressable>

        <Field label="Nombre">
          <TextInput value={name} onChangeText={setName} style={styles.input} maxLength={60} autoCapitalize="words" />
        </Field>

        <Field label="Descripción">
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
            placeholder="Cuéntale a la UPVT quién eres"
            placeholderTextColor={colors.muted}
            maxLength={MAX_BIO}
            multiline
          />
          <Text style={styles.counter}>
            {bio.length}/{MAX_BIO}
          </Text>
        </Field>

        <Field label="Nota">
          <Pressable style={styles.noteRow} onPress={() => navigation.navigate('Note')}>
            <Text style={[styles.noteText, !me.note && { color: colors.muted }]} numberOfLines={1}>
              {me.note ?? 'Escribe una nota (dura 24 horas)'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </Field>

        <Field label="Carrera">
          <View style={styles.careers}>
            {CAREERS.map((c) => (
              <Pressable key={c} onPress={() => setCareer(c)} style={[styles.chip, career === c && styles.chipActive]}>
                <Text style={[styles.chipText, career === c && { color: '#fff' }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          {career !== me.career && (
            <Text style={styles.counter}>Al cambiar de carrera, tu chat grupal será el de {career}.</Text>
          )}
        </Field>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 18 },
  photo: { alignItems: 'center', gap: 10, paddingVertical: 6 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  field: { gap: 6 },
  label: { fontWeight: '700', color: colors.text, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: colors.text,
  },
  counter: { color: colors.muted, fontSize: 12 },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteText: { flex: 1, fontSize: 16, color: colors.text },
  careers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.text },
  chipText: { fontWeight: '600', color: colors.text },
  cancel: { fontSize: 16, color: colors.text },
  done: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
