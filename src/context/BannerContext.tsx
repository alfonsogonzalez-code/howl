import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { Author } from '../types';
import { colors } from '../theme';

// Avisos que bajan desde arriba mientras usas la app (like, respuesta, mensaje del grupo...)

type Banner = {
  author: Author;
  title: string;
  text: string;
  onPress?: () => void;
};

const BannerContext = createContext<(banner: Banner) => void>(() => {});

const VISIBLE_MS = 3500;

export function BannerProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<Banner | null>(null);
  const slide = useRef(new Animated.Value(-200)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(slide, { toValue: -200, duration: 220, useNativeDriver: true }).start(() =>
      setBanner(null),
    );
  }, [slide]);

  const show = useCallback(
    (next: Banner) => {
      setBanner(next);
      slide.setValue(-200);
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(hide, VISIBLE_MS);
    },
    [hide, slide],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Deslizar hacia arriba para quitarlo
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -5,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -20) hide();
      },
    }),
  ).current;

  return (
    <BannerContext.Provider value={show}>
      {children}
      {banner && (
        <Animated.View
          {...pan.panHandlers}
          style={[styles.wrap, { top: insets.top + 6, transform: [{ translateY: slide }] }]}
        >
          <Pressable
            style={styles.banner}
            onPress={() => {
              hide();
              banner.onPress?.();
            }}
          >
            <Avatar author={banner.author} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {banner.title}
              </Text>
              <Text style={styles.text} numberOfLines={2}>
                {banner.text}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      )}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  return useContext(BannerContext);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 10, right: 10 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { fontWeight: '700', color: colors.text, fontSize: 15 },
  text: { color: colors.muted, fontSize: 14, marginTop: 1 },
});
