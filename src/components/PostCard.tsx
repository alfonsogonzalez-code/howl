import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { EventPost, PhotoPost, PollPost, Post, ProductPost, TextPost } from '../types';
import { usePosts } from '../context/PostsContext';
import { useCurrentUser } from '../context/AuthContext';
import { useActionSheet } from '../context/ActionSheetContext';
import { useRootNavigation } from '../navigationTypes';
import { colors } from '../theme';
import { splitDate, timeAgo } from '../utils/time';
import { Avatar } from './Avatar';
import { DoubleTap } from './DoubleTap';

type Props = {
  post: Post;
  // En el Feed se muestran las últimas respuestas; dentro del hilo no
  inThread?: boolean;
  onReplyPress?: () => void;
  // El video se reproduce solo cuando la publicación está en pantalla
  active?: boolean;
};

// En el Feed las fotos se ven entre 3:4 (vertical) y 1.91:1 (horizontal), como en Instagram
const feedRatio = (ratio: number | undefined, fallback: number) => Math.min(1.91, Math.max(0.75, ratio ?? fallback));

// Una publicación estilo Instagram: autor, contenido, corazón, comentarios, compartir y guardar.
export function PostCard({ post, inThread = false, onReplyPress, active = false }: Props) {
  const navigation = useRootNavigation();
  const { toggleLike, toggleSave } = usePosts();
  const openMenu = usePostMenu(post);

  const openThread = () =>
    onReplyPress ? onReplyPress() : navigation.navigate('Thread', { postId: post.id, focusReply: true });
  const openProfile = () => navigation.navigate('Profile', { userId: post.author.id });

  // Doble toque en la foto = corazón (si aún no lo tenía)
  const likeFromDoubleTap = () => {
    if (!post.liked) toggleLike(post.id);
  };

  const caption = post.type === 'photo' ? post.caption : '';
  const lastReply = post.replies[post.replies.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={openProfile} hitSlop={4}>
          <Avatar author={post.author} size={34} ring={!!post.author.note} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={openProfile}>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.author.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {post.author.career}
          </Text>
        </Pressable>
        <Pressable onPress={openMenu} hitSlop={12}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </Pressable>
      </View>

      <PostBody post={post} onDoubleTap={likeFromDoubleTap} active={active} />

      {/* Corazón, comentarios y compartir a la izquierda; guardar a la derecha */}
      <View style={styles.actions}>
        <View style={styles.action}>
          <HeartButton liked={post.liked} onPress={() => toggleLike(post.id)} />
          {post.likes > 0 && <Text style={styles.count}>{post.likes}</Text>}
        </View>
        <Pressable onPress={openThread} hitSlop={8} style={styles.action}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.text} style={styles.flip} />
          {post.replies.length > 0 && <Text style={styles.count}>{post.replies.length}</Text>}
        </Pressable>
        <Pressable onPress={() => sharePost(post)} hitSlop={8} style={styles.action}>
          <Ionicons name="paper-plane-outline" size={23} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => toggleSave(post.id)} hitSlop={8}>
          <Ionicons name={post.saved ? 'bookmark' : 'bookmark-outline'} size={23} color={colors.text} />
        </Pressable>
      </View>

      {caption ? (
        <Text style={styles.caption}>
          <Text style={styles.bold} onPress={openProfile}>
            {post.author.name}{' '}
          </Text>
          {caption}
        </Text>
      ) : null}

      {!inThread && post.replies.length > 0 && (
        <Pressable onPress={openThread} style={styles.replyPreview}>
          {post.replies.length > 1 && (
            <Text style={styles.viewAll}>Ver los {post.replies.length} comentarios</Text>
          )}
          {/* El comentario más reciente, como en Instagram */}
          <Text style={styles.replyText} numberOfLines={2}>
            <Text style={styles.bold}>{lastReply.author.name} </Text>
            {lastReply.text}
          </Text>
        </Pressable>
      )}

      <Text style={styles.time}>{timeAgo(post.createdAt, true)}</Text>
    </View>
  );
}

