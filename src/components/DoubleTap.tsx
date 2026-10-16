import { ReactNode, useRef } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  children: ReactNode;
  onDoubleTap: () => void; // doble toque = corazón
  onSingleTap?: () => void; // un toque (por ejemplo, quitar el silencio del video)
  style?: StyleProp<ViewStyle>;
  heartSize?: number;
};

const DELAY = 260;

// Detecta doble toque y muestra un corazón grande encima, como en Instagram
export function DoubleTap({ children, onDoubleTap, onSingleTap, style, heartSize = 100 }: Props) {
  const lastTap = useRef(0);
  const singleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heart = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current < DELAY) {
      if (singleTimer.current) clearTimeout(singleTimer.current);
      lastTap.current = 0;
      onDoubleTap();
      heart.setValue(0);
      Animated.sequence([
        Animated.spring(heart, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }),
        Animated.delay(450),
        Animated.timing(heart, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      return;
    }
    lastTap.current = now;
    if (onSingleTap) singleTimer.current = setTimeout(onSingleTap, DELAY);
  };

  return (
    <Pressable onPress={handlePress} style={style}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[styles.bigHeart, { opacity: heart, transform: [{ scale: heart }] }]}
      >
        <Ionicons name="heart" size={heartSize} color="#fff" style={styles.shadow} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bigHeart: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  shadow: { textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 12 },
});
