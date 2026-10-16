import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from './supabase';

// Todo lo de fotos y videos: elegirlos, recortarlos y subirlos a la nube.

export type LocalImage = { uri: string; width: number; height: number };
export type LocalVideo = { uri: string; width: number; height: number; thumbUri: string; duration: number };
export type CropRect = { originX: number; originY: number; width: number; height: number };

const MAX_SIDE = 2048; // se guarda más chica para que cargue rápido
const MAX_VIDEO_MB = 50; // límite de Supabase en el plan gratis
export const MAX_VIDEO_SECONDS = 60;

// Abre la galería. `videos` permite elegir también videos.
export async function pickMedia(videos: boolean) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: videos ? ['images', 'videos'] : ['images'],
    allowsEditing: false, // el recorte lo hacemos nosotros (cualquier tamaño)
    quality: 1,
    videoMaxDuration: MAX_VIDEO_SECONDS,
    // En iPhone convierte las fotos HEIC y videos HEVC a formatos que abren todos los celulares
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
  });
  if (result.canceled) return null;
  return result.assets[0];
}

// Deja la foto derecha y de un tamaño razonable, y avisa su tamaño real
export async function loadImage(uri: string): Promise<LocalImage> {
  let image = await ImageManipulator.manipulate(uri).renderAsync();
  const biggest = Math.max(image.width, image.height);
  if (biggest > MAX_SIDE) {
    const scale = MAX_SIDE / biggest;
    image = await ImageManipulator.manipulate(image)
      .resize({ width: Math.round(image.width * scale), height: Math.round(image.height * scale) })
      .renderAsync();
  }
  const saved = await image.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

// Recorta la foto y la deja lista para subir
export async function cropImage(image: LocalImage, rect: CropRect, maxWidth = 1440): Promise<LocalImage> {
  const safe = {
    originX: Math.max(0, Math.round(rect.originX)),
    originY: Math.max(0, Math.round(rect.originY)),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
  safe.width = Math.min(safe.width, image.width - safe.originX);
  safe.height = Math.min(safe.height, image.height - safe.originY);
  let context = ImageManipulator.manipulate(image.uri).crop(safe);
  if (safe.width > maxWidth) {
    context = context.resize({ width: maxWidth, height: Math.round((safe.height * maxWidth) / safe.width) });
  }
  const result = await (await context.renderAsync()).saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
  return { uri: result.uri, width: result.width, height: result.height };
}

// Revisa el video elegido y le saca una portada
export async function loadVideo(asset: ImagePicker.ImagePickerAsset): Promise<LocalVideo> {
  if (asset.fileSize && asset.fileSize > MAX_VIDEO_MB * 1024 * 1024) {
    throw new Error(`El video pesa más de ${MAX_VIDEO_MB} MB. Elige uno más corto.`);
  }
  const duration = (asset.duration ?? 0) / 1000;
  if (duration > MAX_VIDEO_SECONDS + 1) {
    throw new Error(`El video dura más de ${MAX_VIDEO_SECONDS} segundos. Elige uno más corto.`);
  }
  const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 300, quality: 0.7 });
  // La portada sale ya girada correctamente, así que de ahí sacamos la forma del video
  return { uri: asset.uri, width: thumb.width, height: thumb.height, thumbUri: thumb.uri, duration };
}

// Sube un archivo del celular y regresa su dirección pública
export async function uploadFile(userId: string, uri: string, kind: 'image' | 'video'): Promise<string> {
  const rawExt = (uri.split('?')[0].split('.').pop() ?? '').toLowerCase();
  const ext = kind === 'image' ? 'jpg' : rawExt === 'mov' ? 'mov' : 'mp4';
  const contentType = kind === 'image' ? 'image/jpeg' : ext === 'mov' ? 'video/quicktime' : 'video/mp4';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const body = await fetch(uri).then((res) => res.arrayBuffer());
  const { error } = await supabase.storage.from('images').upload(path, body, { contentType });
  if (error) throw error;
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
}

// Rango de formas permitido (como Instagram): de vertical 9:16 a horizontal 1.91:1
export const MIN_RATIO = 9 / 16;
export const MAX_RATIO = 1.91;
export const clampRatio = (ratio: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
