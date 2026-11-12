// Open the Fridge — import-recipe Edge Function
// Turns a YouTube or TikTok link into a draft recipe (title, ingredients, numbered steps).
//
//  • YouTube: Gemini watches the public video itself (audio + picture) and writes the steps.
//  • TikTok: TikTok only shares the caption (no video), so Gemini builds the recipe from the caption.
//    If the caption is short, the draft comes back marked `partial` so the person fills in the rest.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   GEMINI_API_KEY   required — free key from https://aistudio.google.com/apikey
//   GEMINI_MODEL     optional — defaults to gemini-flash-latest
//   IMPORTS_PER_DAY  optional — per-person daily limit, default 15
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'npm:@supabase/supabase-js@2';

const CATEGORIES = ['Desserts', 'Appetizers', 'Breakfast', 'Lunch', 'Party Food', 'Holiday'];
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const fail = (error: string, status = 400) => json({ error }, status);

type Platform = 'youtube' | 'tiktok';

/** Same rules as src/lib/videoLink.ts in the app. */
function parseLink(raw: string): { platform: Platform; url: string } | null {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  const host = u.hostname.replace(/^(www\.|m\.)/, '').toLowerCase();
  if (host === 'youtu.be') {
    const id = u.pathname.split('/')[1];
    return id ? { platform: 'youtube', url: `https://www.youtube.com/watch?v=${id}` } : null;
  }
  if (host === 'youtube.com' || host === 'music.youtube.com') {
    const v = u.searchParams.get('v');
    if (v) return { platform: 'youtube', url: `https://www.youtube.com/watch?v=${v}` };
    const m = u.pathname.match(/^\/(shorts|live|embed)\/([\w-]+)/);
    return m ? { platform: 'youtube', url: `https://www.youtube.com/watch?v=${m[2]}` } : null;
  }
  if (host === 'tiktok.com') {
    const m = u.pathname.match(/^\/@[\w.-]+\/(video|photo)\/\d+/);
    return m ? { platform: 'tiktok', url: `https://www.tiktok.com${m[0]}` } : null;
  }
  return null;
}

/** vm.tiktok.com / vt.tiktok.com short links → full tiktok.com/@user/video/123 link. */
async function resolveShortLink(url: string): Promise<string> {
  const host = new URL(url).hostname;
  if (host !== 'vm.tiktok.com' && host !== 'vt.tiktok.com') return url;
  const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (OpenTheFridge recipe importer)' } });
  await res.body?.cancel();
  return res.url;
}

type Meta = { title: string; author: string; thumbnail: string | null };

