import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { Backdrop } from './ui';

/** Page shell: pastel glow backdrop, safe-area padding, centered column on wide screens. */
export function Screen({ children, glow = 'pink', scroll = true, bottomSpace = 120, ...rest }: { children: ReactNode; glow?: 'pink' | 'blue' | 'violet' | 'peach'; scroll?: boolean; bottomSpace?: number } & ScrollViewProps) {
  const insets = useSafeAreaInsets();
  const inner = { paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: bottomSpace + insets.bottom, gap: 16, width: '100%' as const, maxWidth: 560, alignSelf: 'center' as const };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Backdrop variant={glow} />
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} {...rest} contentContainerStyle={inner}>
          {children}
        </ScrollView>
      ) : (
        <View style={[inner, { flex: 1 }]}>{children}</View>
      )}
    </View>
  );
}
