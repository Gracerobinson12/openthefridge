import { categoryStyle } from './theme';
import type { Recipe } from './types';

export type Slide = {
  id: string;
  name: string;
  kicker: string;
  title: string;
  photo: string | null;
  isPhoto: boolean;
  lines: string[];
  bg: string;
};

const chunk = <T,>(list: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

/** Builds TikTok photo-mode slides from a recipe, in the saved order if there is one. */
export function buildSlides(r: Recipe): Slide[] {
  const pastel = categoryStyle[r.category]?.pastel ?? '#FBE8A2';
  const meta = [r.total_time, r.servings && `Serves ${r.servings}`].filter(Boolean).join(' · ');
  const slides: Slide[] = [
    { id: 'cover', name: 'Cover', kicker: 'NEW RECIPE', title: r.title, photo: r.photos[0] ?? null, isPhoto: true, lines: meta ? [meta] : [], bg: pastel },
  ];
  chunk(r.ingredients, 8).forEach((part, i, all) =>
    slides.push({
      id: `ing-${i}`,
      name: all.length > 1 ? `Ingredients ${i + 1}` : 'Ingredients',
      kicker: "YOU'LL NEED",
      title: 'Ingredients',
      photo: null,
      isPhoto: false,
      lines: part.map((x) => [x.qty, x.name].filter(Boolean).join(' ')),
      bg: '#FFFFFF',
    }),
  );
  const stepColors = ['#DCD1FF', '#C3DEFF', '#B8EBD5', '#FFD7B5'];
  chunk(r.steps.map((s, i) => ({ s, n: i + 1 })), 3).forEach((part, i) => {
    const first = part[0].n;
    const last = part[part.length - 1].n;
    slides.push({
      id: `steps-${i}`,
      name: `Steps ${first}–${last}`,
      kicker: first === last ? `STEP ${first}` : `STEPS ${first}–${last}`,
      title: i === 0 ? 'Let’s cook' : 'Keep going',
      photo: null,
      isPhoto: false,
      lines: part.map((x) => `${x.n}. ${x.s}`),
      bg: stepColors[i % stepColors.length],
    });
  });
  slides.push({
    id: 'final',
    name: 'Final photo',
    kicker: 'THE RESULT',
    title: 'Ready to share',
    photo: r.photos[r.photos.length - 1] ?? null,
    isPhoto: true,
    lines: ['Full recipe on Open the Fridge'],
    bg: '#FFC7D6',
  });

  if (!r.slide_order?.length) return slides;
  const byId = new Map(slides.map((s) => [s.id, s]));
  const ordered = r.slide_order.map((id) => byId.get(id)).filter((s): s is Slide => !!s);
  const rest = slides.filter((s) => !r.slide_order!.includes(s.id));
  return [...ordered, ...rest];
}
