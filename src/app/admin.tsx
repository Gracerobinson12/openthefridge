import { router } from 'expo-router';
import { View } from 'react-native';
import { timeAgo } from '../components/RecipePost';
import { Screen } from '../components/Screen';
import { Button, Empty, Glass, IconButton, Loading, T } from '../components/ui';
import { confirm, notify } from '../lib/dialog';
import { useApp, useData } from '../lib/store';
import { colors } from '../lib/theme';
import type { Report } from '../lib/types';

/** Admin-only: open reports, with one-tap actions. Apple expects reports handled within 24 hours. */
export default function Admin() {
  const { api, me } = useApp();
  const { data, loading, reload } = useData((a) => (me?.is_admin ? a.reports() : Promise.resolve([] as Report[])), [me?.is_admin]);

  async function act(fn: () => Promise<void>, done: string) {
    try {
      await fn();
      reload();
      notify(done);
    } catch (e) {
      notify('Something went wrong', (e as Error).message);
    }
  }

  if (!me?.is_admin) {
    return (
      <Screen glow="violet" bottomSpace={40}>
        <IconButton icon="back" label="Back" onPress={() => router.back()} />
        <Empty title="Admins only" body="This page is for moderators." />
      </Screen>
    );
  }

  return (
    <Screen glow="violet" bottomSpace={40}>
      <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
      <View style={{ gap: 4 }}>
        <T w="heavy" size={30} accessibilityRole="header">Moderation</T>
        <T size={14} color={colors.ink2}>Open reports. Handle each within 24 hours.</T>
      </View>
      {loading && !data ? <Loading /> : null}
      {data?.length === 0 ? <Empty title="All clear" body="No open reports right now." /> : null}
      {data?.map((r) => (
        <Glass key={r.id} radius={22} style={{ padding: 14, gap: 10 }}>
          <View style={{ gap: 2 }}>
            <T w="bold" size={15}>{r.reason}</T>
            <T size={12} color={colors.ink3}>
              {timeAgo(r.created_at)} ago · about @{r.reported_user?.username ?? 'unknown'}{r.reported_user?.banned ? ' (banned)' : ''}
            </T>
          </View>
          {r.comment ? (
            <View style={{ padding: 10, borderRadius: 12, backgroundColor: colors.tintSoft }}>
              <T size={12} w="bold" color={colors.ink2}>COMMENT</T>
              <T size={14}>{r.comment.body}</T>
            </View>
          ) : r.recipe ? (
            <View style={{ padding: 10, borderRadius: 12, backgroundColor: colors.tintSoft }}>
              <T size={12} w="bold" color={colors.ink2}>RECIPE{r.recipe.is_hidden ? ' · HIDDEN' : ''}</T>
              <T size={14}>{r.recipe.title}</T>
            </View>
          ) : (
            <T size={13} color={colors.ink3}>The reported content was already deleted.</T>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {r.recipe && !r.comment ? <Button small variant="soft" title="View" onPress={() => router.push(`/recipe/${r.recipe!.id}`)} /> : null}
            {r.comment ? (
              <Button small title="Delete comment" onPress={() => act(async () => { await api.deleteComment(r.comment!.id); await api.resolveReport(r.id); }, 'Comment deleted')} />
            ) : r.recipe ? (
              <>
                <Button small title="Delete recipe" onPress={async () => {
                  if (await confirm('Delete this recipe?', 'It will be removed for everyone.', 'Delete')) {
                    act(async () => { await api.deleteRecipe(r.recipe!.id); await api.resolveReport(r.id); }, 'Recipe deleted');
                  }
                }} />
                {r.recipe.is_hidden ? (
                  <Button small variant="soft" title="Unhide" onPress={() => act(() => api.setRecipeHidden(r.recipe!.id, false), 'Recipe visible again')} />
                ) : null}
              </>
            ) : null}
            {r.reported_user && !r.reported_user.banned ? (
              <Button small variant="soft" title="Ban user" onPress={async () => {
                if (await confirm(`Ban @${r.reported_user!.username}?`, 'They will no longer be able to post, comment or create groups.', 'Ban')) {
                  act(async () => { await api.banUser(r.reported_user!.id); await api.resolveReport(r.id); }, 'User banned');
                }
              }} />
            ) : null}
            <Button small variant="ghost" title="Dismiss" onPress={() => act(() => api.resolveReport(r.id), 'Report dismissed')} />
          </View>
        </Glass>
      ))}
    </Screen>
  );
}
