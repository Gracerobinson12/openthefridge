import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useApp } from '../lib/store';
import { categoryStyle, colors } from '../lib/theme';
import type { Recipe } from '../lib/types';
import { Icon } from './Icon';
import { Avatar, Glass, Photo, T } from './ui';

export function timeAgo(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/** A recipe post in the Fridge feed: author, photo, title, like/comment/save. */
export function RecipePost({ recipe, note }: { recipe: Recipe; note?: string | null }) {
  const { api, changed, me } = useApp();
  const mine = recipe.author_id === me?.id;
  const [liked, setLiked] = useState(recipe.liked);
  const [saved, setSaved] = useState(recipe.saved);
  const likes = recipe.like_count - (recipe.liked ? 1 : 0) + (liked ? 1 : 0);
  const open = () => router.push(`/recipe/${recipe.id}`);
  const cat = categoryStyle[recipe.category];

  return (
    <Glass radius={28} style={{ padding: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingBottom: 10, paddingTop: 2 }}>
        <Avatar name={recipe.author.display_name || recipe.author.username} uri={recipe.author.avatar_url} />
        <View style={{ flex: 1 }}>
          <T w="bold" size={14}>{recipe.author.display_name || recipe.author.username}</T>
          <T size={12} color={colors.ink2}>@{recipe.author.username} · {timeAgo(recipe.created_at)}</T>
        </View>
      </View>
      {note ? <T size={14} style={{ paddingHorizontal: 6, paddingBottom: 10 }}>{note}</T> : null}
      <Pressable onPress={open} accessibilityRole="link" accessibilityLabel={`Open ${recipe.title}`}>
        <Photo uri={recipe.photos[0]} category={recipe.category} height={220} />
        <View style={{ position: 'absolute', left: 10, bottom: 10 }}>
          <Glass radius={14} strong style={{ height: 28, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: cat.dot }} />
            <T w="bold" size={12}>{recipe.category}</T>
          </Glass>
        </View>
      </Pressable>
      <Pressable onPress={open} style={{ paddingHorizontal: 6, paddingTop: 12, gap: 2 }}>
        <T w="heavy" size={18}>{recipe.title}</T>
        <T size={13} color={colors.ink2}>{[recipe.total_time, recipe.servings && `Serves ${recipe.servings}`, recipe.source_author && `via ${recipe.source_author}`].filter(Boolean).join(' · ')}</T>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Like" accessibilityState={{ selected: liked }}
          onPress={() => { setLiked(!liked); api.setLiked(recipe.id, !liked).catch(() => setLiked(liked)); }}
          style={{ height: 40, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="heart" size={20} color={liked ? colors.heart : colors.ink} fill={liked ? colors.heartFill : 'none'} strokeWidth={2} />
          <T w="semibold" size={14}>{likes}</T>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Comments" onPress={open} style={{ height: 40, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="comment" size={20} strokeWidth={2} />
          <T w="semibold" size={14}>{recipe.comment_count}</T>
        </Pressable>
        {mine ? null : <Pressable accessibilityRole="button" accessibilityState={{ selected: saved }}
          onPress={() => { setSaved(!saved); api.setSaved(recipe.id, !saved).then(changed).catch(() => setSaved(saved)); }}
          style={{ marginLeft: 'auto', height: 40, paddingHorizontal: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: saved ? colors.tintSoft : colors.ink }}>
          <Icon name="tin" size={17} color={saved ? colors.ink : colors.white} strokeWidth={2} />
          <T w="semibold" size={13} color={saved ? colors.ink : colors.white}>{saved ? 'In your Tin' : 'Save to Tin'}</T>
        </Pressable>}
      </View>
    </Glass>
  );
}
