import { BlurView } from 'expo-blur';
import { Image } from 'react-native';
import type { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { categoryStyle, colors, font, shadow, type Category } from '../lib/theme';
import { Icon, type IconName } from './Icon';

/* ───────── Text ───────── */
type Weight = keyof typeof font;
export function T({ w = 'medium', size = 15, color = colors.ink, style, ...rest }: TextProps & { w?: Weight; size?: number; color?: string }) {
  const tracking = size >= 26 ? -0.035 * size : size >= 17 ? -0.02 * size : 0;
  return <Text {...rest} style={[{ fontFamily: font[w], fontSize: size, color, letterSpacing: tracking }, style as StyleProp<TextStyle>]} />;
}
export const Label = ({ children }: { children: ReactNode }) => (
  <T w="bold" size={11} color={colors.ink2} style={{ letterSpacing: 0.66, paddingLeft: 6 }}>{children}</T>
);

/* ───────── Pastel glow background ───────── */
const GLOWS: Record<string, [string, string, string]> = {
  pink: ['#FFB3C8', '#C9BCFF', '#A8E8CF'],
  blue: ['#A9D4FF', '#FFB3C8', '#FFD8A8'],
  violet: ['#DCD1FF', '#FFB3C8', '#A8E8CF'],
  peach: ['#FFD3A8', '#C9BCFF', '#A9D4FF'],
};
export function Backdrop({ variant = 'pink' }: { variant?: keyof typeof GLOWS }) {
  const [a, b, c] = GLOWS[variant];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, { backgroundColor: a, width: 320, height: 320, top: -110, left: -120 }]} />
      <View style={[styles.blob, { backgroundColor: b, width: 280, height: 280, top: 260, right: -130 }]} />
      <View style={[styles.blob, { backgroundColor: c, width: 300, height: 300, bottom: -40, left: -110 }]} />
      <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
    </View>
  );
}

/* ───────── Glass surface ───────── */
export function Glass({ children, style, radius = 24, strong }: { children?: ReactNode; style?: StyleProp<ViewStyle>; radius?: number; strong?: boolean }) {
  return (
    <View style={[{ borderRadius: radius, boxShadow: shadow.card, zIndex: 0 }, style]}>
      {/* zIndex keeps the frosted layer behind every child, including inputs and icons on web. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden', zIndex: -1 }]}>
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: strong ? colors.glassStrong : colors.glass, borderRadius: radius, borderWidth: 1, borderColor: colors.glassBorder }]} />
      </View>
      {children}
    </View>
  );
}

/* ───────── Buttons ───────── */
type BtnProps = Omit<PressableProps, 'style'> & { title: string; icon?: IconName; variant?: 'dark' | 'soft' | 'ghost'; style?: StyleProp<ViewStyle>; busy?: boolean; small?: boolean };
export function Button({ title, icon, variant = 'dark', style, busy, small, disabled, ...rest }: BtnProps) {
  const dark = variant === 'dark';
  const fg = dark ? colors.white : variant === 'ghost' ? colors.accent : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      {...rest}
      style={({ pressed }) => [
        styles.btn,
        small && { height: 36, paddingHorizontal: 14 },
        { backgroundColor: dark ? colors.ink : variant === 'soft' ? colors.tintSoft : 'transparent', opacity: pressed || disabled ? 0.6 : 1 },
        dark && { boxShadow: shadow.button },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Icon name={icon} size={small ? 16 : 18} color={fg} strokeWidth={2} />}
          <T w="semibold" size={small ? 13 : 15} color={fg}>{title}</T>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color, fill, size = 44 }: { icon: IconName; label: string; onPress?: () => void; color?: string; fill?: string; size?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <Glass radius={size / 2} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 6px 16px rgba(40,25,70,0.08)' }}>
        <Icon name={icon} size={20} color={color} fill={fill} strokeWidth={2} />
      </Glass>
    </Pressable>
  );
}

/* ───────── Chips ───────── */
export function Chip({ label, dot, selected, onPress }: { label: string; dot?: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? { backgroundColor: colors.ink, borderColor: colors.ink } : { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
    >
      {dot && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selected && dot === colors.ink ? colors.white : dot }} />}
      <T w="semibold" size={14} color={selected ? colors.white : colors.ink}>{label}</T>
    </Pressable>
  );
}

/* ───────── Photos & avatars ───────── */
export function Photo({ uri, category, height, radius = 20, style }: { uri?: string | null; category?: Category; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const bg = category ? categoryStyle[category].pastel : '#FBE8A2';
  return (
    <View style={[{ height, borderRadius: radius, backgroundColor: bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Icon name="camera" size={Math.min(34, height / 3)} color={colors.ink2} strokeWidth={1.5} />}
    </View>
  );
}

const AVATAR_COLORS = ['#FFC7D6', '#DCD1FF', '#B8EBD5', '#FFD7B5', '#C3DEFF', '#FBE8A2'];
export function Avatar({ name, uri, size = 36 }: { name: string; uri?: string | null; size?: number }) {
  const bg = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} /> : <T w="bold" size={size * 0.38}>{(name || '?').charAt(0).toUpperCase()}</T>}
    </View>
  );
}

/* ───────── Floating bars ───────── */
/** Positions content as a floating bar, centered and capped in width on big screens. */
export function Floating({ children, top, bottom }: { children: ReactNode; top?: number; bottom?: number }) {
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top, bottom, paddingHorizontal: 16, alignItems: 'center' }}>
      <View pointerEvents="box-none" style={{ width: '100%', maxWidth: 528 }}>{children}</View>
    </View>
  );
}

/* ───────── Inputs ───────── */
export const Input = (props: TextInputProps) => (
  <TextInput placeholderTextColor={colors.ink3} {...props} style={[styles.input, props.style]} />
);

/* ───────── Grouped list rows ───────── */
export function Row({ children, last, onPress, style }: { children: ReactNode; last?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const content = <View style={[styles.row, !last && styles.rowBorder, style]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button">{content}</Pressable> : content;
}

export function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={() => onChange(!value)}
      style={{ width: 52, height: 32, borderRadius: 16, padding: 2, backgroundColor: value ? colors.ink : 'rgba(20,17,26,0.16)', alignItems: value ? 'flex-end' : 'flex-start' }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, boxShadow: '0px 2px 6px rgba(0,0,0,0.2)' }} />
    </Pressable>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Glass style={{ padding: 22, alignItems: 'center', gap: 6 }}>
      <T w="bold" size={17}>{title}</T>
      <T size={14} color={colors.ink2} style={{ textAlign: 'center' }}>{body}</T>
      {action && <View style={{ marginTop: 8 }}>{action}</View>}
    </Glass>
  );
}

export const Loading = () => <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />;

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.85 },
  btn: { height: 52, borderRadius: 26, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  input: { minHeight: 48, borderRadius: 16, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: colors.hairline, fontFamily: font.medium, fontSize: 15, color: colors.ink },
  row: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(20,17,26,0.07)' },
});