// Menú de los tres puntitos de una publicación
export function usePostMenu(post: Post) {
  const me = useCurrentUser();
  const navigation = useRootNavigation();
  const { deletePost, toggleSave } = usePosts();
  const showActions = useActionSheet();
  const isMine = post.author.id === me.id;

  return () =>
    showActions({
      options: [
        {
          label: post.saved ? 'Quitar de guardados' : 'Guardar',
          icon: post.saved ? 'bookmark' : 'bookmark-outline',
          onPress: () => toggleSave(post.id),
        },
        { label: 'Compartir', icon: 'paper-plane-outline', onPress: () => sharePost(post) },
        ...(isMine
          ? []
          : [
              {
                label: `Ver perfil de ${post.author.name.split(' ')[0]}`,
                icon: 'person-circle-outline' as const,
                onPress: () => navigation.navigate('Profile', { userId: post.author.id }),
              },
            ]),
        ...(isMine
          ? [
              {
                label: 'Borrar publicación',
                icon: 'trash-outline' as const,
                destructive: true,
                onPress: () =>
                  Alert.alert('Borrar publicación', 'Se borrará para todos. ¿Seguro?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Borrar', style: 'destructive', onPress: () => deletePost(post.id) },
                  ]),
              },
            ]
          : []),
      ],
    });
}

export function sharePost(post: Post) {
  const text = (() => {
    switch (post.type) {
      case 'text':
        return post.text;
      case 'photo':
        return (post.caption || (post.mediaType === 'video' ? 'un video' : 'una foto')) + `\n${post.imageUrl}`;
      case 'poll':
        return post.question;
      case 'product':
        return `${post.name} a $${post.price}\n${post.imageUrl}`;
      case 'event':
        return `${post.title} el ${post.date} a las ${post.time}`;
    }
  })();
  Share.share({ message: `${post.author.name} en Howl: ${text}` });
}

