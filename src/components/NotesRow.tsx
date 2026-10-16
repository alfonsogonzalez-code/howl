import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCurrentUser } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { NOTE_HOURS, ProfileRow, toAuthor } from '../lib/profiles';
import { useRootNavigation } from '../navigationTypes';
import { Author } from '../types';
import { colors } from '../theme';
import { Avatar } from './Avatar';
import { NoteBubble } from './NoteBubble';

// Fila de notas arriba del Feed (como las notas de Instagram):
// tu nota primero y luego las de los demás de las últimas 24 horas.
export function NotesRow({ refreshKey }: { refreshKey: number }) {
  const me = useCurrentUser();
  const navigation = useRootNavigation();
  const [others, setOthers] = useState<Author[]>([]);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - NOTE_HOURS * 3600 * 1000).toISOString();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .not('note', 'is', null)
      .gt('note_at', since)
      .neq('id', me.id)
      .order('note_at', { ascending: false })
      .limit(30);
    if (data) setOthers(data.map((row) => toAuthor(row as ProfileRow)));
  }, [me.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  // Al jalar el Feed hacia abajo también se recargan las notas
  useEffect(() => {
    if (refreshKey) load();
  }, [load, refreshKey]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Pressable style={styles.item} onPress={() => navigation.navigate('Note')}>
        <View style={styles.bubbleSpot}>
          <NoteBubble text={me.note ?? 'Comparte una nota'} muted={!me.note} small />
        </View>
        <Avatar author={me} size={66} ring={!!me.note} />
        <Text style={styles.name} numberOfLines={1}>
          Tu nota
        </Text>
      </Pressable>
      {others.map((author) => (
        <Pressable
          key={author.id}
          style={styles.item}
          onPress={() => navigation.navigate('Profile', { userId: author.id })}
        >
          <View style={styles.bubbleSpot}>
            <NoteBubble text={author.note ?? ''} small />
          </View>
          <Avatar author={author} size={66} ring />
          <Text style={styles.name} numberOfLines={1}>
            {author.name.split(' ')[0]}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 10, gap: 6 },
  item: { width: 86, alignItems: 'center', paddingTop: 40 },
  bubbleSpot: { position: 'absolute', top: 0, zIndex: 2, alignItems: 'center', width: 96 },
  name: { fontSize: 12, color: colors.text, marginTop: 5, maxWidth: 80 },
});
