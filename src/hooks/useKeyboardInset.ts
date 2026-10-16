import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardEvent, LayoutAnimation, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Calcula cuánto espacio dejar abajo para que lo que escribes quede
// justo encima del teclado (ni tapado ni flotando de más).
//
// Uso: pon `ref` y `onLayout` en la vista que ocupa toda la pantalla y usa
// `bottom` como paddingBottom de la parte de abajo. Sin teclado, `bottom` es
// el espacio seguro del celular (la rayita de abajo del iPhone).
//
// Cómo funciona: mide en qué parte de la pantalla termina tu vista y en qué
// parte empieza el teclado. Lo que se encimen es lo que hay que subir.
// Así funciona igual en iPhone y en cualquier Android, aunque el Android
// encoja la pantalla solo o no.
export function useKeyboardInset() {
  const insets = useSafeAreaInsets();
  const ref = useRef<View>(null);
  const viewBottom = useRef<number | null>(null); // dónde termina la vista en la pantalla
  const keyboardTop = useRef<number | null>(null); // dónde empieza el teclado (null = cerrado)
  const [covered, setCovered] = useState(0);
  const [open, setOpen] = useState(false);

  const recalc = useCallback(() => {
    if (keyboardTop.current === null || viewBottom.current === null) return;
    setCovered(Math.max(0, Math.round(viewBottom.current - keyboardTop.current)));
  }, []);

  const measure = useCallback(() => {
    ref.current?.measureInWindow((_x, y, _width, height) => {
      if (!height) return;
      viewBottom.current = y + height;
      recalc();
    });
  }, [recalc]);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    // En iPhone avisa "antes" de que salga el teclado para animarlo junto
    const showEvent = ios ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = ios ? 'keyboardWillHide' : 'keyboardDidHide';

    const animate = (e: KeyboardEvent) => {
      if (!ios || !e.duration) return;
      const duration = Math.max(e.duration, 10);
      LayoutAnimation.configureNext({
        duration,
        update: { duration, type: LayoutAnimation.Types.keyboard },
      });
    };

    const timers: ReturnType<typeof setTimeout>[] = [];
    const show = Keyboard.addListener(showEvent, (e) => {
      animate(e);
      keyboardTop.current = e.endCoordinates.screenY;
      setOpen(true);
      recalc();
      // Algunos Android acomodan la pantalla un poquito después: se vuelve a medir
      if (!ios) timers.push(setTimeout(measure, 100), setTimeout(measure, 350));
    });
    const hide = Keyboard.addListener(hideEvent, (e) => {
      animate(e);
      keyboardTop.current = null;
      setOpen(false);
      setCovered(0);
    });
    return () => {
      show.remove();
      hide.remove();
      timers.forEach(clearTimeout);
    };
  }, [measure, recalc]);

  return {
    keyboardOpen: open,
    bottom: open ? covered : insets.bottom,
    ref,
    onLayout: measure,
  };
}
