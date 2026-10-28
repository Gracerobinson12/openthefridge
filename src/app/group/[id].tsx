import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Share, View } from 'react-native';
import { RecipePost } from '../../components/RecipePost';
import { Screen } from '../../components/Screen';
import { Button, Empty, Glass, IconButton, Loading, T } from '../../components/ui';
import { notify } from '../../lib/dialog';
import { useData } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: group } = useData((a) => a.group(id), [id]);
  const { data: posts, loading } = useData((a) => a.groupFeed(id), [id]);

  async function invite() {
    if (!group) return;
    const msg = `Join "${group.name}" on Open the Fridge with code ${group.invite_code}`;
    try {
      if (Platform.OS === 'web') { await navigator.clipboard.writeText(msg); notify('Invite copied', msg); }
      else await Share.share({ message: msg });
    } catch { /* cancelled */ }
  }

  return (
    <Screen glow="blue" bottomSpace={40}>
      <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/groups'))} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: group?.color ?? '#C3DEFF', borderWidth: 1, borderColor: colors.glassBorder }} />
        <View style={{ flex: 1 }}>
          <T w="heavy" size={26} numberOfLines={2} accessibilityRole="header">{group?.name ?? ' '}</T>
          <T size={14} color={colors.ink2}>{group ? `${group.member_count} members` : ''}</T>
        </View>
      </View>
      <Glass radius={22} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T w="bold" size={11} color={colors.ink2} style={{ letterSpacing: 0.66 }}>INVITE CODE</T>
          <T w="heavy" size={22} style={{ letterSpacing: 3 }}>{group?.invite_code ?? '······'}</T>
        </View>
        <Button title="Invite" icon="share" small onPress={invite} />
      </Glass>

      {loading && !posts ? <Loading /> : null}
      {posts?.length === 0 ? (
        <Empty title="No recipes shared yet" body="Open any recipe and tap Share to post it here." action={<Button title="Go to my Tin" variant="soft" onPress={() => router.navigate('/tin')} />} />
      ) : null}
      {posts?.map((p) => <RecipePost key={p.recipe.id} recipe={p.recipe} note={p.note ? `“${p.note}” — @${p.shared_by.username}` : null} />)}
    </Screen>
  );
}
