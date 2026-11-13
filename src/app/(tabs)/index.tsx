import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { CategoryChips, type CategoryFilter } from '../../components/CategoryChips';
import { DemoBanner } from '../../components/DemoBanner';
import { InstallBanner } from '../../components/InstallBanner';
import { RecipePost } from '../../components/RecipePost';
import { Screen } from '../../components/Screen';
import { Avatar, Button, Empty, Loading, T } from '../../components/ui';
import { useApp, useData } from '../../lib/store';
import { colors } from '../../lib/theme';

/** The Fridge: everyone's recipes, filtered by category. */
export default function Fridge() {
  const { me } = useApp();
  const [cat, setCat] = useState<CategoryFilter>('All');
  const { data, loading, error } = useData((api) => api.feed(cat), [cat]);

  return (
    <Screen glow="pink">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable accessibilityRole="link" accessibilityLabel="Your profile" onPress={() => router.navigate('/profile')}>
          <Avatar name={me?.display_name || me?.username || 'You'} uri={me?.avatar_url} size={44} />
        </Pressable>
      </View>
      <View style={{ gap: 2 }}>
        <T w="semibold" size={14} color="#5B5566">Fresh from the community</T>
        <T w="heavy" size={34} accessibilityRole="header">The Fridge</T>
      </View>
      <InstallBanner />
      <DemoBanner />
      <CategoryChips value={cat} onChange={setCat} />
      {error ? <Empty title="Couldn’t load the Fridge" body={error} /> : null}
      {loading && !data ? <Loading /> : null}
      {data?.length === 0 && !loading ? (
        <Empty
          title={cat === 'All' ? 'The Fridge is empty' : `No ${cat.toLowerCase()} yet`}
          body={cat === 'All' ? 'Be the first to pin a recipe. Add your own, or import one from a TikTok or YouTube video.' : 'Be the first to add one!'}
          action={<Button title="Add your first recipe" icon="plus" onPress={() => router.push('/add')} />}
        />
      ) : null}
      {data?.map((r) => <RecipePost key={r.id} recipe={r} />)}
      <T size={12} color={colors.ink3} style={{ textAlign: 'center' }}>{data?.length ? 'You’re all caught up' : ''}</T>
    </Screen>
  );
}
