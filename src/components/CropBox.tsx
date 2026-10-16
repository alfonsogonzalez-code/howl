import { useMemo, useRef } from 'react';
import { Image, PanResponder, StyleSheet, View } from 'react-native';
import { CropRect, LocalImage } from '../lib/media';
import { colors } from '../theme';

export type CropOffset = { x: number; y: number }; // 0 = pegado a la izquierda/arriba, 1 = a la derecha/abajo

type Props = {
  image: LocalImage;
  ratio: number; // forma del recorte (ancho / alto)
  width: number; // ancho del recuadro en pantalla
  offset: CropOffset;
  onChange: (offset: CropOffset) => void;
  onDragging?: (dragging: boolean) => void;
};

// Cálculos del recorte: qué tan grande se ve la foto y qué parte queda dentro del recuadro
export function cropLayout(image: LocalImage, ratio: number, width: number, offset: CropOffset) {
  const height = width / ratio;
  const scale = Math.max(width / image.width, height / image.height);
  const shownW = image.width * scale;
  const shownH = image.height * scale;
  const extraX = shownW - width; // lo que sobra a los lados
  const extraY = shownH - height; // lo que sobra arriba y abajo
  const rect: CropRect = {
    originX: (extraX * offset.x) / scale,
    originY: (extraY * offset.y) / scale,
    width: width / scale,
    height: height / scale,
  };
  return { height, shownW, shownH, extraX, extraY, rect };
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

// Recuadro para acomodar la foto: arrástrala para elegir qué parte se ve
export function CropBox({ image, ratio, width, offset, onChange, onDragging }: Props) {
  const layout = cropLayout(image, ratio, width, offset);
  const start = useRef(offset);
  const latest = useRef({ offset, layout, onChange, onDragging });
  latest.current = { offset, layout, onChange, onDragging };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = latest.current.offset;
          latest.current.onDragging?.(true);
        },
        onPanResponderMove: (_, g) => {
          const { extraX, extraY } = latest.current.layout;
          latest.current.onChange({
            x: extraX > 0 ? clamp(start.current.x - g.dx / extraX) : 0.5,
            y: extraY > 0 ? clamp(start.current.y - g.dy / extraY) : 0.5,
          });
        },
        onPanResponderRelease: () => latest.current.onDragging?.(false),
        onPanResponderTerminate: () => latest.current.onDragging?.(false),
      }),
    [],
  );

  return (
    <View style={[styles.frame, { width, height: layout.height }]} {...pan.panHandlers}>
      <Image
        source={{ uri: image.uri }}
        style={{
          position: 'absolute',
          width: layout.shownW,
          height: layout.shownH,
          left: -layout.extraX * offset.x,
          top: -layout.extraY * offset.y,
        }}
      />
      {/* Cuadrícula de tercios, como en la cámara */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.lineV, { left: '33.33%' }]} />
        <View style={[styles.lineV, { left: '66.66%' }]} />
        <View style={[styles.lineH, { top: '33.33%' }]} />
        <View style={[styles.lineH, { top: '66.66%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.surface, alignSelf: 'center' },
  lineV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.6)' },
  lineH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.6)' },
});
