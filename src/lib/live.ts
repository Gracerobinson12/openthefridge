import type { SupabaseClient } from '@supabase/supabase-js';
import type { Api } from './api';
import type { Category } from './theme';
import type { Comment, Group, GroupPost, ImportedRecipe, Profile, Recipe, Report } from './types';
import { parseVideoLink } from './videoLink';

const RECIPE_SELECT =
  '*, author:profiles!recipes_author_id_fkey(*), likes(count), comments(count)';

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

function guessMime(uri: string): { mime: string; ext: string } {
  const data = /^data:(image\/[a-z+]+)/.exec(uri);
  const mime = data?.[1] ?? (/\.png($|\?)/i.test(uri) ? 'image/png' : /\.webp($|\?)/i.test(uri) ? 'image/webp' : 'image/jpeg');
  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  return { mime, ext };
}

export function createLiveApi(sb: SupabaseClient): Api {
  async function uid(): Promise<string> {
    const { data } = await sb.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new Error('Please sign in first.');
    return id;
  }

  async function blockedIds(me: string): Promise<string[]> {
    const rows = check(await sb.from('blocks').select('blocked_id').eq('blocker_id', me));
    return (rows ?? []).map((r: { blocked_id: string }) => r.blocked_id);
  }

  /** Turns raw rows into Recipe objects with liked/saved flags for the current user. */
  async function hydrate(rows: any[], me: string): Promise<Recipe[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const [likes, saves] = await Promise.all([
      sb.from('likes').select('recipe_id').eq('user_id', me).in('recipe_id', ids),
      sb.from('saves').select('recipe_id').eq('user_id', me).in('recipe_id', ids),
    ]);
    const liked = new Set((check(likes) ?? []).map((r: any) => r.recipe_id));
    const saved = new Set((check(saves) ?? []).map((r: any) => r.recipe_id));
    return rows.map((r) => ({
      id: r.id,
      author_id: r.author_id,
      author: r.author,
      title: r.title,
      category: r.category,
      total_time: r.total_time,
      servings: r.servings,
      ingredients: r.ingredients ?? [],
      steps: r.steps ?? [],
      photos: r.photos ?? [],
      created_at: r.created_at,
      slide_order: r.slide_order,
      is_public: r.is_public,
      source_url: r.source_url ?? undefined,
      source_platform: r.source_platform ?? undefined,
      source_author: r.source_author ?? undefined,
      source_thumbnail: r.source_thumbnail ?? null,
      like_count: r.likes?.[0]?.count ?? 0,
      comment_count: r.comments?.[0]?.count ?? 0,
      liked: liked.has(r.id),
      saved: saved.has(r.id),
    }));
  }

  async function uploadPhoto(me: string, uri: string, i: number): Promise<string> {
    if (/^https?:\/\//.test(uri)) return uri; // already uploaded
    const { mime, ext } = guessMime(uri);
    const body = await (await fetch(uri)).arrayBuffer();
    const path = `${me}/${Date.now()}-${i}.${ext}`;
    check(await sb.storage.from('recipe-photos').upload(path, body, { contentType: mime }));
    return sb.storage.from('recipe-photos').getPublicUrl(path).data.publicUrl;
  }

  const api: Api = {
    mode: 'live',

    async getMe() {
      const { data } = await sb.auth.getSession();
      const id = data.session?.user.id;
      if (!id) return null;
      const res = await sb.from('profiles').select('*').eq('id', id).maybeSingle();
      return (res.data as Profile) ?? null;
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange(() => cb());
      return () => data.subscription.unsubscribe();
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    async signUp(email, password, username, displayName) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.toLowerCase(), display_name: displayName, terms_accepted_at: new Date().toISOString() },
          emailRedirectTo: typeof window !== 'undefined' && window.location ? window.location.origin : undefined,
        },
      });
      if (error) throw new Error(error.message);
      return { needsConfirm: !data.session };
    },
    async signOut() {
      await sb.auth.signOut();
    },
    async usernameAvailable(username) {
      const res = await sb.rpc('username_available', { name: username.toLowerCase() });
      if (res.error) throw new Error(res.error.message);
      return res.data as boolean;
    },
    async resetPassword(email) {
      const redirectTo = typeof window !== 'undefined' && window.location ? `${window.location.origin}/profile?reset=1` : undefined;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw new Error(error.message);
    },
    async changePassword(password) {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
    async deleteAccount() {
      const res = await sb.rpc('delete_my_account');
      if (res.error) throw new Error(res.error.message);
      await sb.auth.signOut();
    },
    async updateProfile(patch) {
      const me = await uid();
      if (patch.avatar_url) patch = { ...patch, avatar_url: await uploadPhoto(me, patch.avatar_url, 0) };
      check(await sb.from('profiles').update(patch).eq('id', me));
    },
    async stats() {
      const me = await uid();
      const [r, g, f] = await Promise.all([
        sb.from('recipes').select('id', { count: 'exact', head: true }).eq('author_id', me),
        sb.from('group_members').select('group_id', { count: 'exact', head: true }).eq('user_id', me),
        sb.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', me),
      ]);
      return { recipes: r.count ?? 0, groups: g.count ?? 0, followers: f.count ?? 0 };
    },

    async feed(category) {
      const me = await uid();
      const blocked = await blockedIds(me);
      let q = sb.from('recipes').select(RECIPE_SELECT).eq('is_public', true).eq('is_hidden', false);
      if (category !== 'All') q = q.eq('category', category);
      if (blocked.length) q = q.not('author_id', 'in', `(${blocked.join(',')})`);
      const rows = check(await q.order('created_at', { ascending: false }).limit(60));
      return hydrate(rows ?? [], me);
    },
    async tin(category) {
      const me = await uid();
      const saved = (check(await sb.from('saves').select('recipe_id').eq('user_id', me)) ?? []).map(
        (r: any) => r.recipe_id as string,
      );
      let q = sb.from('recipes').select(RECIPE_SELECT);
      q = saved.length ? q.or(`author_id.eq.${me},id.in.(${saved.join(',')})`) : q.eq('author_id', me);
      if (category !== 'All') q = q.eq('category', category);
      const rows = check(await q.order('created_at', { ascending: false }));
      return hydrate(rows ?? [], me);
    },
    async recipe(id) {
      const me = await uid();
      const row = check(await sb.from('recipes').select(RECIPE_SELECT).eq('id', id).maybeSingle());
      if (!row) return null;
      return (await hydrate([row], me))[0];
    },
    async createRecipe(input) {
      const me = await uid();
      const photos = await Promise.all(input.photos.map((p, i) => uploadPhoto(me, p, i)));
      const row = check(
        await sb
          .from('recipes')
          .insert({ ...input, photos, author_id: me })
          .select('id')
          .single(),
      );
      return (row as { id: string }).id;
    },
    async importFromLink(url) {
      const link = parseVideoLink(url);
      if (!link) throw new Error('Paste a TikTok or YouTube video link.');
      const { data, error } = await sb.functions.invoke('import-recipe', { body: { url: link.url } });
      if (error) {
        // The function sends a friendly message in its JSON body; show that instead of a generic error.
        let msg = error.message;
        try {
          const body = await (error as { context?: Response }).context?.json();
          if (body?.error) msg = body.error;
        } catch { /* keep generic message */ }
        throw new Error(msg);
      }
      return data as ImportedRecipe;
    },
    async deleteRecipe(id) {
      check(await sb.from('recipes').delete().eq('id', id));
    },
    async setSlideOrder(id, order) {
      check(await sb.from('recipes').update({ slide_order: order }).eq('id', id));
    },
    async setLiked(id, on) {
      const me = await uid();
      if (on) check(await sb.from('likes').upsert({ user_id: me, recipe_id: id }));
      else check(await sb.from('likes').delete().match({ user_id: me, recipe_id: id }));
    },
    async setSaved(id, on) {
      const me = await uid();
      if (on) check(await sb.from('saves').upsert({ user_id: me, recipe_id: id }));
      else check(await sb.from('saves').delete().match({ user_id: me, recipe_id: id }));
    },

    async isFollowing(userId) {
      const me = await uid();
      const rows = check(await sb.from('follows').select('following_id').match({ follower_id: me, following_id: userId }));
      return (rows ?? []).length > 0;
    },
    async setFollowing(userId, on) {
      const me = await uid();
      if (on) check(await sb.from('follows').upsert({ follower_id: me, following_id: userId }));
      else check(await sb.from('follows').delete().match({ follower_id: me, following_id: userId }));
    },
    async report({ recipeId, commentId, reportedUserId, reason }) {
      const me = await uid();
      check(await sb.from('reports').insert({
        reporter_id: me, recipe_id: recipeId ?? null, comment_id: commentId ?? null, reported_user_id: reportedUserId, reason,
      }));
    },
    async reports() {
      const rows = check(
        await sb
          .from('reports')
          .select('id, reason, created_at, reporter:profiles!reports_reporter_id_fkey(*), reported_user:profiles!reports_reported_user_id_fkey(*), recipe:recipes(id, title, is_hidden), comment:comments(id, body)')
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
      );
      return (rows ?? []) as unknown as Report[];
    },
    async resolveReport(id) {
      check(await sb.from('reports').update({ status: 'resolved' }).eq('id', id));
    },
    async setRecipeHidden(id, hidden) {
      check(await sb.from('recipes').update({ is_hidden: hidden }).eq('id', id));
    },
    async deleteComment(id) {
      check(await sb.from('comments').delete().eq('id', id));
    },
    async banUser(userId) {
      check(await sb.from('profiles').update({ banned: true }).eq('id', userId));
    },
    async block(userId) {
      const me = await uid();
      check(await sb.from('blocks').upsert({ blocker_id: me, blocked_id: userId }));
      await sb.from('follows').delete().match({ follower_id: me, following_id: userId });
    },

    async comments(recipeId) {
      const me = await uid();
      const blocked = new Set(await blockedIds(me));
      const rows = check(
        await sb
          .from('comments')
          .select('*, author:profiles!comments_author_id_fkey(*)')
          .eq('recipe_id', recipeId)
          .order('created_at', { ascending: true }),
      );
      return ((rows ?? []) as Comment[]).filter((c) => !blocked.has(c.author.id));
    },
    async addComment(recipeId, body) {
      const me = await uid();
      check(await sb.from('comments').insert({ recipe_id: recipeId, author_id: me, body }));
    },

    async groups() {
      const me = await uid();
      const rows = check(await sb.from('group_members').select('group:groups(*)').eq('user_id', me));
      const groups = (rows ?? []).map((r: any) => r.group).filter(Boolean);
      if (!groups.length) return [];
      const members = check(
        await sb.from('group_members').select('group_id').in('group_id', groups.map((g: any) => g.id)),
      );
      const counts: Record<string, number> = {};
      (members ?? []).forEach((m: any) => (counts[m.group_id] = (counts[m.group_id] ?? 0) + 1));
      return groups.map((g: any) => ({ ...g, member_count: counts[g.id] ?? 1 })) as Group[];
    },
    async group(id) {
      const all = await api.groups();
      return all.find((g) => g.id === id) ?? null;
    },
    async createGroup(name, color) {
      const me = await uid();
      const row = check(await sb.from('groups').insert({ name, color, owner_id: me }).select('id').single());
      return (row as { id: string }).id;
    },
    async joinGroup(code) {
      const res = await sb.rpc('join_group', { code });
      if (res.error) throw new Error(res.error.message);
      return res.data as string;
    },
    async groupFeed(groupId) {
      const me = await uid();
      const rows = check(
        await sb
          .from('group_recipes')
          .select(`note, created_at, shared_by:profiles!group_recipes_shared_by_fkey(*), recipe:recipes(${RECIPE_SELECT})`)
          .eq('group_id', groupId)
          .order('created_at', { ascending: false }),
      );
      const list = (rows ?? []).filter((r: any) => r.recipe);
      const recipes = await hydrate(list.map((r: any) => r.recipe), me);
      return list.map((r: any, i: number) => ({
        recipe: recipes[i],
        note: r.note,
        shared_by: r.shared_by,
        created_at: r.created_at,
      })) as GroupPost[];
    },
    async shareToGroups(recipeId, groupIds, note) {
      const me = await uid();
      if (!groupIds.length) return;
      check(
        await sb.from('group_recipes').upsert(
          groupIds.map((group_id) => ({ group_id, recipe_id: recipeId, shared_by: me, note: note || null })),
          { onConflict: 'group_id,recipe_id', ignoreDuplicates: true },
        ),
      );
    },
  };
  return api;
}

export type { Category };
