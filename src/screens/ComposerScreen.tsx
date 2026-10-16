import { ReactNode, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CropBox, CropOffset, cropLayout } from '../components/CropBox';
import { clampRatio, cropImage, LocalImage, LocalVideo, loadImage, loadVideo, pickMedia } from '../lib/media';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { usePosts } from '../context/PostsContext';
import { RootScreenProps } from '../navigationTypes';
import { PostDraft } from '../types';
import { colors, postTypeInfo } from '../theme';

const MAX_TEXT = 280; // como Twitter

// Formas de recorte, como en Instagram. "Original" deja la foto completa.
type Shape = 'original' | number;
const SHAPES: { key: Shape; label: string }[] = [
  { key: 'original', label: 'Original' },
  { key: 1, label: '1:1' },
  { key: 4 / 5, label: '4:5' },
  { key: 16 / 9, label: '16:9' },
  { key: 9 / 16, label: '9:16' },
];

// Formulario para crear una publicación. Los campos cambian según el tipo elegido.
export function ComposerScreen({ route, navigation }: RootScreenProps<'Composer'>) {
  const { type } = route.params;
  const { addPost } = usePosts();
  const keyboard = useKeyboardInset();

  // Todos los campos posibles; cada tipo usa solo los suyos
  const [text, setText] = useState('');
  const [image, setImage] = useState<LocalImage | null>(null);
  const [video, setVideo] = useState<LocalVideo | null>(null);
  const [shape, setShape] = useState<Shape>(type === 'product' ? 1 : 'original');
  const [offset, setOffset] = useState<CropOffset>({ x: 0.5, y: 0.5 });
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');

  // Elegir foto (o video, si es publicación de foto o video)
  const pickImage = async () => {
    const asset = await pickMedia(type === 'photo');
    if (!asset) return;
    setLoadingMedia(true);
    try {
      if (asset.type === 'video') {
        setVideo(await loadVideo(asset));
        setImage(null);
      } else {
        setImage(await loadImage(asset.uri));
        setVideo(null);
        setOffset({ x: 0.5, y: 0.5 });
      }
    } catch (e) {
      Alert.alert('No se pudo usar', (e as Error).message);
    } finally {
      setLoadingMedia(false);
    }
  };

  // En "Foto o video" la galería se abre sola al entrar, como en Instagram
  useEffect(() => {
    if (type === 'photo') pickImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forma del recorte y tamaño del recuadro en pantalla
  const ratio = image ? (shape === 'original' ? clampRatio(image.width / image.height) : shape) : 1;
  const maxHeight = 460;
  const boxWidth = Math.min(screenWidth - 32, maxHeight * ratio);

  // Recorta la foto como quedó en el recuadro
  const finalImage = async () => {
    if (!image) return null;
    const { rect } = cropLayout(image, ratio, boxWidth, offset);
    const cropped = await cropImage(image, rect);
    return { imageUrl: cropped.uri, aspectRatio: cropped.width / cropped.height };
  };

  // Revisa que estén los campos obligatorios y arma la publicación
  const buildDraft = async (): Promise<PostDraft | string> => {
    switch (type) {
      case 'text':
        return text.trim() ? { type, text: text.trim() } : 'Escribe tu mensaje.';
      case 'photo': {
        if (video) {
          return {
            type,
            mediaType: 'video',
            imageUrl: video.uri,
            thumbUrl: video.thumbUri,
            aspectRatio: video.width / video.height,
            caption: text.trim(),
          };
        }
        const photo = await finalImage();
        return photo ? { type, mediaType: 'image', ...photo, caption: text.trim() } : 'Elige una foto o un video.';
      }
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
        if (!image) return 'Agrega una foto del producto.';
        if (!name.trim()) return 'Escribe el nombre del producto.';
        if (!value) return 'Escribe el precio.';
        const photo = await finalImage();
        if (!photo) return 'Agrega una foto del producto.';
        return { type, ...photo, name: name.trim(), price: value, description: text.trim() };
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

  const [publishing, setPublishing] = useState(false);

  const publish = async () => {
    setPublishing(true);
    try {
      const draft = await buildDraft();
      if (typeof draft === 'string') {
        setPublishing(false);
        Alert.alert('Falta algo', draft);
        return;
      }
      await addPost(draft);
    } catch (e) {
      setPublishing(false);
      Alert.alert('No se pudo publicar', `Revisa tu conexión e inténtalo de nuevo.\n(${(e as Error).message})`);
      return;
    }
    // Regresa al Feed cerrando este formulario (no abre otra pantalla encima)
    navigation.popTo('Tabs', { screen: 'Inicio' });
  };

  const info = postTypeInfo[type];

  return (
    <View style={styles.container} ref={keyboard.ref} onLayout={keyboard.onLayout}>
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        scrollEnabled={!dragging}
      >
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

        {(type === 'photo' || type === 'product') &&
          (loadingMedia ? (
            <View style={styles.imagePicker}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : image ? (
            <View style={{ gap: 12 }}>
              <CropBox
                image={image}
                ratio={ratio}
                width={boxWidth}
                offset={offset}
                onChange={setOffset}
                onDragging={setDragging}
              />
              <Text style={styles.hint}>Arrastra la foto para acomodarla</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shapes}>
                {SHAPES.map((s) => (
                  <Pressable
                    key={s.label}
                    style={[styles.shape, shape === s.key && styles.shapeActive]}
                    onPress={() => {
                      setShape(s.key);
                      setOffset({ x: 0.5, y: 0.5 });
                    }}
                  >
                    <ShapeIcon shape={s.key} image={image} active={shape === s.key} />
                    <Text style={[styles.shapeText, shape === s.key && { color: '#fff' }]}>{s.label}</Text>
                  </Pressable>
                ))}
                <Pressable style={styles.shape} onPress={pickImage}>
                  <Ionicons name="swap-horizontal" size={16} color={colors.text} />
                  <Text style={styles.shapeText}>Cambiar</Text>
                </Pressable>
              </ScrollView>
            </View>
          ) : video ? (
            <View style={{ gap: 12 }}>
              <VideoPreview video={video} width={Math.min(screenWidth - 32, maxHeight * clampRatio(video.width / video.height))} />
              <Pressable style={[styles.shape, { alignSelf: 'center' }]} onPress={pickImage}>
                <Ionicons name="swap-horizontal" size={16} color={colors.text} />
                <Text style={styles.shapeText}>Cambiar video</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.imagePicker} onPress={pickImage}>
              <Ionicons name={type === 'photo' ? 'images-outline' : 'camera-outline'} size={44} color={colors.muted} />
              <Text style={styles.muted}>
                {type === 'photo' ? 'Toca para elegir una foto o un video' : 'Toca para elegir una foto'}
              </Text>
            </Pressable>
          ))}

        {type === 'photo' && (
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe una descripción…"
            placeholderTextColor={colors.muted}
            style={styles.captionInput}
            maxLength={2200}
            multiline
          />
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

      {/* El botón de publicar queda justo encima del teclado */}
      <View style={[styles.footer, { paddingBottom: keyboard.bottom + 12 }]}>
        <Pressable
          style={[styles.publish, { opacity: publishing ? 0.6 : 1 }]}
          onPress={publish}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishText}>{type === 'photo' ? 'Compartir' : `Publicar ${info.label.toLowerCase()}`}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// Video elegido: se reproduce en silencio para que veas cuál es
function VideoPreview({ video, width }: { video: LocalVideo; width: number }) {
  const player = useVideoPlayer(video.uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <View style={[styles.videoBox, { width, aspectRatio: clampRatio(video.width / video.height) }]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <View style={styles.videoBadge}>
        <Ionicons name="videocam" size={13} color="#fff" />
        <Text style={styles.videoBadgeText}>{Math.round(video.duration)} s</Text>
      </View>
    </View>
  );
}

// Dibujito de la forma del recorte (un rectangulito)
function ShapeIcon({ shape, image, active }: { shape: Shape; image: LocalImage; active: boolean }) {
  const r = shape === 'original' ? clampRatio(image.width / image.height) : shape;
  const w = r >= 1 ? 16 : 16 * r;
  const h = r >= 1 ? 16 / r : 16;
  return <View style={{ width: w, height: h, borderWidth: 1.5, borderRadius: 2, borderColor: active ? '#fff' : colors.text }} />;
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  publish: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.primary },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  shapes: { gap: 8, paddingHorizontal: 2 },
  shape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  shapeActive: { backgroundColor: colors.text },
  shapeText: { fontWeight: '600', color: colors.text, fontSize: 13 },
  captionInput: { fontSize: 16, color: colors.text, minHeight: 80, textAlignVertical: 'top' },
  videoBox: { alignSelf: 'center', backgroundColor: '#000', overflow: 'hidden' },
  videoBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  videoBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  publishText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
