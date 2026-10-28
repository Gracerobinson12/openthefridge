import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../lib/theme';

export type IconName =
  | 'fridge' | 'tin' | 'plus' | 'groups' | 'profile' | 'search' | 'bell' | 'back' | 'chevron' | 'heart'
  | 'comment' | 'share' | 'music' | 'pin' | 'camera' | 'close' | 'link' | 'left' | 'right' | 'more' | 'check'
  | 'settings' | 'trash';

type Props = { name: IconName; size?: number; color?: string; fill?: string; strokeWidth?: number };

export function Icon({ name, size = 22, color = colors.ink, fill = 'none', strokeWidth = 1.9 }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'fridge' && (<><Rect x={6} y={3} width={12} height={18} rx={2.5} {...p} /><Line x1={6} y1={10} x2={18} y2={10} {...p} /><Line x1={9} y1={6} x2={9} y2={8} {...p} /><Line x1={9} y1={13} x2={9} y2={16} {...p} /></>)}
      {name === 'tin' && (<><Rect x={3} y={9} width={18} height={11} rx={2.5} {...p} /><Path d="M2 9h20l-1.2-3.2H3.2z" {...p} /></>)}
      {name === 'plus' && (<><Line x1={12} y1={5} x2={12} y2={19} {...p} /><Line x1={5} y1={12} x2={19} y2={12} {...p} /></>)}
      {name === 'groups' && (<><Circle cx={9} cy={9} r={3} {...p} /><Circle cx={17} cy={10} r={2.5} {...p} /><Path d="M3 20c0-3 3-5 6-5s6 2 6 5" {...p} /><Path d="M15.5 15.5c3 0 5.5 1.5 5.5 4.5" {...p} /></>)}
      {name === 'profile' && (<><Circle cx={12} cy={8} r={4} {...p} /><Path d="M4 21c0-4 4-6 8-6s8 2 8 6" {...p} /></>)}
      {name === 'search' && (<><Circle cx={11} cy={11} r={7} {...p} /><Line x1={16.5} y1={16.5} x2={21} y2={21} {...p} /></>)}
      {name === 'bell' && (<><Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" {...p} /><Path d="M10 20a2 2 0 0 0 4 0" {...p} /></>)}
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'left' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'chevron' && <Path d="M9 5l7 7-7 7" {...p} />}
      {name === 'right' && <Path d="M9 5l7 7-7 7" {...p} />}
      {name === 'heart' && <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" {...p} fill={fill} />}
      {name === 'comment' && <Path d="M4 5h16v11H9l-5 4z" {...p} />}
      {name === 'share' && (<><Path d="M12 15V3" {...p} /><Path d="M7 8l5-5 5 5" {...p} /><Path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" {...p} /></>)}
      {name === 'music' && (<><Path d="M9 18V5l11-2v13" {...p} /><Circle cx={6} cy={18} r={3} {...p} /><Circle cx={17} cy={16} r={3} {...p} /></>)}
      {name === 'pin' && (<><Circle cx={12} cy={9} r={5} {...p} /><Line x1={12} y1={14} x2={12} y2={21} {...p} /></>)}
      {name === 'camera' && (<><Rect x={3} y={6} width={18} height={14} rx={3} {...p} /><Circle cx={12} cy={13} r={3.5} {...p} /><Path d="M8 6l1.5-2h5L16 6" {...p} /></>)}
      {name === 'close' && (<><Line x1={6} y1={6} x2={18} y2={18} {...p} /><Line x1={18} y1={6} x2={6} y2={18} {...p} /></>)}
      {name === 'link' && (<><Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" {...p} /><Path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...p} /></>)}
      {name === 'more' && (<><Circle cx={5} cy={12} r={1.2} {...p} /><Circle cx={12} cy={12} r={1.2} {...p} /><Circle cx={19} cy={12} r={1.2} {...p} /></>)}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7" {...p} />}
      {name === 'settings' && (<><Circle cx={12} cy={12} r={3} {...p} /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" {...p} /></>)}
      {name === 'trash' && (<><Path d="M4 7h16" {...p} /><Path d="M9 7V4h6v3" {...p} /><Path d="M6 7l1 13h10l1-13" {...p} /></>)}
    </Svg>
  );
}
