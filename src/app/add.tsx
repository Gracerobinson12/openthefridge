import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { ImportCard, platformName } from '../components/ImportCard';
import { Backdrop, Button, Floating, Glass, Label, Switch, T } from '../components/ui';
import { notify } from '../lib/dialog';
import { hasBlockedWord, KIND_MESSAGE } from '../lib/filter';
import { shrinkPhoto } from '../lib/photos';
import { useApp } from '../lib/store';
import { CATEGORIES, categoryStyle, colors, font, shadow, type Category } from '../lib/theme';
import type { ImportedRecipe, Ingredient, VideoSource } from '../lib/types';

const field = { fontFamily: font.medium, fontSize: 15, color: colors.ink, paddingVertical: 0 } as const;

export default function AddRecipe() {
  const { api, changed } = useApp();
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Desserts');
  const [time, setTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ qty: '', name: '' }, { qty: '', name: '' }]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [busy, setBusy] = useState(false);
  const params = useLocalSearchParams<{ import?: string }>();
  const [source, setSource] = useState<VideoSource | null>(null);
  const [partial, setPartial] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [fromNotes, setFromNotes] = useState(false);
  /** Ingredients removed from a notes recipe, so steps that still mention them can be flagged. */
  const [removed, setRemoved] = useState<string[]>([]);
  const [rewriting, setRewriting] = useState(false);

  // Fill the form from a video import or from notes.
  // Video imports stay private by default (someone else's recipe); notes are the person's own, so sharing stays on.
  function applyImport(r: ImportedRecipe, from: 'video' | 'notes') {
    setTitle(r.title);
    setCategory(r.category);
    setTime(r.total_time);
    setServings(r.servings);
    setIngredients(r.ingredients.length ? r.ingredients : [{ qty: '', name: '' }]);
    setSteps(r.steps.length ? r.steps : ['']);
    setSource(r.source);
    setPartial(r.partial);
    setRemoved([]);
    setFromNotes(from === 'notes');
    setIsPublic(from === 'notes');
  }
  function clearImport() {
    if (fromNotes) {
      // "Start over": empty the form.
      setTitle(''); setTime(''); setServings('');
      setIngredients([{ qty: '', name: '' }, { qty: '', name: '' }]);
      setSteps(['']);
    }
    setSource(null); setPartial(false); setFromNotes(false); setRemoved([]); setIsPublic(true);
  }

  const suggestedCount = ingredients.filter((x) => x.suggested).length;
  const keyOf = (name: string) => name.split(',')[0].trim().toLowerCase();
  const keep = (i: number) => setIngredients(ingredients.map((x, j) => (j === i ? { ...x, suggested: false } : x)));
  function removeIngredient(i: number) {
    const gone = ingredients[i];
    setIngredients(ingredients.filter((_, j) => j !== i));
    if (fromNotes && gone.name.trim()) setRemoved([...removed, keyOf(gone.name)]);
  }
  const keepAll = () => setIngredients(ingredients.map((x) => ({ ...x, suggested: false })));
  function removeAllSuggested() {
    setRemoved([...removed, ...ingredients.filter((x) => x.suggested).map((x) => keyOf(x.name))]);
    const rest = ingredients.filter((x) => !x.suggested);
    setIngredients(rest.length ? rest : [{ qty: '', name: '' }]);
  }
  /** Removed ingredients a step still mentions. */
  const mentions = (step: string) => {
    const t = step.toLowerCase();
    return removed.filter((k) => k && (t.includes(k) || (k.endsWith('s') && t.includes(k.slice(0, -1)))));
  };
  const flaggedSteps = steps.filter((st) => mentions(st).length).length;
  async function rewrite() {
    setRewriting(true);
    try {
      const next = await api.rewriteSteps({
        title: title.trim(),
        ingredients: ingredients.filter((x) => x.name.trim()).map((x) => ({ qty: x.qty.trim(), name: x.name.trim() })),
        steps: steps.map((x) => x.trim()).filter(Boolean),
      });
      setSteps(next.length ? next : steps);
      setRemoved([]);
    } catch (e) {
      notify('Couldn’t rewrite the steps', (e as Error).message);
    } finally {
      setRewriting(false);
    }
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace('/tin'));

  async function addPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 8, quality: 0.75 });
    if (res.canceled) return;
    const small = await Promise.all(res.assets.map((a) => shrinkPhoto(a.uri, a.width, a.height)));
    setPhotos([...photos, ...small].slice(0, 8));
  }
  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return notify('Camera access needed', 'Turn on camera access in Settings to take recipe photos.');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.75 });
    if (res.canceled) return;
    const a = res.assets[0];
    setPhotos([...photos, await shrinkPhoto(a.uri, a.width, a.height)].slice(0, 8));
  }

  const setIng = (i: number, patch: Partial<Ingredient>) => setIngredients(ingredients.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setStep = (i: number, v: string) => setSteps(steps.map((x, j) => (j === i ? v : x)));

  async function submit() {
    const clean = {
      title: title.trim(),
      category,
      total_time: time.trim(),
      servings: servings.trim(),
      ingredients: ingredients.filter((x) => x.name.trim()).map((x) => ({ qty: x.qty.trim(), name: x.name.trim() })),
      steps: steps.map((s) => s.trim()).filter(Boolean),
      photos,
      is_public: isPublic,
      ...(source ?? {}),
    };
    if (!clean.title) return notify('Add a name', 'Give your recipe a name first.');
    if (!clean.ingredients.length) return notify('Add ingredients', 'Add at least one ingredient.');
    if (!clean.steps.length) return notify('Add steps', 'Add at least one step.');
    if (hasBlockedWord(clean.title, clean.total_time, clean.servings, JSON.stringify(clean.ingredients), clean.steps.join(' '))) {
      return notify('Let’s keep it kind', KIND_MESSAGE);
    }
    setBusy(true);
    try {
      const id = await api.createRecipe(clean);
      changed();
      router.replace(`/recipe/${id}`);
    } catch (e) {
      notify('Couldn’t save recipe', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Backdrop variant="violet" />
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <Pressable onPress={close} style={{ height: 44, justifyContent: 'center' }} accessibilityRole="button"><T size={16} color={colors.ink2}>Cancel</T></Pressable>
        <T w="bold" size={17}>New Recipe</T>
        <Pressable onPress={submit} disabled={busy} style={{ height: 44, justifyContent: 'center' }} accessibilityRole="button"><T w="bold" size={16} color={colors.accent}>Save</T></Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 + insets.bottom, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <ImportCard source={source} partial={partial} fromNotes={fromNotes} suggestedCount={suggestedCount}
            onImported={applyImport} onClear={clearImport} autoFocus={params.import === '1'} />

          {/* Photos */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            <Pressable onPress={addPhotos} accessibilityRole="button" accessibilityLabel="Add photos from library"
              style={{ width: photos.length ? 120 : 220, height: 150, borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(20,17,26,0.3)', backgroundColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="camera" size={26} strokeWidth={1.7} />
              <T w="semibold" size={14}>{photos.length ? 'Add more' : 'Add photos'}</T>
            </Pressable>
            {Platform.OS !== 'web' ? (
              <Pressable onPress={takePhoto} accessibilityRole="button" accessibilityLabel="Take a photo"
                style={{ width: 90, height: 150, borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(20,17,26,0.3)', backgroundColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                <T w="semibold" size={13}>Camera</T>
              </Pressable>
            ) : null}
            {photos.map((p, i) => (
              <View key={p}>
                <Image source={{ uri: p }} style={{ width: 120, height: 150, borderRadius: 20 }} />
                {i === 0 ? <View style={{ position: 'absolute', left: 8, top: 8, backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}><T w="bold" size={10} color={colors.white}>COVER</T></View> : null}
                <Pressable onPress={() => setPhotos(photos.filter((x) => x !== p))} accessibilityRole="button" accessibilityLabel="Remove photo"
                  style={{ position: 'absolute', right: 6, top: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="close" size={14} strokeWidth={2.6} />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {/* Name + category */}
          <Glass radius={22} style={{ padding: 16, gap: 12 }}>
            <Label>RECIPE NAME</Label>
            <TextInput value={title} onChangeText={setTitle} placeholder="Grandma's Lemon Bars" placeholderTextColor={colors.ink3} accessibilityLabel="Recipe name" maxLength={120}
              style={{ fontFamily: font.heavy, fontSize: 22, color: colors.ink, letterSpacing: -0.5, paddingHorizontal: 6, paddingVertical: 0 }} />
            <View style={{ height: 1, backgroundColor: colors.hairline }} />
            <Label>CATEGORY</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup">
              {CATEGORIES.map((c) => {
                const on = c === category;
                return (
                  <Pressable key={c} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setCategory(c)}
                    style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: on ? colors.ink : 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: on ? colors.ink : colors.hairline }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: categoryStyle[c].dot }} />
                    <T w="semibold" size={13} color={on ? colors.white : colors.ink}>{c}</T>
                  </Pressable>
                );
              })}
            </View>
          </Glass>

          {/* Time + servings */}
          <Glass radius={22}>
            <View style={{ minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(20,17,26,0.07)' }}>
              <T w="semibold" size={15} style={{ flex: 1 }}>Total time</T>
              <TextInput value={time} onChangeText={setTime} placeholder="45 min" placeholderTextColor={colors.ink3} accessibilityLabel="Total time" style={[field, { textAlign: 'right', minWidth: 110 }]} />
            </View>
            <View style={{ minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
              <T w="semibold" size={15} style={{ flex: 1 }}>Servings</T>
              <TextInput value={servings} onChangeText={setServings} placeholder="16" placeholderTextColor={colors.ink3} accessibilityLabel="Servings" style={[field, { textAlign: 'right', minWidth: 110 }]} />
            </View>
          </Glass>

          {/* Ingredients */}
          <Label>INGREDIENTS</Label>
          {suggestedCount > 0 ? (
            <Glass radius={18} strong style={{ padding: 12, gap: 10 }}>
              <T size={13} color={colors.ink2}>
                <T w="bold" size={13}>{suggestedCount} suggested</T> to complete the dish. They weren’t in your notes.
              </T>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button small title="Keep all" style={{ flex: 1 }} onPress={keepAll} />
                <Button small variant="soft" title="Remove all" style={{ flex: 1 }} onPress={removeAllSuggested} />
              </View>
            </Glass>
          ) : null}
          <Glass radius={22}>
            {ingredients.map((it, i) => (
              <View key={i} style={{ paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(20,17,26,0.07)', backgroundColor: it.suggested ? 'rgba(106,63,214,0.06)' : 'transparent' }}>
                <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TextInput value={it.qty} onChangeText={(v) => setIng(i, { qty: v, qty_guessed: false })} placeholder="Amount" placeholderTextColor={colors.ink3} accessibilityLabel={`Amount ${i + 1}`} style={[field, { width: 76, fontFamily: font.bold }]} />
                  <TextInput value={it.name} onChangeText={(v) => setIng(i, { name: v })} placeholder="Ingredient" placeholderTextColor={colors.ink3} accessibilityLabel={`Ingredient ${i + 1}`} style={[field, { flex: 1 }]} />
                  {ingredients.length > 1 && !it.suggested ? (
                    <Pressable onPress={() => removeIngredient(i)} accessibilityLabel={`Remove ingredient ${i + 1}`} hitSlop={10}>
                      <Icon name="close" size={14} color={colors.ink3} strokeWidth={2.4} />
                    </Pressable>
                  ) : null}
                </View>
                {it.suggested ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
                    <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: colors.accent, justifyContent: 'center' }}>
                      <T w="bold" size={11} color={colors.white}>SUGGESTED</T>
                    </View>
                    <T size={12} color={colors.ink2} style={{ flex: 1 }}>Not in your notes</T>
                    <Button small title="Keep" onPress={() => keep(i)} style={{ height: 32 }} accessibilityLabel={`Keep ${it.name}`} />
                    <Button small variant="soft" title="Remove" onPress={() => removeIngredient(i)} style={{ height: 32 }} accessibilityLabel={`Remove ${it.name}`} />
                  </View>
                ) : it.qty_guessed ? (
                  <T size={11} color={colors.accent} style={{ paddingBottom: 8, marginTop: -6 }}>Amount guessed. Check it.</T>
                ) : null}
              </View>
            ))}
            <Pressable onPress={() => setIngredients([...ingredients, { qty: '', name: '' }])} style={{ minHeight: 50, paddingHorizontal: 16, justifyContent: 'center' }} accessibilityRole="button">
              <T w="semibold" size={15} color={colors.accent}>+ Add ingredient</T>
            </Pressable>
          </Glass>

          {/* Steps */}
          <Label>STEPS</Label>
          {flaggedSteps > 0 ? (
            <Glass radius={18} strong style={{ padding: 12, gap: 10 }}>
              <T size={13} color={colors.ink2}>
                <T w="bold" size={13} color={colors.heart}>{flaggedSteps} {flaggedSteps === 1 ? 'step still mentions' : 'steps still mention'}</T> an ingredient you removed. Edit them, or let us rewrite the steps to match your ingredients.
              </T>
              <Button small title="Rewrite the steps for me" onPress={rewrite} busy={rewriting} />
            </Glass>
          ) : null}
          <Glass radius={22}>
            {steps.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(20,17,26,0.07)' }}>
                <View style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <T w="bold" size={13} color={colors.white}>{i + 1}</T>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput value={s} onChangeText={(v) => setStep(i, v)} multiline placeholder={i === 0 ? 'Heat oven to 350°F…' : 'Next step…'} placeholderTextColor={colors.ink3} accessibilityLabel={`Step ${i + 1}`}
                    style={[field, { minHeight: 44, paddingTop: 3, textAlignVertical: 'top' }]} />
                  {mentions(s).length ? <T size={12} color={colors.heart}>Mentions {mentions(s).join(', ')}, which you removed.</T> : null}
                </View>
                {steps.length > 1 ? (
                  <Pressable onPress={() => setSteps(steps.filter((_, j) => j !== i))} accessibilityLabel={`Remove step ${i + 1}`} hitSlop={10} style={{ paddingTop: 5 }}>
                    <Icon name="close" size={14} color={colors.ink3} strokeWidth={2.4} />
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Pressable onPress={() => setSteps([...steps, ''])} style={{ minHeight: 50, paddingHorizontal: 16, justifyContent: 'center' }} accessibilityRole="button">
              <T w="semibold" size={15} color={colors.accent}>+ Add step</T>
            </Pressable>
          </Glass>
          {/* Who can see it */}
          <Glass radius={22}>
            <View style={{ minHeight: 64, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T w="semibold" size={15}>Share on the Fridge</T>
                <T size={12} color={colors.ink2}>
                  {isPublic
                    ? source ? `Everyone can see it, credited to ${source.source_author} on ${platformName(source.source_platform)}.` : 'Everyone can see it on the Fridge.'
                    : 'Only in your Tin (and groups you share it to).'}
                </T>
              </View>
              <Switch value={isPublic} onChange={setIsPublic} label="Share on the Fridge" />
            </View>
          </Glass>
        </ScrollView>
      </KeyboardAvoidingView>

      <Floating bottom={Math.max(insets.bottom, 18)}>
        <Glass radius={34} strong style={{ height: 68, padding: 8, flexDirection: 'row', gap: 8, boxShadow: shadow.float }}>
          <Button title="Cancel" variant="soft" style={{ flex: 1, height: 52 }} onPress={close} />
          <Button title="Add to Tin" style={{ flex: 1.6, height: 52 }} onPress={submit} busy={busy} />
        </Glass>
      </Floating>
    </View>
  );
}
