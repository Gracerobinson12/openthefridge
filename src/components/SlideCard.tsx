import { Image, StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { T } from './ui';
import { colors } from '../lib/theme';
import type { Slide } from '../lib/slides';

const W = 206, H = 366;

/** Pure rendering of one slide — used in the editor, the hidden export capture, and the full-screen preview. */
export function SlideCard({ slide, index, total, size = 1 }: { slide: Slide; index: number; total: number; size?: number }) {
  const onPhoto = slide.isPhoto && !!slide.photo;
  const ink = onPhoto ? colors.white : colors.ink;
  return (
    <View style={{ width: W * size, height: H * size, borderRadius: 24 * size, backgroundColor: slide.bg, overflow: 'hidden', padding: 16 * size, paddingTop: 28 * size, gap: 8 * size }}>
      {onPhoto ? <Image source={{ uri: slide.photo! }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      {onPhoto ? <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,17,26,0.25)' }]} /> : null}
      <View style={{ position: 'absolute', top: 10 * size, left: 12 * size, right: 12 * size, flexDirection: 'row', gap: 3 }}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i === index ? colors.ink : 'rgba(20,17,26,0.2)' }} />
        ))}
      </View>
      <T w="heavy" size={10 * size} color={onPhoto ? colors.white : colors.ink2} style={{ letterSpacing: 1 }}>{slide.kicker}</T>
      <T w="heavy" size={20 * size} color={ink}>{slide.title}</T>
      {slide.isPhoto && !slide.photo ? (
        <View style={{ flex: 1, borderRadius: 16 * size, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="camera" size={26 * size} color={colors.ink2} strokeWidth={1.5} />
          <T size={11 * size} color={colors.ink2}>Add a photo to the recipe</T>
        </View>
      ) : null}
      {onPhoto ? <View style={{ flex: 1 }} /> : null}
      <View style={{ gap: 5 * size }}>
        {slide.lines.map((l, i) => <T key={i} size={12 * size} color={ink} style={{ lineHeight: 16 * size }}>{l}</T>)}
      </View>
    </View>
  );
}