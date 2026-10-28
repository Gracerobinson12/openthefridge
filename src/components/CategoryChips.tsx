import { ScrollView } from 'react-native';
import { CATEGORIES, categoryStyle, colors, type Category } from '../lib/theme';
import { Chip } from './ui';

export type CategoryFilter = Category | 'All';

export function CategoryChips({ value, onChange }: { value: CategoryFilter; onChange: (c: CategoryFilter) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist"
      style={{ marginHorizontal: -20, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      <Chip label="All" dot={colors.ink} selected={value === 'All'} onPress={() => onChange('All')} />
      {CATEGORIES.map((c) => (
        <Chip key={c} label={c} dot={categoryStyle[c].dot} selected={value === c} onPress={() => onChange(c)} />
      ))}
    </ScrollView>
  );
}
