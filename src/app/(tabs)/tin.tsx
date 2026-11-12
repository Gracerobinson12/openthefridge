import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { CategoryChips, type CategoryFilter } from '../../components/CategoryChips';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Button, Empty, Glass, Loading, Photo, T } from '../../components/ui';
import { useApp, useData } from '../../lib/store';
import { categoryStyle, colors } from '../../lib/theme';

/** My Recipe Tin: your own recipes plus ones you saved from the Fridge. */
export default function Tin() {
  const { me } = useApp();
  const [cat, setCat] = useState<CategoryFilter>('All');
  const { data, loading } = useData((api) => api.tin(cat), [cat]);
  const top = data?.[0];
  const rest = data?.slice(1) ?? [];

  return (
    <Screen glow="blue">
      <View style={{ gap: 4 }}>
        <T w="heavy" size={34} accessibilityRole="header">My Recipe Tin</T>
        <T size={15} color={colors.ink2}>Your recipes and saves{cat !== 'All' ? ` · ${cat}` : ''}</T>
      </View>
      <Pressable onPress={() => router.push({ pathname: '/add', params: { import: '1' } })} accessibilityRole="button">
        <Glass radius={20} strong style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="link" size={17} color={colors.white} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <T w="bold" size={14}>Save a recipe from a video</T>
            <T size={12} color={colors.ink2}>Paste a TikTok or YouTube link</T>
          </View>
          <Icon name="chevron" size={16} color={colors.ink3} strokeWidth={2.2} />
        </Glass>
      </Pressable>

      {top ? (
        <View style={{ height: 178, marginTop: 6 }}>
          <View style={{ position: 'absolute', top: 0, left: 34, right: 34, height: 140, borderRadius: 26, backgroundColor: 'rgba(220,209,255,0.6)', borderWidth: 1, borderColor: colors.glassBorder }} />
          <View style={{ position: 'absolute', top: 12, left: 16, right: 16, height: 144, borderRadius: 26, backgroundColor: 'rgba(255,214,190,0.6)', borderWidth: 1, borderColor: colors.glassBorder }} />
          <Pressable onPress={() => router.push(`/recipe/${top.id}`)} accessibilityRole="link" style={{ position: 'absolute', top: 26, left: 0, right: 0 }}>
            <Glass radius={28} strong style={{ height: 150, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 14, boxShadow: '0px 16px 36px rgba(40,25,70,0.14)' }}>
              <Photo uri={top.photos[0]} category={top.category} height={124} style={{ width: 124 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <T w="bold" size={11} color={colors.accent} style={{ letterSpacing: 0.66 }}>{top.category.toUpperCase()}</T>
                <T w="heavy" size={20} numberOfLines={2}>{top.title}</T>
                <T size={13} color={colors.ink2}>{top.total_time}{top.author_id !== me?.id ? ` · from @${top.author.username}` : ''}</T>
              </View>
            </Glass>
          </Pressable>
        </View>
      ) : null}

      <CategoryChips value={cat} onChange={setCat} />

      {loading && !data ? <Loading /> : null}
      {data?.length === 0 && !loading ? (
        <Empty title="Your tin is empty" body="Add your own recipe, or tap “Save to Tin” on anything you like in the Fridge."
          action={<Button title="Add a recipe" icon="plus" onPress={() => router.push('/add')} />} />
      ) : null}

      {rest.length ? (
        <Glass radius={24}>
          {rest.map((r, i) => (
            <Pressable key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} accessibilityRole="link"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingRight: 14, borderBottomWidth: i < rest.length - 1 ? 1 : 0, borderBottomColor: 'rgba(20,17,26,0.07)' }}>
              <Photo uri={r.photos[0]} category={r.category} height={54} radius={15} style={{ width: 54 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <T w="bold" size={16} numberOfLines={1}>{r.title}</T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: categoryStyle[r.category].dot }} />
                  <T size={13} color={colors.ink2} numberOfLines={1}>{r.total_time} · {r.author_id === me?.id ? 'My recipe' : `Saved from @${r.author.username}`}</T>
                </View>
              </View>
              <Icon name="chevron" size={16} color={colors.ink3} strokeWidth={2.2} />
            </Pressable>
          ))}
        </Glass>
      ) : null}
    </Screen>
  );
}
