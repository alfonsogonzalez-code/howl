import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventPost, PhotoPost, PollPost, Post, ProductPost, TextPost } from '../types';
import { colors } from '../theme';

// Tarjeta de una publicación: arriba el autor y abajo el contenido según su tipo.
export function PostCard({ post }: { post: Post }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: post.author.avatarColor }]}>
          <Text style={styles.avatarText}>{post.author.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <Text style={styles.meta}>
            {post.author.career} · {post.createdAt}
          </Text>
        </View>
      </View>
      <PostBody post={post} />
    </View>
  );
}

function PostBody({ post }: { post: Post }) {
  switch (post.type) {
    case 'text':
      return <TextBody post={post} />;
    case 'poll':
      return <PollBody post={post} />;
    case 'product':
      return <ProductBody post={post} />;
    case 'event':
      return <EventBody post={post} />;
    case 'photo':
      return <PhotoBody post={post} />;
  }
}

function TextBody({ post }: { post: TextPost }) {
  return <Text style={styles.body}>{post.text}</Text>;
}

function PollBody({ post }: { post: PollPost }) {
  // Por ahora el voto solo se guarda en el teléfono; luego irá a la base de datos.
  const [voted, setVoted] = useState<string | null>(null);
  const total = post.options.reduce((sum, o) => sum + o.votes, 0) + (voted ? 1 : 0);

  return (
    <View>
      <Text style={[styles.body, styles.bold]}>{post.question}</Text>
      {post.options.map((option) => {
        const votes = option.votes + (voted === option.id ? 1 : 0);
        const percent = total ? Math.round((votes / total) * 100) : 0;
        const selected = voted === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => setVoted(option.id)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            {voted && <View style={[styles.optionBar, { width: `${percent}%` }]} />}
            <Ionicons
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.optionLabel}>{option.label}</Text>
            {voted && <Text style={styles.meta}>{percent}%</Text>}
          </Pressable>
        );
      })}
      <Text style={styles.meta}>{total} votos</Text>
    </View>
  );
}

function ProductBody({ post }: { post: ProductPost }) {
  return (
    <View>
      <Image source={{ uri: post.imageUrl }} style={styles.image} />
      <Text style={styles.price}>${post.price.toLocaleString('es-MX')} MXN</Text>
      <Text style={[styles.body, styles.bold]}>{post.name}</Text>
      <Text style={styles.description}>{post.description}</Text>
      <Pressable style={styles.button}>
        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
        <Text style={styles.buttonText}>Enviar mensaje al vendedor</Text>
      </Pressable>
    </View>
  );
}

function EventBody({ post }: { post: EventPost }) {
  return (
    <View style={styles.event}>
      <Text style={[styles.body, styles.bold]}>{post.title}</Text>
      <Row icon="calendar-outline" text={post.date} />
      <Row icon="location-outline" text={post.place} />
      <Text style={styles.description}>{post.description}</Text>
    </View>
  );
}

function PhotoBody({ post }: { post: PhotoPost }) {
  return (
    <View>
      {post.caption ? <Text style={styles.body}>{post.caption}</Text> : null}
      <Image source={{ uri: post.imageUrl }} style={styles.image} />
    </View>
  );
}

function Row({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.description}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  authorName: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
  body: { fontSize: 16, color: colors.text, marginBottom: 6 },
  bold: { fontWeight: '700' },
  description: { color: colors.muted, fontSize: 15 },
  image: { width: '100%', aspectRatio: 3 / 2, borderRadius: 12, marginVertical: 6, backgroundColor: colors.border },
  price: { fontSize: 20, fontWeight: '800', color: colors.price },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    overflow: 'hidden',
  },
  optionSelected: { borderColor: colors.primary },
  optionBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#EEF2FF' },
  optionLabel: { flex: 1, fontSize: 15, color: colors.text },
  event: { borderLeftWidth: 4, borderLeftColor: colors.primary, paddingLeft: 10, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
