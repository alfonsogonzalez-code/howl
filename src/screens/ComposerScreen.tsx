import { ReactNode, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePosts } from '../context/PostsContext';
import { RootScreenProps } from '../navigationTypes';
import { PostDraft } from '../types';
import { colors, postTypeInfo } from '../theme';

const MAX_TEXT = 280; // como Twitter

// Formulario para crear una publicación. Los campos cambian según el tipo elegido.
export function ComposerScreen({ route, navigation }: RootScreenProps<'Composer'>) {
  const { type } = route.params;
  const { addPost } = usePosts();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  // Todos los campos posibles; cada tipo usa solo los suyos
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImageUrl(result.assets[0].uri);
  };

  // Revisa que estén los campos obligatorios y arma la publicación
  const buildDraft = (): PostDraft | string => {
    switch (type) {
      case 'text':
        return text.trim() ? { type, text: text.trim() } : 'Escribe tu mensaje.';
      case 'photo':
        return imageUrl ? { type, imageUrl, caption: text.trim() } : 'Elige una foto.';
      case 'poll': {
        const filled = options.map((o) => o.trim()).filter(Boolean);
        if (!question.trim()) return 'Escribe la pregunta.';
        if (filled.length < 2) return 'La encuesta necesita al menos 2 incisos.';
        return {
          type,
          question: question.trim(),
          options: filled.map((label, i) => ({ id: String(i), label, votes: 0 })),
          myVote: null,
        };
      }
      case 'product': {
        const value = Number(price.replace(/[^0-9.]/g, ''));
        if (!imageUrl) return 'Agrega una foto del producto.';
        if (!name.trim()) return 'Escribe el nombre del producto.';
        if (!value) return 'Escribe el precio.';
        return { type, imageUrl, name: name.trim(), price: value, description: text.trim() };
      }
      case 'event':
        if (!title.trim() || !date.trim() || !time.trim() || !place.trim())
          return 'Completa nombre, fecha, hora y lugar.';
        return {
          type,
          title: title.trim(),
          date: date.trim(),
          time: time.trim(),
          place: place.trim(),
          description: text.trim(),
          going: 0,
          imGoing: false,
        };
    }
  };

  const publish = () => {
    const draft = buildDraft();
    if (typeof draft === 'string') {
      Alert.alert('Falta algo', draft);
      return;
    }
    addPost(draft);
    // Regresa al Feed cerrando este formulario (no abre otra pantalla encima)
    navigation.popTo('Tabs', { screen: 'Inicio' });
  };

  const info = postTypeInfo[type];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {type === 'text' && (
          <>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="¿Qué está pasando en la UPVT?"
              placeholderTextColor={colors.muted}
              style={styles.bigInput}
              maxLength={MAX_TEXT}
              multiline
              autoFocus
            />
            <Text style={styles.counter}>
              {text.length}/{MAX_TEXT}
            </Text>
          </>
        )}

        {(type === 'photo' || type === 'product') && (
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.preview} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={40} color={colors.muted} />
                <Text style={styles.muted}>Toca para elegir una foto</Text>
              </>
            )}
          </Pressable>
        )}

        {type === 'photo' && (
          <Field label="Descripción (opcional)" value={text} onChangeText={setText} placeholder="Escribe algo sobre la foto" multiline />
        )}

        {type === 'product' && (
          <>
            <Field label="Nombre del producto" value={name} onChangeText={setName} placeholder="Ej. Calculadora Casio fx-991" />
            <Field label="Precio (MXN)" value={price} onChangeText={setPrice} placeholder="Ej. 350" keyboardType="numeric" />
            <Field label="Descripción" value={text} onChangeText={setText} placeholder="Estado, dónde entregas, etc." multiline />
          </>
        )}

        {type === 'poll' && (
          <>
            <Field label="Pregunta" value={question} onChangeText={setQuestion} placeholder="Ej. ¿Qué día hacemos el torneo?" />
            <Text style={styles.label}>Incisos</Text>
            {options.map((option, i) => (
              <View key={i} style={styles.optionRow}>
                <Text style={styles.optionLetter}>{String.fromCharCode(97 + i)})</Text>
                <TextInput
                  value={option}
                  onChangeText={(value) => setOptions(options.map((o, j) => (j === i ? value : o)))}
                  placeholder={`Inciso ${i + 1}`}
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { flex: 1 }]}
                />
                {options.length > 2 && (
                  <Pressable onPress={() => setOptions(options.filter((_, j) => j !== i))} hitSlop={8}>
                    <Ionicons name="close-circle" size={24} color={colors.muted} />
                  </Pressable>
                )}
              </View>
            ))}
            {options.length < 5 && (
              <Pressable style={styles.addOption} onPress={() => setOptions([...options, ''])}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Agregar inciso</Text>
              </Pressable>
            )}
          </>
        )}

        {type === 'event' && (
          <>
            <Field label="Nombre del evento" value={title} onChangeText={setTitle} placeholder="Ej. Feria de proyectos" />
            <Row>
              <Field label="Fecha" value={date} onChangeText={setDate} placeholder="dd/mm/aaaa" keyboardType="numbers-and-punctuation" />
              <Field label="Hora" value={time} onChangeText={setTime} placeholder="10:00" keyboardType="numbers-and-punctuation" />
            </Row>
            <Field label="Lugar" value={place} onChangeText={setPlace} placeholder="Ej. Explanada principal" />
            <Field label="Descripción (opcional)" value={text} onChangeText={setText} placeholder="¿De qué se trata?" multiline />
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={[styles.publish, { backgroundColor: info.color }]} onPress={publish}>
          <Text style={styles.publishText}>Publicar {info.label.toLowerCase()}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { padding: 16, gap: 16 },
  label: { fontWeight: '700', color: colors.text },
  muted: { color: colors.muted },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  bigInput: { fontSize: 20, color: colors.text, minHeight: 140, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', color: colors.muted },
  imagePicker: {
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionLetter: { fontWeight: '700', color: colors.muted, width: 20 },
  addOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  publish: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  publishText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
