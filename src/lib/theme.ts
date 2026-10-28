export const colors = {
  bg: '#F6F3FA',
  ink: '#14111A',
  ink2: '#4A4454',
  ink3: '#7A7385',
  accent: '#6A3FD6',
  heart: '#D0346A',
  heartFill: '#FFB3C8',
  hairline: 'rgba(20,17,26,0.08)',
  tintSoft: 'rgba(20,17,26,0.07)',
  glass: 'rgba(255,255,255,0.55)',
  glassStrong: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.9)',
  white: '#FFFFFF',
};

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
};

export const CATEGORIES = ['Desserts', 'Appetizers', 'Breakfast', 'Lunch', 'Party Food'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Pastel tile color and stronger dot color for each category. */
export const categoryStyle: Record<Category, { pastel: string; dot: string }> = {
  Desserts: { pastel: '#FFC7D6', dot: '#F27BA0' },
  Appetizers: { pastel: '#FFD7B5', dot: '#F4A261' },
  Breakfast: { pastel: '#FBE8A2', dot: '#E0B530' },
  Lunch: { pastel: '#C3DEFF', dot: '#5B9BEA' },
  'Party Food': { pastel: '#DCD1FF', dot: '#9B7BF0' },
};

export const GROUP_COLORS = ['#FFC7D6', '#C3DEFF', '#FBE8A2', '#DCD1FF', '#B8EBD5', '#FFD7B5'];

export const shadow = {
  card: '0px 10px 30px rgba(40,25,70,0.08)',
  float: '0px 12px 32px rgba(40,25,70,0.16)',
  button: '0px 6px 16px rgba(20,17,26,0.25)',
};
