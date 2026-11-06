import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Shrinks a photo before upload (longest side ≤ maxSide, JPEG ~72%).
 * Keeps phone photos around 200–400 KB instead of 3–10 MB, so the free storage lasts.
 */
export async function shrinkPhoto(uri: string, width?: number, height?: number, maxSide = 1600): Promise<string> {
  try {
    const ctx = ImageManipulator.manipulate(uri);
    if (width && height && Math.max(width, height) > maxSide) {
      ctx.resize(width >= height ? { width: maxSide } : { height: maxSide });
    }
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ compress: 0.72, format: SaveFormat.JPEG });
    return out.uri;
  } catch {
    return uri; // if anything goes wrong, upload the original
  }
}
