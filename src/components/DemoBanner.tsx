import { useApp } from '../lib/store';
import { colors } from '../lib/theme';
import { Glass, T } from './ui';

/** Reminds testers that nothing is shared yet while running without Supabase. */
export function DemoBanner() {
  const { api } = useApp();
  if (api.mode !== 'demo') return null;
  return (
    <Glass radius={18} strong style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
      <T w="semibold" size={13}>Demo mode</T>
      <T size={12} color={colors.ink2}>Sample data, saved only on this device. Connect Supabase to go live.</T>
    </Glass>
  );
}
