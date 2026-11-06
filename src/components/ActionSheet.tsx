import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { Glass, T } from './ui';

export type SheetOption = { label: string; destructive?: boolean };
type Open = (title: string, options: SheetOption[], message?: string) => Promise<number>;

const SheetContext = createContext<Open | null>(null);

/** A bottom action sheet that looks the same on web, iPhone and Android. */
export function SheetProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<{ title: string; message?: string; options: SheetOption[] } | null>(null);
  const resolver = useRef<((n: number) => void) | null>(null);

  const open = useCallback<Open>((title, options, message) => {
    setState({ title, options, message });
    return new Promise<number>((resolve) => (resolver.current = resolve));
  }, []);
  const close = (n: number) => {
    setState(null);
    resolver.current?.(n);
    resolver.current = null;
  };

  return (
    <SheetContext.Provider value={open}>
      {children}
      <Modal visible={!!state} transparent animationType="fade" onRequestClose={() => close(-1)}>
        <Pressable accessibilityLabel="Close menu" onPress={() => close(-1)} style={{ flex: 1, backgroundColor: 'rgba(20,17,26,0.35)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ padding: 12, paddingBottom: Math.max(insets.bottom, 12), gap: 8, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
            <Glass radius={22} strong style={{ overflow: 'hidden' }}>
              {state ? (
                <View style={{ paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', gap: 2, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
                  <T w="bold" size={14} color={colors.ink2}>{state.title}</T>
                  {state.message ? <T size={13} color={colors.ink3} style={{ textAlign: 'center' }}>{state.message}</T> : null}
                </View>
              ) : null}
              {state?.options.map((o, i) => (
                <Pressable key={o.label} accessibilityRole="button" onPress={() => close(i)}
                  style={({ pressed }) => ({ minHeight: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.tintSoft : 'transparent', borderBottomWidth: i < state.options.length - 1 ? 1 : 0, borderBottomColor: colors.hairline })}>
                  <T w="semibold" size={17} color={o.destructive ? colors.heart : colors.ink}>{o.label}</T>
                </Pressable>
              ))}
            </Glass>
            <Pressable accessibilityRole="button" onPress={() => close(-1)}>
              <Glass radius={22} strong style={{ minHeight: 54, alignItems: 'center', justifyContent: 'center' }}>
                <T w="bold" size={17}>Cancel</T>
              </Glass>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SheetContext.Provider>
  );
}

export function useActionSheet(): Open {
  const open = useContext(SheetContext);
  if (!open) throw new Error('useActionSheet must be inside SheetProvider');
  return open;
}

export const REPORT_REASONS = ['Spam or scam', 'Rude, hateful or bullying', 'Nudity or sexual content', 'Violence or dangerous', 'Stolen recipe or photo', 'Something else'];
