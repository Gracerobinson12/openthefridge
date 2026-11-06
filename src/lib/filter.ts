/**
 * Quick friendly check before posting. The database runs the same check (and you can add
 * words there any time in Supabase → Table Editor → blocked_words), so this list is only
 * for a faster message in the app.
 */
const WORDS = [
  'fuck', 'fucker', 'fucking', 'motherfucker', 'shit', 'shitty', 'bullshit',
  'bitch', 'cunt', 'asshole', 'dickhead', 'whore', 'slut', 'porn', 'nudes',
];
const RE = new RegExp(`\\b(${WORDS.join('|')})\\b`, 'i');

export const KIND_MESSAGE = 'Please keep it kind. That wording isn’t allowed on Open the Fridge.';

/** True if any of the texts contains a blocked word. */
export function hasBlockedWord(...texts: (string | null | undefined)[]): boolean {
  return texts.some((t) => !!t && RE.test(t));
}
