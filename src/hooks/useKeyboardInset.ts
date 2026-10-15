import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardEvent, LayoutAnimation, LayoutChangeEvent, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Calcula cuánto espacio dejar abajo para que la barra de escribir quede
// justo encima del teclado (ni tapada ni flotando de más).
//
// Uso: pon `onLayout` en la vista que ocupa toda la pantalla y usa `bottom`
// como paddingBottom de la barra de abajo. Sin teclado, `bottom` es el
// espacio seguro del iPhone (la rayita de abajo); con teclado, la altura
// del teclado.
export function useKeyboardInset() {
  const insets = useSafeAreaInsets();
  const [keyboard, setKeyboard] = useState(0); // cuánto tapa el teclado
  const [shrink, setShrink] = useState(0); // cuánto se encogió la pantalla sola (algunos Android)
  const fullHeight = useRef(0);
  const keyboardOpen = useRef(false);

  useEffect(() => {
    // En iPhone avisa "antes" de que salga el teclado para animarlo junto
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animate = (e: KeyboardEvent) => {
      if (Platform.OS !== 'ios' || !e.duration) return;
      const duration = Math.max(e.duration, 10);
      LayoutAnimation.configureNext({
        duration,
        update: { duration, type: LayoutAnimation.Types.keyboard },
      });
    };

    const show = Keyboard.addListener(showEvent, (e) => {
      animate(e);
      keyboardOpen.current = true;
      // En Android la altura que llega no incluye la barra de navegación de abajo
      const height = e.endCoordinates.height + (Platform.OS === 'android' ? insets.bottom : 0);
      setKeyboard(height);
    });
    const hide = Keyboard.addListener(hideEvent, (e) => {
      animate(e);
      keyboardOpen.current = false;
      setKeyboard(0);
      setShrink(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);

  const onLayout = (e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    if (!keyboardOpen.current) fullHeight.current = height;
    else setShrink(Math.max(0, fullHeight.current - height));
  };

  const covered = Math.max(0, keyboard - shrink);
  return {
    keyboardOpen: keyboard > 0,
    bottom: covered > 0 ? covered : insets.bottom,
    onLayout,
  };
}
