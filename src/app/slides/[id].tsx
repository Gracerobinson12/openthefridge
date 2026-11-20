import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import { Icon } from '../../components/Icon';
import { SlideCard } from '../../components/SlideCard';
import { SlidePreviewModal } from '../../components/SlidePreviewModal';
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
  const [exporting, setExporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const shotRefs = useRef<any[]>([]);

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

  async function saveToPhotos() {
    setExporting(true);
    try {
      if (Platform.OS !== 'web') {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (!perm.granted) {
          notify('Photos access needed', 'Allow access to Photos in Settings, then try again.');
          return;
        }
      }
      for (let i = 0; i < slides.length; i++) {
        const ref = shotRefs.current[i];
        if (!ref?.capture) continue;
        const uri = await ref.capture();
        if (Platform.OS === 'web') {
          const a = document.createElement('a');
          a.href = uri;
          a.download = `slide-${i + 1}.png`;
          a.click();
        } else {
          await MediaLibrary.saveToLibraryAsync(uri);
        }
      }
      notify(
        'Saved!',
        Platform.OS === 'web'
          ? 'Your slides downloaded as images. Upload them to TikTok, in order, to build the slideshow.'
          : 'Saved to your Photos, in order. Open TikTok, start a new post, and pick them from your camera roll.'
      );
    } catch (e) {
      notify('Couldn’t export', (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function exportSlides() {
    if (!(await saveOrder())) return;
    await saveToPhotos();
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
          <Pressable onPress={() => setPreviewOpen(true)} accessibilityRole="button" accessibilityLabel="Preview slides" hitSlop={8} style={{ width: 44, alignItems: 'flex-end' }}>
            <T w="semibold" size={14} color={colors.accent}>Preview</T>
          </Pressable>
        </View>

        {/* Preview */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ borderRadius: 24, boxShadow: '0px 18px 40px rgba(40,25,70,0.18)', overflow: 'hidden' }}>
            <SlideCard slide={cur} index={sel} total={slides.length} />
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

      {/* Hidden full-quality renders, captured for export */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -9999, left: 0, opacity: 0 }}>
        {slides.map((s, i) => (
          <ViewShot key={s.id} ref={(r) => { shotRefs.current[i] = r; }} options={{ format: 'png', quality: 1 }}>
            <SlideCard slide={s} index={i} total={slides.length} />
          </ViewShot>
        ))}
      </View>

      <SlidePreviewModal visible={previewOpen} slides={slides} onClose={() => setPreviewOpen(false)} />

      <Floating bottom={Math.max(insets.bottom, 18)}>
        <Glass radius={34} strong style={{ height: 68, padding: 8, flexDirection: 'row', gap: 8, boxShadow: shadow.float }}>
          <Button title="Done" variant="soft" style={{ flex: 1, height: 52 }} onPress={back} />
          <Button title="Save to Photos" style={{ flex: 1.8, height: 52 }} busy={saving || exporting} onPress={exportSlides} />
        </Glass>
      </Floating>
    </View>
  );
}