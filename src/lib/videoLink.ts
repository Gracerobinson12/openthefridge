export type VideoLink = { platform: 'youtube' | 'tiktok'; url: string };

/**
 * Recognizes YouTube and TikTok links people paste (watch, youtu.be, shorts, tiktok.com/@user/video, vm./vt. short links)
 * and returns a clean https URL, or null if it isn't one we support.
 */
export function parseVideoLink(input: string): VideoLink | null {
  const text = input.trim();
  const match = text.match(/https?:\/\/\S+/i);
  let raw = (match ? match[0] : text).replace(/[)\].,!?]+$/, '');
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|m\.)/, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = u.pathname.split('/')[1];
    return id ? { platform: 'youtube', url: `https://www.youtube.com/watch?v=${id}` } : null;
  }
  if (host === 'youtube.com' || host === 'music.youtube.com') {
    const v = u.searchParams.get('v');
    if (v) return { platform: 'youtube', url: `https://www.youtube.com/watch?v=${v}` };
    const short = u.pathname.match(/^\/(shorts|live|embed)\/([\w-]+)/);
    if (short) return { platform: 'youtube', url: `https://www.youtube.com/watch?v=${short[2]}` };
    return null;
  }
  if (host === 'tiktok.com' || host === 'vm.tiktok.com' || host === 'vt.tiktok.com') {
    if (host !== 'tiktok.com') return { platform: 'tiktok', url: `https://${host}${u.pathname}` }; // short link, resolved on the server
    const vid = u.pathname.match(/^\/@[\w.-]+\/(video|photo)\/\d+/);
    return vid ? { platform: 'tiktok', url: `https://www.tiktok.com${vid[0]}` } : null;
  }
  return null;
}
