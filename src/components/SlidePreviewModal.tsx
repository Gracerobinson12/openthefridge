import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { SlideCard } from './SlideCard';
import { colors } from '../lib/theme';
import type { Slide } from '../lib/slides';

/** Full-screen, swipe-through preview — see the slides the way a viewer would, before exporting. */
export function SlidePreviewModal({ visible, slides, onClose }: { visible: boolean; slides: Slide[]; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardW = Math.min(width - 40, 320);
  const scale = cardW / 206;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.ink }}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {slides.map((s, i) => (
            <View key={s.id} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
              <SlideCard slide={s} index={i} total={slides.length} size={scale} />
            </View>
          ))}
        </ScrollView>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close preview"
          style={{ position: 'absolute', top: insets.top + 12, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={16} color={colors.white} strokeWidth={2.6} />
        </Pressable>
      </View>
    </Modal>
  );
}
