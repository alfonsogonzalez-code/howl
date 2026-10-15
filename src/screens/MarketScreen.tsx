import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePosts } from '../context/PostsContext';
import { useRootNavigation } from '../navigationTypes';
import { ProductPost } from '../types';
import { colors } from '../theme';

const itemWidth = (Dimensions.get('window').width - 14 * 3) / 2;

// Mercado: todos los productos en cuadrícula, como Marketplace de Facebook
export function MarketScreen() {
  const { posts } = usePosts();
  const navigation = useRootNavigation();
  const products = posts.filter((p): p is ProductPost => p.type === 'product');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Mercado</Text>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 14 }}
        contentContainerStyle={{ padding: 14, gap: 18 }}
        renderItem={({ item }) => (
          <Pressable
            style={{ width: itemWidth }}
            onPress={() => navigation.navigate('Thread', { postId: item.id })}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <Text style={styles.price}>${item.price.toLocaleString('es-MX')}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.seller}>{item.author.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aún no hay productos. ¡Publica el primero con el +!</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, paddingHorizontal: 16, paddingTop: 8 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: colors.surface },
  price: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 6 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  seller: { fontSize: 12, color: colors.muted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.muted, padding: 40 },
});