/** Public oEmbed info (title/caption, creator, thumbnail). No keys needed. */
async function getMeta(platform: Platform, url: string): Promise<Meta> {
  const endpoint = platform === 'youtube'
    ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
    : `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(platform === 'youtube'
    ? 'That YouTube video isn’t public, or the link is wrong.'
    : 'Couldn’t open that TikTok. Make sure the video is public.');
  const m = await res.json();
  const handle = typeof m.author_url === 'string' ? m.author_url.match(/@([\w.-]+)/)?.[1] : null;
  return {
    title: String(m.title ?? '').slice(0, 2200),
    author: platform === 'tiktok' && handle ? `@${handle}` : String(m.author_name ?? 'Unknown creator').slice(0, 100),
    thumbnail: typeof m.thumbnail_url === 'string' && m.thumbnail_url.startsWith('https://') ? m.thumbnail_url : null,
  };
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    is_recipe: { type: 'BOOLEAN', description: 'false if this is not a cooking/recipe video' },
    title: { type: 'STRING' },
    category: { type: 'STRING', enum: CATEGORIES },
    total_time: { type: 'STRING', description: 'e.g. "25 min" or "1 hr 15 min"; empty if unknown' },
    servings: { type: 'STRING', description: 'number only, e.g. "4"; empty if unknown' },
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { qty: { type: 'STRING', description: 'amount + unit, e.g. "2 cups"; empty if not stated' }, name: { type: 'STRING' } },
        required: ['qty', 'name'],
      },
    },
    steps: { type: 'ARRAY', items: { type: 'STRING' } },
    partial: { type: 'BOOLEAN', description: 'true if amounts or steps had to be left out because the source did not include them' },
  },
  required: ['is_recipe', 'title', 'category', 'total_time', 'servings', 'ingredients', 'steps', 'partial'],
};

function prompt(platform: Platform, meta: Meta) {
  const source = platform === 'youtube'
    ? `Watch this cooking video (title: "${meta.title}") and turn it into a recipe card.`
    : `Here is the caption of a TikTok cooking video by ${meta.author}. Turn it into a recipe card.\n\nCAPTION:\n${meta.title}`;
  return `${source}

Rules:
- Ingredients: every ingredient used, with the amount and unit if it is said, shown or written. If an amount is never given, leave qty empty. Never invent ingredients.
- Steps: short, clear, numbered-style instructions in your own words (do not copy narration word for word). One action per step, in order, including temperatures and times when given. 4–15 steps.
- Use US measurements if the source does; otherwise keep the source's units.
- category must be one of: ${CATEGORIES.join(', ')}. Use Holiday for Thanksgiving/Christmas-style dishes.
- Set partial to true if the source didn't include enough to fully make the dish (common for short captions).
- If this is not a recipe or cooking video, set is_recipe to false and leave the lists empty.`;
}

async function askGemini(platform: Platform, url: string, meta: Meta) {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('Importing isn’t set up yet (missing GEMINI_API_KEY).');
  const parts: unknown[] = platform === 'youtube'
    ? [{ file_data: { file_uri: url } }, { text: prompt(platform, meta) }]
    : [{ text: prompt(platform, meta) }];
  const body = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2 },
  });
  const models = [Deno.env.get('GEMINI_MODEL'), 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean) as string[];
  let last = '';
  for (const model of [...new Set(models)]) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body,
    });
    if (res.status === 404) { last = `model ${model} not found`; continue; } // try the next model name
    if (res.status === 429) throw new Error('The recipe importer is busy right now. Try again in a minute.');
    if (!res.ok) { last = await res.text(); break; }
    const out = await res.json();
    const text = out?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    return JSON.parse(text);
  }
  console.error('Gemini error:', last);
  throw new Error('Couldn’t read that video. Try another link, or add the recipe by hand.');
}

const clip = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail('Use POST', 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // 1. Who is asking? (must be signed in, not banned)
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: auth } = await admin.auth.getUser(jwt);
  const user = auth?.user;
  if (!user) return fail('Please log in first.', 401);
  const { data: profile } = await admin.from('profiles').select('banned').eq('id', user.id).maybeSingle();
  if (!profile || profile.banned) return fail('Your account can’t import recipes right now.', 403);

  // 2. Which video?
  let input = '';
  try { input = String((await req.json()).url ?? ''); } catch { /* empty body */ }
  let link: { platform: Platform; url: string } | null = null;
  try { link = parseLink(await resolveShortLink(input)); } catch { link = null; }
  if (!link) return fail('Paste a TikTok or YouTube video link.');

  // 3. Already imported by someone? Reuse it (saves the free quota).
  const { data: cached } = await admin.from('import_cache').select('result').eq('url', link.url).maybeSingle();
  if (cached) return json(cached.result);

  // 4. Daily limit per person.
  const limit = Number(Deno.env.get('IMPORTS_PER_DAY') ?? 15);
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await admin.from('import_log').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since);
  if ((count ?? 0) >= limit) return fail(`You’ve imported ${limit} recipes today. Try again tomorrow!`, 429);

  try {
    const meta = await getMeta(link.platform, link.url);
    const r = await askGemini(link.platform, link.url, meta);
    await admin.from('import_log').insert({ user_id: user.id, url: link.url });

    const ingredients = (Array.isArray(r.ingredients) ? r.ingredients : [])
      .map((x: { qty?: string; name?: string }) => ({ qty: clip(x.qty, 40), name: clip(x.name, 120) }))
      .filter((x: { name: string }) => x.name)
      .slice(0, 40);
    const steps = (Array.isArray(r.steps) ? r.steps : []).map((s: unknown) => clip(s, 600)).filter(Boolean).slice(0, 30);
    if (r.is_recipe === false || (!ingredients.length && !steps.length)) {
      return fail(link.platform === 'tiktok'
        ? 'This TikTok’s caption doesn’t include the recipe. Try a video that lists it in the caption, or add it by hand.'
        : 'That doesn’t look like a recipe video.', 422);
    }
    const result = {
      title: clip(r.title, 120) || clip(meta.title, 120) || 'Imported recipe',
      category: CATEGORIES.includes(r.category) ? r.category : 'Lunch',
      total_time: clip(r.total_time, 40),
      servings: clip(r.servings, 40),
      ingredients,
      steps,
      partial: Boolean(r.partial) || link.platform === 'tiktok' && steps.length < 3,
      source: { source_url: link.url, source_platform: link.platform, source_author: meta.author, source_thumbnail: meta.thumbnail },
    };
    await admin.from('import_cache').upsert({ url: link.url, result });
    return json(result);
  } catch (e) {
    return fail((e as Error).message || 'Something went wrong importing that video.', 502);
  }
});