// Corazón que "brinca" al tocarlo
export function HeartButton({
  liked,
  onPress,
  size = 26,
  color = colors.text,
}: {
  liked: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={press} hitSlop={8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={size} color={liked ? colors.heart : color} />
      </Animated.View>
    </Pressable>
  );
}

type BodyProps = { post: Post; onDoubleTap: () => void; active: boolean };

function PostBody({ post, onDoubleTap, active }: BodyProps) {
  switch (post.type) {
    case 'text':
      return <TextBody post={post} />;
    case 'photo':
      return <PhotoBody post={post} onDoubleTap={onDoubleTap} active={active} />;
    case 'poll':
      return <PollBody post={post} />;
    case 'product':
      return <ProductBody post={post} onDoubleTap={onDoubleTap} />;
    case 'event':
      return <EventBody post={post} />;
  }
}

function TextBody({ post }: { post: TextPost }) {
  return <Text style={[styles.padded, styles.tweet]}>{post.text}</Text>;
}

function PhotoBody({ post, onDoubleTap, active }: { post: PhotoPost; onDoubleTap: () => void; active: boolean }) {
  const ratio = feedRatio(post.aspectRatio, 1);
  if (post.mediaType === 'video') return <FeedVideo post={post} ratio={ratio} active={active} onDoubleTap={onDoubleTap} />;
  return (
    <DoubleTap onDoubleTap={onDoubleTap}>
      <Image source={{ uri: post.imageUrl }} style={[styles.image, { aspectRatio: ratio }]} />
    </DoubleTap>
  );
}

// Video del Feed: se reproduce solo y sin sonido; un toque le pone sonido
function FeedVideo({
  post,
  ratio,
  active,
  onDoubleTap,
}: {
  post: PhotoPost;
  ratio: number;
  active: boolean;
  onDoubleTap: () => void;
}) {
  const [muted, setMuted] = useState(true);
  const player = useVideoPlayer(post.imageUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  const toggleMute = () => {
    player.muted = !muted;
    setMuted(!muted);
  };

  return (
    <DoubleTap onDoubleTap={onDoubleTap} onSingleTap={toggleMute}>
      <View style={[styles.image, { aspectRatio: ratio }]}>
        {post.thumbUrl && <Image source={{ uri: post.thumbUrl }} style={StyleSheet.absoluteFill} />}
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      </View>
      <View style={styles.muteButton}>
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={14} color="#fff" />
      </View>
    </DoubleTap>
  );
}

function PollBody({ post }: { post: PollPost }) {
  const { vote } = usePosts();
  const total = post.options.reduce((sum, o) => sum + o.votes, 0);
  const voted = post.myVote !== null;

  return (
    <View style={styles.padded}>
      <Text style={[styles.body, styles.bold]}>{post.question}</Text>
      {post.options.map((option) => {
        const percent = total ? Math.round((option.votes / total) * 100) : 0;
        const selected = post.myVote === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => vote(post.id, option.id)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            {voted && <View style={[styles.optionBar, { width: `${percent}%` }]} />}
            <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={colors.primary} />
            <Text style={styles.optionLabel}>{option.label}</Text>
            {voted && <Text style={styles.percent}>{percent}%</Text>}
          </Pressable>
        );
      })}
      <Text style={styles.meta}>
        {total} votos{voted ? ' · Toca otro inciso para cambiar tu voto' : ''}
      </Text>
    </View>
  );
}

function ProductBody({ post, onDoubleTap }: { post: ProductPost; onDoubleTap: () => void }) {
  return (
    <View>
      <DoubleTap onDoubleTap={onDoubleTap}>
        <Image source={{ uri: post.imageUrl }} style={[styles.image, { aspectRatio: feedRatio(post.aspectRatio, 4 / 3) }]} />
        <View style={styles.priceTag}>
          <Ionicons name="pricetag" size={13} color="#fff" />
          <Text style={styles.priceTagText}>${post.price.toLocaleString('es-MX')}</Text>
        </View>
      </DoubleTap>
      <View style={[styles.padded, { marginTop: 10 }]}>
        <Text style={styles.productName}>{post.name}</Text>
        {post.description ? <Text style={styles.description}>{post.description}</Text> : null}
      </View>
    </View>
  );
}

function EventBody({ post }: { post: EventPost }) {
  const { toggleGoing } = usePosts();
  const parts = splitDate(post.date);

  return (
    <View style={[styles.padded, styles.eventBox]}>
      <View style={styles.eventTop}>
        <View style={styles.dateTile}>
          {parts ? (
            <>
              <Text style={styles.dateMonth}>{parts.month}</Text>
              <Text style={styles.dateDay}>{parts.day}</Text>
            </>
          ) : (
            <Ionicons name="calendar" size={26} color={colors.primary} />
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.eventTitle}>{post.title}</Text>
          <Text style={styles.meta}>
            <Ionicons name="time-outline" size={13} /> {post.date} · {post.time}
          </Text>
          <Text style={styles.meta}>
            <Ionicons name="location-outline" size={13} /> {post.place}
          </Text>
        </View>
      </View>
      {post.description ? <Text style={styles.description}>{post.description}</Text> : null}
      <Pressable
        style={[styles.goingButton, post.imGoing && styles.goingButtonActive]}
        onPress={() => toggleGoing(post.id)}
      >
        <Ionicons
          name={post.imGoing ? 'checkmark-circle' : 'star-outline'}
          size={18}
          color={post.imGoing ? '#fff' : colors.text}
        />
        <Text style={[styles.goingText, post.imGoing && { color: '#fff' }]}>
          {post.imGoing ? 'Asistirás' : 'Asistiré'} · {post.going}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  authorName: { fontWeight: '700', fontSize: 14, color: colors.text },
  meta: { color: colors.muted, fontSize: 12 },
  padded: { paddingHorizontal: 14 },
  body: { fontSize: 15, color: colors.text, marginBottom: 8 },
  tweet: { fontSize: 16, lineHeight: 23, color: colors.text, paddingBottom: 2 },
  bold: { fontWeight: '700' },
  flip: { transform: [{ scaleX: -1 }] },
  image: { width: '100%', backgroundColor: colors.surface },
  muteButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 12, paddingTop: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  count: { fontWeight: '600', color: colors.text, fontSize: 14 },
  caption: { color: colors.text, fontSize: 14, lineHeight: 19, paddingHorizontal: 14, marginTop: 8 },
  replyPreview: { paddingHorizontal: 14, marginTop: 6, gap: 3 },
  viewAll: { color: colors.muted, fontSize: 14 },
  replyText: { color: colors.text, fontSize: 14 },
  time: { color: colors.muted, fontSize: 11, paddingHorizontal: 14, marginTop: 6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  optionSelected: { borderColor: colors.primary },
  optionBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.primarySoft },
  optionLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  percent: { fontWeight: '700', color: colors.text },
  priceTag: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceTagText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  productName: { fontSize: 16, fontWeight: '700', color: colors.text },
  description: { color: colors.text, fontSize: 14, marginTop: 3, lineHeight: 20 },
  eventBox: { gap: 10 },
  eventTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dateTile: {
    width: 58,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: { color: colors.heart, fontWeight: '800', fontSize: 12 },
  dateDay: { color: colors.text, fontWeight: '800', fontSize: 24 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  goingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  goingButtonActive: { backgroundColor: colors.primary },
  goingText: { color: colors.text, fontWeight: '700' },
});
