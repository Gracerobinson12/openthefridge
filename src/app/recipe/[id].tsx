import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { platformName } from '../../components/ImportCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { timeAgo } from '../../components/RecipePost';
import { Avatar, Button, Floating, Glass, IconButton, Input, Loading, Photo, T } from '../../components/ui';
import { REPORT_REASONS, useActionSheet } from '../../components/ActionSheet';
import { confirm, notify } from '../../lib/dialog';
import { hasBlockedWord, KIND_MESSAGE } from '../../lib/filter';
import type { Comment } from '../../lib/types';
import { useApp, useData } from '../../lib/store';
import { categoryStyle, colors, shadow } from '../../lib/theme';

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, me, changed } = useApp();
  const sheet = useActionSheet();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data: recipe, loading } = useData((a) => a.recipe(id), [id]);
  const { data: comments, reload: reloadComments } = useData((a) => a.comments(id), [id]);
  const [tab, setTab] = useState<'ing' | 'steps' | 'comments'>('ing');
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comment, setComment] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);

  const mine = recipe && recipe.author_id === me?.id;
  useEffect(() => {
    if (!recipe) return;
    setSaved(recipe.saved);
    setLiked(recipe.liked);
    if (!mine) api.isFollowing(recipe.author_id).then(setFollowing).catch(() => {});
  }, [recipe, mine, api]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (loading && !recipe) return <View style={{ flex: 1, backgroundColor: colors.bg }}><Loading /></View>;
  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: insets.top + 60, gap: 12 }}>
        <T w="heavy" size={24}>Recipe not found</T>
        <Button title="Back to the Fridge" onPress={() => router.replace('/')} />
      </View>
    );
  }

  async function more() {
    if (!recipe) return;
    if (mine) {
      const i = await sheet('Recipe options', [{ label: 'Delete recipe', destructive: true }]);
      if (i === 0 && (await confirm('Delete this recipe?', 'This can’t be undone.', 'Delete'))) {
        await api.deleteRecipe(recipe.id);
        changed();
        back();
      }
      return;
    }
    const i = await sheet(recipe.title, [{ label: 'Report recipe', destructive: true }, { label: `Block @${recipe.author.username}`, destructive: true }]);
    if (i === 0) {
      const r = await sheet('Why are you reporting this?', REPORT_REASONS.map((label) => ({ label })));
      if (r < 0) return;
      await api.report({ recipeId: recipe.id, reportedUserId: recipe.author_id, reason: REPORT_REASONS[r] }).catch(() => {});
      notify('Thanks for reporting', 'We review reports within 24 hours. Recipes reported by several people are hidden right away.');
    } else if (i === 1 && (await confirm(`Block @${recipe.author.username}?`, 'You won’t see their recipes on your Fridge anymore.', 'Block'))) {
      await api.block(recipe.author_id);
      changed();
      back();
    }
  }

  async function commentMenu(c: Comment) {
    const own = c.author.id === me?.id;
    const canDelete = own || mine || me?.is_admin;
    const opts = [...(canDelete ? [{ label: 'Delete comment', destructive: true }] : []), ...(!own ? [{ label: 'Report comment', destructive: true }, { label: `Block @${c.author.username}`, destructive: true }] : [])];
    const i = await sheet('Comment', opts);
    if (i < 0) return;
    const pick = opts[i].label;
    if (pick === 'Delete comment') {
      await api.deleteComment(c.id).catch((e) => notify('Couldn’t delete', e.message));
      reloadComments();
    } else if (pick === 'Report comment') {
      const r = await sheet('Why are you reporting this?', REPORT_REASONS.map((label) => ({ label })));
      if (r < 0) return;
      await api.report({ commentId: c.id, recipeId: id, reportedUserId: c.author.id, reason: REPORT_REASONS[r] }).catch(() => {});
      notify('Thanks for reporting', 'We review reports within 24 hours.');
    } else if (await confirm(`Block @${c.author.username}?`, 'You won’t see their recipes or comments anymore.', 'Block')) {
      await api.block(c.author.id);
      changed();
    }
  }

  async function sendComment() {
    const body = comment.trim();
    if (!body) return;
    if (hasBlockedWord(body)) return notify('Let’s keep it kind', KIND_MESSAGE);
    setComment('');
    await api.addComment(id, body).catch((e) => notify('Couldn’t post comment', e.message));
    reloadComments();
  }

  const photoH = 340;
  const pageW = Math.min(width, 560);
  const name = recipe.author.display_name || recipe.author.username;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 + insets.bottom, maxWidth: 560, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ height: photoH }}>
          {recipe.photos.length > 1 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onScroll={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / pageW))} scrollEventThrottle={32}>
              {recipe.photos.map((p) => <Photo key={p} uri={p} category={recipe.category} height={photoH} radius={0} style={{ width: pageW }} />)}
            </ScrollView>
          ) : (
            <Photo uri={recipe.photos[0]} category={recipe.category} height={photoH} radius={0} />
          )}
          {recipe.photos.length > 1 ? (
            <View style={{ position: 'absolute', bottom: 56, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
              {recipe.photos.map((p, i) => <View key={p} style={{ width: i === photoIndex ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === photoIndex ? colors.ink : 'rgba(255,255,255,0.8)' }} />)}
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: -44, borderTopLeftRadius: 34, borderTopRightRadius: 34, backgroundColor: 'rgba(250,248,253,0.97)', borderTopWidth: 1, borderColor: colors.white, padding: 20, paddingTop: 22, gap: 14, boxShadow: '0px -10px 30px rgba(40,25,70,0.08)' }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: categoryStyle[recipe.category]?.pastel ?? '#FFC7D6', justifyContent: 'center' }}>
              <T w="bold" size={12}>{recipe.category}</T>
            </View>
          </View>
          <T w="heavy" size={30} accessibilityRole="header">{recipe.title}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Avatar name={name} uri={recipe.author.avatar_url} size={28} />
            <T size={13} color={colors.ink2} style={{ flex: 1 }}>
              <T w="bold" size={13}>{mine ? 'You' : name}</T> · @{recipe.author.username} · {timeAgo(recipe.created_at)}
            </T>
            {!mine ? (
              <Button small title={following ? 'Following' : 'Follow'} variant={following ? 'soft' : 'dark'}
                onPress={() => { setFollowing(!following); api.setFollowing(recipe.author_id, !following).catch(() => setFollowing(following)); }} />
            ) : null}
          </View>

          {recipe.source_url ? (
            <Pressable onPress={() => Linking.openURL(recipe.source_url!)} accessibilityRole="link" accessibilityLabel={`Watch the original video by ${recipe.source_author}`}>
              <Glass radius={18} strong style={{ padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.ink, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  {recipe.source_thumbnail ? <Image source={{ uri: recipe.source_thumbnail }} style={{ width: 48, height: 48 }} /> : <Icon name="music" size={20} color={colors.white} strokeWidth={2} />}
                </View>
                <View style={{ flex: 1 }}>
                  <T w="bold" size={14} numberOfLines={1}>Recipe by {recipe.source_author}</T>
                  <T size={12} color={colors.ink2}>Watch the original on {platformName(recipe.source_platform)}</T>
                </View>
                <Icon name="chevron" size={16} color={colors.ink3} strokeWidth={2.2} />
              </Glass>
            </Pressable>
          ) : null}

          <Glass radius={18} strong style={{ flexDirection: 'row', paddingVertical: 10 }}>
            {[[recipe.total_time || '–', 'TOTAL'], [recipe.servings || '–', 'SERVES'], [String(recipe.ingredients.length), 'INGREDIENTS']].map(([v, l], i) => (
              <View key={l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderLeftColor: colors.hairline }}>
                <T w="heavy" size={17}>{v}</T>
                <T w="semibold" size={11} color={colors.ink2} style={{ letterSpacing: 0.44 }}>{l}</T>
              </View>
            ))}
          </Glass>

          <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: 'rgba(20,17,26,0.06)', borderRadius: 13, padding: 3 }}>
            {([['ing', 'Ingredients'], ['steps', 'Steps'], ['comments', `Comments${comments?.length ? ` ${comments.length}` : ''}`]] as const).map(([k, l]) => (
              <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => setTab(k)}
                style={{ flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === k ? colors.white : 'transparent', boxShadow: tab === k ? '0px 2px 8px rgba(40,25,70,0.12)' : undefined }}>
                <T w="semibold" size={14}>{l}</T>
              </Pressable>
            ))}
          </View>

          {tab === 'ing' && recipe.ingredients.map((it, i) => (
            <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: !!checked[i] }} onPress={() => setChecked({ ...checked, [i]: !checked[i] })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, borderBottomWidth: 1, borderBottomColor: 'rgba(20,17,26,0.07)' }}>
              <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: checked[i] ? 0 : 1.5, borderColor: 'rgba(20,17,26,0.3)', backgroundColor: checked[i] ? colors.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {checked[i] ? <Icon name="check" size={14} color={colors.white} strokeWidth={3.2} /> : null}
              </View>
              <T size={15} style={{ flex: 1, textDecorationLine: checked[i] ? 'line-through' : 'none' }} color={checked[i] ? colors.ink3 : colors.ink}>{it.name}</T>
              <T w="bold" size={15}>{it.qty}</T>
            </Pressable>
          ))}

          {tab === 'steps' && recipe.steps.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                <T w="bold" size={13} color={colors.white}>{i + 1}</T>
              </View>
              <T size={15} style={{ flex: 1, lineHeight: 22, paddingTop: 2 }}>{s}</T>
            </View>
          ))}

          {tab === 'comments' && (
            <View style={{ gap: 12 }}>
              {(comments ?? []).map((c) => (
                <View key={c.id} style={{ flexDirection: 'row', gap: 10 }}>
                  <Avatar name={c.author.display_name || c.author.username} uri={c.author.avatar_url} size={30} />
                  <View style={{ flex: 1 }}>
                    <T w="bold" size={13}>@{c.author.username} <T size={12} color={colors.ink3}>{timeAgo(c.created_at)}</T></T>
                    <T size={14}>{c.body}</T>
                  </View>
                  <Pressable onPress={() => commentMenu(c)} accessibilityRole="button" accessibilityLabel="Comment options" hitSlop={8} style={{ padding: 4 }}>
                    <Icon name="more" size={18} color={colors.ink3} />
                  </Pressable>
                </View>
              ))}
              {comments?.length === 0 ? <T size={14} color={colors.ink2}>No comments yet. Say something nice!</T> : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Input value={comment} onChangeText={setComment} placeholder="Add a comment…" accessibilityLabel="Add a comment" style={{ flex: 1 }} onSubmitEditing={sendComment} maxLength={1000} />
                <Button title="Post" small onPress={sendComment} style={{ height: 48 }} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Floating top={insets.top + 12}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} pointerEvents="box-none">
        <IconButton icon="back" label="Back" onPress={back} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon="heart" label={liked ? 'Unlike' : 'Like'} color={liked ? colors.heart : colors.ink} fill={liked ? colors.heartFill : 'none'}
            onPress={() => { setLiked(!liked); api.setLiked(recipe.id, !liked).catch(() => setLiked(liked)); }} />
          <IconButton icon="more" label="More options" onPress={more} />
        </View>
      </View>
      </Floating>

      <Floating bottom={Math.max(insets.bottom, 18)}>
        <Glass radius={34} strong style={{ height: 68, padding: 8, flexDirection: 'row', gap: 8, boxShadow: shadow.float }}>
          <Button title="Share" icon="share" style={{ flex: 1, height: 52 }} onPress={() => router.push(`/share/${recipe.id}`)} />
          {mine ? (
            <Button title="TikTok slides" icon="music" variant="soft" style={{ flex: 1, height: 52 }} onPress={() => router.push(`/slides/${recipe.id}`)} />
          ) : (
            <Button title={saved ? 'In your Tin' : 'Save to Tin'} icon="tin" variant="soft" style={{ flex: 1, height: 52 }}
              onPress={() => { setSaved(!saved); api.setSaved(recipe.id, !saved).then(changed).catch(() => setSaved(saved)); }} />
          )}
        </Glass>
      </Floating>
    </View>
  );
}
