import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Backdrop, Button, Floating, Glass, IconButton, Label, Loading, T } from '../../components/ui';
import { notify } from '../../lib/dialog';
import { buildSlides, type Slide } from '../../lib/slides';
import { useApp, useData } from '../../lib/store';
import { colors, font, shadow } from '../../lib/theme';

/** Arrange a recipe as TikTok photo-mode slides. */
export default function Slides() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, me } = useApp();
  const insets = useSafeAreaInsets();
  const { data: recipe, loading } = useData((a) => a.recipe(id), [id]);
  const initial = useMemo(() => (recipe ? buildSlides(recipe) : []), [recipe]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [sel, setSel] = useState(0);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!recipe) return;
    setSlides(initial);
    setCaption(`${recipe.title} ${recipe.total_time ? `· ${recipe.total_time} ` : ''}#recipe #${recipe.category.replace(/\s/g, '').toLowerCase()}`);
  }, [initial, recipe]);

  const back = () => (router.canGoBack() ? router.back() : router.replace(`/recipe/${id}`));
  if (loading && !recipe) return <View style={{ flex: 1, backgroundColor: colors.bg }}><Loading /></View>;
  if (!recipe || !slides.length) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const cur = slides[Math.min(sel, slides.length - 1)];
  function move(d: number) {
    const j = sel + d;
    if (j < 0 || j >= slides.length) return;
    const next = slides.slice();
    [next[sel], next[j]] = [next[j], next[sel]];
    setSlides(next);
    setSel(j);
  }
  function remove() {
    if (slides.length <= 2) return notify('Keep at least 2 slides');
    const next = slides.filter((_, i) => i !== sel);
    setSlides(next);
    setSel(Math.max(0, sel - 1));
  }
  async function saveOrder() {
    setSaving(true);
    try {
      await api.setSlideOrder(id, slides.map((s) => s.id));
      return true;
    } catch (e) {
      notify('Couldn’t save', (e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Backdrop variant="violet" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 130 + insets.bottom, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="back" label="Back" onPress={back} />
          <View style={{ alignItems: 'center' }}>
            <T w="bold" size={17}>Photo Slides</T>
            <T size={12} color={colors.ink2}>Arrange your recipe as photo slides</T>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Preview */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 206, height: 366, borderRadius: 24, backgroundColor: cur.bg, borderWidth: 1, borderColor: colors.white, boxShadow: '0px 18px 40px rgba(40,25,70,0.18)', overflow: 'hidden', padding: 16, paddingTop: 28, gap: 8 }}>
            {cur.isPhoto && cur.photo ? <Image source={{ uri: cur.photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
            {cur.isPhoto && cur.photo ? <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,17,26,0.25)' }]} /> : null}
            <View style={{ position: 'absolute', top: 10, left: 12, right: 12, flexDirection: 'row', gap: 3 }}>
              {slides.map((s, i) => <View key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i === sel ? colors.ink : 'rgba(20,17,26,0.2)' }} />)}
            </View>
            {(() => {
              const onPhoto = cur.isPhoto && !!cur.photo;
              const ink = onPhoto ? colors.white : colors.ink;
              return (
                <>
                  <T w="heavy" size={10} color={onPhoto ? colors.white : colors.ink2} style={{ letterSpacing: 1 }}>{cur.kicker}</T>
                  <T w="heavy" size={20} color={ink}>{cur.title}</T>
                  {cur.isPhoto && !cur.photo ? (
                    <View style={{ flex: 1, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="camera" size={26} color={colors.ink2} strokeWidth={1.5} />
                      <T size={11} color={colors.ink2}>Add a photo to the recipe</T>
                    </View>
                  ) : null}
                  {onPhoto ? <View style={{ flex: 1 }} /> : null}
                  <View style={{ gap: 5 }}>
                    {cur.lines.map((l, i) => <T key={i} size={12} color={ink} style={{ lineHeight: 16 }}>{l}</T>)}
                  </View>
                </>
              );
            })()}
            <View style={{ position: 'absolute', right: 12, bottom: 12, height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: 'rgba(20,17,26,0.75)', justifyContent: 'center' }}>
              <T w="bold" size={11} color={colors.white}>{sel + 1} / {slides.length}</T>
            </View>
          </View>
        </View>

        {/* Thumbnails */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2, paddingVertical: 4, flexGrow: 1, justifyContent: 'center' }}>
          {slides.map((s, i) => (
            <Pressable key={s.id} onPress={() => setSel(i)} accessibilityRole="button" accessibilityLabel={`Slide ${i + 1}: ${s.name}`} accessibilityState={{ selected: i === sel }}
              style={{ width: 50, height: 88, borderRadius: 12, backgroundColor: s.bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: i === sel ? 2.5 : 1, borderColor: i === sel ? colors.ink : colors.white, boxShadow: i === sel ? '0px 8px 18px rgba(40,25,70,0.2)' : '0px 4px 10px rgba(40,25,70,0.08)' }}>
              {s.isPhoto && s.photo ? <Image source={{ uri: s.photo }} style={StyleSheet.absoluteFill} /> : null}
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center' }}>
                <T w="heavy" size={12}>{i + 1}</T>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Reorder controls */}
        <Glass radius={24} style={{ height: 52, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => move(-1)} accessibilityLabel="Move slide earlier" disabled={sel === 0}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.ink, opacity: sel === 0 ? 0.3 : 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="left" size={18} color={colors.white} strokeWidth={2.4} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <T w="semibold" size={14}>{cur.name}</T>
            <Pressable onPress={remove} accessibilityRole="button"><T size={12} color={colors.heart}>Remove slide</T></Pressable>
          </View>
          <Pressable onPress={() => move(1)} accessibilityLabel="Move slide later" disabled={sel === slides.length - 1}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.ink, opacity: sel === slides.length - 1 ? 0.3 : 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="right" size={18} color={colors.white} strokeWidth={2.4} />
          </Pressable>
        </Glass>

        <Label>CAPTION</Label>
        <Glass radius={22} style={{ padding: 14 }}>
          <TextInput value={caption} onChangeText={setCaption} multiline maxLength={2200} accessibilityLabel="Caption"
            style={{ minHeight: 60, fontFamily: font.medium, fontSize: 14, color: colors.ink, textAlignVertical: 'top' }} />
        </Glass>
        <Pressable onPress={() => setSlides(buildSlides({ ...recipe, slide_order: null }))}>
          <T size={13} color={colors.accent} style={{ textAlign: 'center' }}>Reset to default order</T>
        </Pressable>
      </ScrollView>

      <Floating bottom={Math.max(insets.bottom, 18)}>
        <Glass radius={34} strong style={{ height: 68, padding: 8, flexDirection: 'row', gap: 8, boxShadow: shadow.float }}>
          <Button title="Done" variant="soft" style={{ flex: 1, height: 52 }} onPress={back} />
          <Button title="Save slides" style={{ flex: 1.5, height: 52 }} busy={saving} onPress={async () => { if (await saveOrder()) notify('Slides saved', 'Your slide order is saved with this recipe.'); }} />
        </Glass>
      </Floating>
    </View>
  );
}
