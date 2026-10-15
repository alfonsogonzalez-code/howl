import { useRef } from 'react';
import { Animated, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventPost, PhotoPost, PollPost, Post, ProductPost, TextPost } from '../types';
import { usePosts } from '../context/PostsContext';
import { useRootNavigation } from '../navigationTypes';
import { colors, postTypeInfo } from '../theme';
import { splitDate, timeAgo } from '../utils/time';
import { Avatar } from './Avatar';

type Props = {
  post: Post;
  // En el Feed se muestran las últimas respuestas; dentro del hilo no
  inThread?: boolean;
  onReplyPress?: () => void;
};

// Una publicación estilo Instagram: autor, contenido, corazón, respuestas y compartir.
export function PostCard({ post, inThread = false, onReplyPress }: Props) {
  const navigation = useRootNavigation();
  const { toggleLike } = usePosts();

  const openThread = () =>
    onReplyPress ? onReplyPress() : navigation.navigate('Thread', { postId: post.id, focusReply: true });

  const share = () => Share.share({ message: `${post.author.name} en Howl: ${shareText(post)}` });

  // Doble toque en la foto = corazón (si aún no lo tenía)
  const likeFromDoubleTap = () => {
    if (!post.liked) toggleLike(post.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar author={post.author} />
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <Text style={styles.meta}>
            {post.author.career} · {timeAgo(post.createdAt)}
          </Text>
        </View>
        {post.type !== 'text' && <TypeTag type={post.type} />}
      </View>

      <PostBody post={post} onDoubleTap={likeFromDoubleTap} onAsk={openThread} />

      <View style={styles.actions}>
        <HeartButton liked={post.liked} onPress={() => toggleLike(post.id)} />
        <Pressable onPress={openThread} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
        </Pressable>
        <Pressable onPress={share} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      {post.likes > 0 && (
        <Text style={styles.likes}>
          {post.likes} me gusta
        </Text>
      )}

      {!inThread && post.replies.length > 0 && (
        <Pressable onPress={openThread} style={styles.replyPreview}>
          {post.replies.length > 1 && (
            <Text style={styles.meta}>Ver las {post.replies.length} respuestas</Text>
          )}
          {/* Muestra la respuesta más reciente, como los comentarios de Instagram */}
          <Text style={styles.replyText} numberOfLines={2}>
            <Text style={styles.bold}>{post.replies[post.replies.length - 1].author.name} </Text>
            {post.replies[post.replies.length - 1].text}
          </Text>
        </Pressable>
      )}
      {!inThread && post.replies.length === 0 && (
        <Pressable onPress={openThread} style={styles.replyPreview}>
          <Text style={styles.meta}>Responder en el hilo…</Text>
        </Pressable>
      )}
    </View>
  );
}

function shareText(post: Post): string {
  switch (post.type) {
    case 'text':
      return post.text;
    case 'photo':
      return post.caption || 'una foto';
    case 'poll':
      return post.question;
    case 'product':
      return `${post.name} a $${post.price}`;
    case 'event':
      return `${post.title} el ${post.date} a las ${post.time}`;
  }
}

function TypeTag({ type }: { type: Post['type'] }) {
  const info = postTypeInfo[type];
  return (
    <View style={[styles.tag, { backgroundColor: info.color + '1A' }]}>
      <Ionicons name={info.icon} size={12} color={info.color} />
      <Text style={[styles.tagText, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

// Corazón que "brinca" al tocarlo
function HeartButton({ liked, onPress }: { liked: boolean; onPress: () => void }) {
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
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={26}
          color={liked ? colors.heart : colors.text}
        />
      </Animated.View>
    </Pressable>
  );
}

// Imagen que detecta doble toque y muestra un corazón grande encima
function DoubleTapImage({ uri, ratio, onDoubleTap }: { uri: string; ratio: number; onDoubleTap: () => void }) {
  const lastTap = useRef(0);
  const heart = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTap();
      heart.setValue(0);
      Animated.sequence([
        Animated.spring(heart, { toValue: 1, useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(heart, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
    lastTap.current = now;
  };

  return (
    <Pressable onPress={handlePress}>
      <Image source={{ uri }} style={[styles.image, { aspectRatio: ratio }]} />
      <Animated.View
        pointerEvents="none"
        style={[styles.bigHeart, { opacity: heart, transform: [{ scale: heart }] }]}
      >
        <Ionicons name="heart" size={100} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

type BodyProps = { post: Post; onDoubleTap: () => void; onAsk: () => void };

function PostBody({ post, onDoubleTap, onAsk }: BodyProps) {
  switch (post.type) {
    case 'text':
      return <TextBody post={post} />;
    case 'photo':
      return <PhotoBody post={post} onDoubleTap={onDoubleTap} />;
    case 'poll':
      return <PollBody post={post} />;
    case 'product':
      return <ProductBody post={post} onDoubleTap={onDoubleTap} onAsk={onAsk} />;
    case 'event':
      return <EventBody post={post} />;
  }
}

function TextBody({ post }: { post: TextPost }) {
  return <Text style={[styles.padded, styles.tweet]}>{post.text}</Text>;
}

function PhotoBody({ post, onDoubleTap }: { post: PhotoPost; onDoubleTap: () => void }) {
  return (
    <View>
      {post.caption ? <Text style={[styles.padded, styles.body]}>{post.caption}</Text> : null}
      <DoubleTapImage uri={post.imageUrl} ratio={1} onDoubleTap={onDoubleTap} />
    </View>
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
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={colors.primary}
            />
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

function ProductBody({ post, onDoubleTap, onAsk }: { post: ProductPost; onDoubleTap: () => void; onAsk: () => void }) {
  return (
    <View>
      <DoubleTapImage uri={post.imageUrl} ratio={4 / 3} onDoubleTap={onDoubleTap} />
      <View style={[styles.padded, { marginTop: 10 }]}>
        <Text style={styles.price}>${post.price.toLocaleString('es-MX')}</Text>
        <Text style={styles.productName}>{post.name}</Text>
        {post.description ? <Text style={styles.description}>{post.description}</Text> : null}
        <Pressable style={styles.outlineButton} onPress={onAsk}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
          <Text style={styles.outlineButtonText}>Preguntar en el hilo</Text>
        </Pressable>
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
          color={post.imGoing ? '#fff' : colors.primary}
        />
        <Text style={[styles.goingText, post.imGoing && { color: '#fff' }]}>
          {post.imGoing ? 'Asistirás' : 'Asistiré'} · {post.going}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderBottomWidth: 8,
    borderBottomColor: colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 10 },
  authorName: { fontWeight: '700', fontSize: 15, color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
  padded: { paddingHorizontal: 14 },
  body: { fontSize: 15, color: colors.text, marginBottom: 8 },
  tweet: { fontSize: 17, lineHeight: 24, color: colors.text },
  bold: { fontWeight: '700' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { fontSize: 12, fontWeight: '700' },
  image: { width: '100%', backgroundColor: colors.surface },
  bigHeart: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 18, paddingHorizontal: 14, paddingTop: 12 },
  likes: { fontWeight: '700', color: colors.text, paddingHorizontal: 14, marginTop: 8 },
  replyPreview: { paddingHorizontal: 14, marginTop: 4, gap: 2 },
  replyText: { color: colors.text, fontSize: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  optionSelected: { borderColor: colors.primary },
  optionBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.primarySoft },
  optionLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  percent: { fontWeight: '700', color: colors.text },
  price: { fontSize: 22, fontWeight: '800', color: colors.price },
  productName: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 2 },
  description: { color: colors.muted, fontSize: 15, marginTop: 4, lineHeight: 21 },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  outlineButtonText: { color: colors.primary, fontWeight: '700' },
  eventBox: { gap: 10 },
  eventTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dateTile: {
    width: 58,
    height: 62,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  dateDay: { color: colors.text, fontWeight: '800', fontSize: 24 },
  eventTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  goingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: colors.primarySoft,
  },
  goingButtonActive: { backgroundColor: colors.primary },
  goingText: { color: colors.primary, fontWeight: '700' },
});
