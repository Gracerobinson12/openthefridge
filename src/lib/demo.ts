import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Api } from './api';
import type { Category } from './theme';
import type { Comment, Group, ImportedRecipe, Profile, Recipe, Report } from './types';
import { parseVideoLink } from './videoLink';

/**
 * Demo backend: runs entirely on the device with sample data, so the app works
 * before Supabase is connected. Changes are kept in local storage.
 */

type Row = Omit<Recipe, 'author' | 'like_count' | 'comment_count' | 'liked' | 'saved'> & {
  base_likes: number;
};
type DB = {
  recipes: Row[];
  likes: string[];
  saves: string[];
  follows: string[];
  blocks: string[];
  comments: { id: string; recipe_id: string; author_id: string; body: string; created_at: string }[];
  groups: (Omit<Group, 'member_count'> & { base_members: number })[];
  groupPosts: { group_id: string; recipe_id: string; note: string | null; shared_by: string; created_at: string }[];
  me: Profile;
  accounts: { email: string; password: string; username: string; display_name: string }[];
  session: string | null;
  reports: { id: string; recipe_id?: string; comment_id?: string; reported_user_id: string; reason: string; created_at: string }[];
  hidden: string[];
};

const KEY = 'openthefridge-demo-v3';

const people: Record<string, Profile> = {
  maya: { id: 'maya', username: 'maya.bakes', display_name: 'Maya R.', avatar_url: null, bio: null, tiktok_handle: null },
  jordan: { id: 'jordan', username: 'jordancooks', display_name: 'Jordan K.', avatar_url: null, bio: null, tiktok_handle: null },
  priya: { id: 'priya', username: 'priyaeats', display_name: 'Priya S.', avatar_url: null, bio: null, tiktok_handle: null },
  ana: { id: 'ana', username: 'ana.tapas', display_name: 'Ana T.', avatar_url: null, bio: null, tiktok_handle: null },
  leo: { id: 'leo', username: 'leo.lunchbox', display_name: 'Leo M.', avatar_url: null, bio: null, tiktok_handle: null },
  sam: { id: 'sam', username: 'sweetsbysam', display_name: 'Sam W.', avatar_url: null, bio: null, tiktok_handle: null },
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

function seed(): DB {
  const r = (
    id: string, author_id: string, title: string, category: Category, total_time: string, servings: string,
    base_likes: number, h: number, ingredients: [string, string][], steps: string[],
  ): Row => ({
    id, author_id, title, category, total_time, servings, base_likes, created_at: hoursAgo(h),
    ingredients: ingredients.map(([qty, name]) => ({ qty, name })), steps, photos: [], slide_order: null,
  });
  return {
    me: { id: 'me', username: 'you', display_name: 'You', avatar_url: null, bio: null, tiktok_handle: null },
    accounts: [],
    session: null,
    reports: [],
    hidden: [],
    recipes: [
      r('r1', 'maya', 'Brown Butter Cookies', 'Desserts', '30 min', '24', 128, 2,
        [['1 cup', 'Butter, browned'], ['1 cup', 'Brown sugar'], ['2', 'Eggs'], ['2¼ cups', 'Flour'], ['1 tsp', 'Baking soda'], ['2 cups', 'Chocolate chips']],
        ['Brown the butter and let it cool.', 'Beat in sugar and eggs.', 'Fold in flour, soda and chips.', 'Bake at 350°F for 10–12 min.']),
      r('r2', 'jordan', 'Buffalo Chicken Dip', 'Party Food', '25 min', '10', 342, 5,
        [['2 cups', 'Shredded chicken'], ['8 oz', 'Cream cheese'], ['½ cup', 'Hot sauce'], ['½ cup', 'Ranch'], ['1 cup', 'Cheddar']],
        ['Mix everything except half the cheddar.', 'Top with remaining cheese.', 'Bake at 375°F for 20 min until bubbly.']),
      r('r3', 'priya', 'Matcha Pancakes', 'Breakfast', '20 min', '4', 96, 8,
        [['1½ cups', 'Flour'], ['1 tbsp', 'Matcha powder'], ['2 tbsp', 'Sugar'], ['1¼ cups', 'Milk'], ['1', 'Egg']],
        ['Whisk dry ingredients.', 'Add milk and egg; stir until just combined.', 'Cook on a buttered pan, 2 min per side.']),
      r('r4', 'ana', 'Whipped Feta Dip', 'Appetizers', '10 min', '6', 211, 26,
        [['8 oz', 'Feta'], ['4 oz', 'Greek yogurt'], ['2 tbsp', 'Olive oil'], ['1', 'Lemon, zested'], ['', 'Honey to drizzle']],
        ['Blend feta, yogurt and oil until smooth.', 'Top with zest and honey. Serve with pita.']),
      r('r5', 'leo', 'Crispy Rice Salad', 'Lunch', '15 min', '2', 74, 30,
        [['2 cups', 'Cooked rice, cold'], ['1', 'Cucumber'], ['2', 'Scallions'], ['2 tbsp', 'Soy sauce'], ['1 tbsp', 'Rice vinegar']],
        ['Fry the rice in oil until crisp.', 'Toss with chopped veg and dressing.']),
      r('r6', 'sam', 'Strawberry Tres Leches', 'Desserts', '1 hr', '12', 403, 50,
        [['1', 'Vanilla sponge cake'], ['1 can', 'Condensed milk'], ['1 can', 'Evaporated milk'], ['½ cup', 'Cream'], ['2 cups', 'Strawberries']],
        ['Poke the cake all over.', 'Pour over the three milks; chill 2 hours.', 'Top with whipped cream and berries.']),
      r('r7', 'sam', 'Maple Pecan Pumpkin Pie', 'Holiday', '1 hr 30 min', '8', 512, 3,
        [['1', 'Pie crust'], ['15 oz', 'Pumpkin purée'], ['¾ cup', 'Maple syrup'], ['2', 'Eggs'], ['1 cup', 'Heavy cream'], ['2 tsp', 'Pumpkin spice'], ['½ cup', 'Pecans']],
        ['Heat oven to 400°F.', 'Whisk pumpkin, maple, eggs, cream and spice.', 'Pour into the crust, top with pecans.', 'Bake 15 min, then 350°F for 40 min until just set.', 'Cool 2 hours before slicing.']),
      r('mine1', 'me', "Grandma's Lemon Bars", 'Desserts', '45 min', '16', 12, 70,
        [['1 cup', 'Butter, softened'], ['2 cups', 'All-purpose flour'], ['½ cup', 'Powdered sugar'], ['4', 'Large eggs'], ['1½ cups', 'Sugar'], ['⅓ cup', 'Fresh lemon juice'], ['2', 'Lemons, zested']],
        ['Heat oven to 350°F and line a 9×13 pan with parchment.', 'Mix butter, flour and powdered sugar. Press into the pan and bake 20 min.', 'Whisk eggs, sugar, lemon juice and zest until smooth.', 'Pour over the warm crust and bake 20–25 min, until set.', 'Cool completely, dust with powdered sugar and cut into bars.']),
    ],
    likes: ['r2'],
    saves: [],
    follows: [],
    blocks: [],
    comments: [
      { id: 'c1', recipe_id: 'r1', author_id: 'sam', body: 'Made these last night, unreal.', created_at: hoursAgo(1) },
    ],
    groups: [
      { id: 'g1', name: 'Sunday Brunch Club', color: '#C3DEFF', invite_code: 'BRUNCH', base_members: 7 },
      { id: 'g2', name: 'Family Recipes', color: '#FBE8A2', invite_code: 'FAMILY', base_members: 13 },
    ],
    groupPosts: [
      { group_id: 'g1', recipe_id: 'mine1', note: 'Bringing these Sunday!', shared_by: 'me', created_at: hoursAgo(20) },
      { group_id: 'g1', recipe_id: 'r3', note: null, shared_by: 'priya', created_at: hoursAgo(7) },
    ],
  };
}

export function createDemoApi(): Api {
  let db: DB | null = null;
  const listeners = new Set<() => void>();

  async function load(): Promise<DB> {
    if (db) return db;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      db = raw ? (JSON.parse(raw) as DB) : seed();
    } catch {
      db = seed();
    }
    return db;
  }
  async function save() {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* storage unavailable — keep going in memory */
    }
  }
  const person = (d: DB, id: string): Profile => (id === 'me' ? d.me : people[id]) ?? d.me;
  const toRecipe = (d: DB, r: Row): Recipe => ({
    ...r,
    author: person(d, r.author_id),
    like_count: r.base_likes + (d.likes.includes(r.id) ? 1 : 0),
    comment_count: d.comments.filter((c) => c.recipe_id === r.id).length,
    liked: d.likes.includes(r.id),
    saved: d.saves.includes(r.id),
  });
  const newest = (a: Row, b: Row) => b.created_at.localeCompare(a.created_at);
  const toggle = (list: string[], id: string, on: boolean) => {
    const i = list.indexOf(id);
    if (on && i < 0) list.push(id);
    if (!on && i >= 0) list.splice(i, 1);
  };

  const api: Api = {
    mode: 'demo',
    async getMe() {
      const d = await load();
      return d.session ? d.me : null;
    },
    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    // Test-mode accounts live only in this browser/device. Real accounts come from Supabase.
    async signIn(email, password) {
      const d = await load();
      const acct = d.accounts.find((a) => a.email === email.toLowerCase());
      if (!acct || acct.password !== password) throw new Error('Wrong email or password.');
      d.me = { ...d.me, username: acct.username, display_name: acct.display_name, is_admin: true };
      d.session = acct.email;
      await save();
      listeners.forEach((l) => l());
    },
    async signUp(email, password, username, displayName) {
      const d = await load();
      const e = email.toLowerCase();
      if (d.accounts.some((a) => a.email === e)) throw new Error('That email already has an account. Try logging in.');
      if (d.accounts.some((a) => a.username === username) || Object.values(people).some((p) => p.username === username)) {
        throw new Error('That username is taken. Try another.');
      }
      d.accounts.push({ email: e, password, username, display_name: displayName });
      d.me = { ...d.me, username, display_name: displayName, is_admin: true };
      d.session = e;
      await save();
      listeners.forEach((l) => l());
      return { needsConfirm: false };
    },
    async usernameAvailable(username) {
      const d = await load();
      const u = username.toLowerCase();
      return !d.accounts.some((a) => a.username === u) && !Object.values(people).some((p) => p.username === u);
    },
    async signOut() {
      const d = await load();
      d.session = null;
      await save();
      listeners.forEach((l) => l());
    },
    async deleteAccount() {
      await AsyncStorage.removeItem(KEY).catch(() => {});
      db = null;
      listeners.forEach((l) => l());
    },
    async resetPassword() {
      throw new Error('Password reset emails work once the app is connected to Supabase.');
    },
    async changePassword(password) {
      const d = await load();
      const acct = d.accounts.find((a) => a.email === d.session);
      if (acct) acct.password = password;
      await save();
    },
    async updateProfile(patch) {
      const d = await load();
      d.me = { ...d.me, ...patch };
      await save();
    },
    async stats() {
      const d = await load();
      return {
        recipes: d.recipes.filter((r) => r.author_id === 'me').length,
        groups: d.groups.length,
        followers: 3,
      };
    },

    async feed(category) {
      const d = await load();
      return d.recipes
        .filter((r) => r.is_public !== false && !d.blocks.includes(r.author_id) && !d.hidden.includes(r.id))
        .filter((r) => category === 'All' || r.category === category)
        .sort(newest)
        .map((r) => toRecipe(d, r));
    },
    async tin(category) {
      const d = await load();
      return d.recipes
        .filter((r) => r.author_id === 'me' || d.saves.includes(r.id))
        .filter((r) => category === 'All' || r.category === category)
        .sort(newest)
        .map((r) => toRecipe(d, r));
    },
    async recipe(id) {
      const d = await load();
      const r = d.recipes.find((x) => x.id === id);
      return r ? toRecipe(d, r) : null;
    },
    async createRecipe(input) {
      const d = await load();
      const id = 'mine' + Date.now();
      d.recipes.push({ ...input, is_public: input.is_public ?? true, id, author_id: 'me', created_at: new Date().toISOString(), base_likes: 0, slide_order: null });
      await save();
      return id;
    },
    async importFromLink(url) {
      // Test mode: no AI connected yet, so return a realistic sample after a short pause.
      const link = parseVideoLink(url);
      if (!link) throw new Error('Paste a TikTok or YouTube video link.');
      await new Promise((r) => setTimeout(r, 1200));
      const yt = link.platform === 'youtube';
      const sample: ImportedRecipe = {
        title: 'Creamy Tuscan Garlic Pasta',
        category: 'Lunch',
        total_time: '25 min',
        servings: '4',
        ingredients: [
          { qty: '12 oz', name: 'Penne' }, { qty: '2 tbsp', name: 'Butter' }, { qty: '4 cloves', name: 'Garlic, minced' },
          { qty: '½ cup', name: 'Sun-dried tomatoes, chopped' }, { qty: '1 cup', name: 'Heavy cream' },
          { qty: '¾ cup', name: 'Parmesan, grated' }, { qty: '2 cups', name: 'Baby spinach' }, { qty: '', name: 'Salt and pepper' },
        ],
        steps: [
          'Boil the pasta in salted water until al dente. Save ½ cup of pasta water, then drain.',
          'Melt the butter in a large pan over medium heat and cook the garlic for 1 minute.',
          'Add the sun-dried tomatoes and cook 2 minutes.',
          'Pour in the cream, bring to a gentle simmer, then stir in the Parmesan until smooth.',
          'Add the spinach and stir until wilted. Season with salt and pepper.',
          'Toss in the pasta, adding splashes of pasta water until silky. Serve right away.',
        ],
        partial: !yt,
        source: { source_url: link.url, source_platform: link.platform, source_author: yt ? 'Sample Kitchen' : '@samplecook', source_thumbnail: null },
      };
      return sample;
    },
    async buildFromNotes(notes) {
      // Test mode: no AI connected, so return a realistic sample that shows suggestions and guessed amounts.
      await new Promise((r) => setTimeout(r, 900));
      const firstLine = notes.split('\n')[0].split(/[-:–,]/)[0].trim();
      const sample: ImportedRecipe = {
        title: firstLine ? firstLine.charAt(0).toUpperCase() + firstLine.slice(1, 60) : 'My recipe',
        category: 'Lunch',
        total_time: '1 hr',
        servings: '6',
        ingredients: [
          { qty: '1 lb', name: 'Ground beef', qty_guessed: true },
          { qty: '1 can', name: 'Kidney beans', qty_guessed: true },
          { qty: '1', name: 'Onion, diced', qty_guessed: true },
          { qty: '2 tbsp', name: 'Chili powder', qty_guessed: true },
          { qty: '1 can', name: 'Diced tomatoes' },
          { qty: '2 cloves', name: 'Garlic, minced', suggested: true, qty_guessed: true },
          { qty: '1 tsp', name: 'Cumin', suggested: true, qty_guessed: true },
          { qty: '1 tsp', name: 'Salt', suggested: true, qty_guessed: true },
        ],
        steps: [
          'Brown the ground beef in a large pot over medium-high heat, about 6 minutes. Drain the fat.',
          'Add the onion and garlic and cook until soft, about 4 minutes.',
          'Stir in the chili powder, cumin and salt and cook 1 minute.',
          'Add the tomatoes and beans. Bring to a boil, then lower the heat.',
          'Simmer uncovered for 40 minutes, stirring now and then. Taste and adjust the seasoning.',
        ],
        partial: false,
        source: null,
      };
      return sample;
    },
    async rewriteSteps({ ingredients, steps }) {
      // Test mode: drop steps' mentions by keeping only steps that still match an ingredient, as a stand-in for the AI.
      await new Promise((r) => setTimeout(r, 700));
      const have = ingredients.map((i) => i.name.split(',')[0].trim().toLowerCase());
      return steps.map((s) => s.replace(/\b(garlic|cumin|salt)\b( and | and the |, )?/gi, (m, w) => (have.includes(String(w).toLowerCase()) ? m : ''))
        .replace(/\s{2,}/g, ' ').replace(/ ,/g, ',').replace(/the and/g, 'the'));
    },
    async deleteRecipe(id) {
      const d = await load();
      d.recipes = d.recipes.filter((r) => r.id !== id);
      d.groupPosts = d.groupPosts.filter((p) => p.recipe_id !== id);
      await save();
    },
    async setSlideOrder(id, order) {
      const d = await load();
      const r = d.recipes.find((x) => x.id === id);
      if (r) r.slide_order = order;
      await save();
    },
    async setLiked(id, on) {
      const d = await load();
      toggle(d.likes, id, on);
      await save();
    },
    async setSaved(id, on) {
      const d = await load();
      toggle(d.saves, id, on);
      await save();
    },

    async isFollowing(userId) {
      return (await load()).follows.includes(userId);
    },
    async setFollowing(userId, on) {
      const d = await load();
      toggle(d.follows, userId, on);
      await save();
    },
    async report({ recipeId, commentId, reportedUserId, reason }) {
      const d = await load();
      d.reports.push({ id: 'rep' + Date.now(), recipe_id: recipeId, comment_id: commentId, reported_user_id: reportedUserId, reason, created_at: new Date().toISOString() });
      await save();
    },
    async reports(): Promise<Report[]> {
      const d = await load();
      return d.reports.map((r) => {
        const rec = r.recipe_id ? d.recipes.find((x) => x.id === r.recipe_id) : undefined;
        const com = r.comment_id ? d.comments.find((x) => x.id === r.comment_id) : undefined;
        return {
          id: r.id, reason: r.reason, created_at: r.created_at, reporter: d.me, reported_user: person(d, r.reported_user_id),
          recipe: rec ? { id: rec.id, title: rec.title, is_hidden: d.hidden.includes(rec.id) } : null,
          comment: com ? { id: com.id, body: com.body } : null,
        };
      });
    },
    async resolveReport(id) {
      const d = await load();
      d.reports = d.reports.filter((r) => r.id !== id);
      await save();
    },
    async setRecipeHidden(id, hidden) {
      const d = await load();
      toggle(d.hidden, id, hidden);
      await save();
    },
    async deleteComment(id) {
      const d = await load();
      d.comments = d.comments.filter((c) => c.id !== id);
      await save();
    },
    async banUser(userId) {
      const d = await load();
      toggle(d.blocks, userId, true);
      await save();
    },
    async block(userId) {
      const d = await load();
      toggle(d.blocks, userId, true);
      toggle(d.follows, userId, false);
      await save();
    },

    async comments(recipeId) {
      const d = await load();
      return d.comments
        .filter((c) => c.recipe_id === recipeId && !d.blocks.includes(c.author_id))
        .map((c) => ({ id: c.id, recipe_id: c.recipe_id, body: c.body, created_at: c.created_at, author: person(d, c.author_id) })) as Comment[];
    },
    async addComment(recipeId, body) {
      const d = await load();
      d.comments.push({ id: 'c' + Date.now(), recipe_id: recipeId, author_id: 'me', body, created_at: new Date().toISOString() });
      await save();
    },

    async groups() {
      const d = await load();
      return d.groups.map(({ base_members, ...g }) => ({ ...g, member_count: base_members + 1 }));
    },
    async group(id) {
      return (await api.groups()).find((g) => g.id === id) ?? null;
    },
    async createGroup(name, color) {
      const d = await load();
      const id = 'g' + Date.now();
      d.groups.push({ id, name, color, invite_code: Math.random().toString(36).slice(2, 8).toUpperCase(), base_members: 0 });
      await save();
      return id;
    },
    async joinGroup(code) {
      const d = await load();
      const g = d.groups.find((x) => x.invite_code === code.trim().toUpperCase());
      if (!g) throw new Error('No group with that code. (Demo mode only knows BRUNCH and FAMILY.)');
      return g.id;
    },
    async groupFeed(groupId) {
      const d = await load();
      return d.groupPosts
        .filter((p) => p.group_id === groupId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((p) => {
          const r = d.recipes.find((x) => x.id === p.recipe_id);
          return r ? { recipe: toRecipe(d, r), note: p.note, shared_by: person(d, p.shared_by), created_at: p.created_at } : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x);
    },
    async shareToGroups(recipeId, groupIds, note) {
      const d = await load();
      for (const group_id of groupIds) {
        if (!d.groupPosts.some((p) => p.group_id === group_id && p.recipe_id === recipeId)) {
          d.groupPosts.push({ group_id, recipe_id: recipeId, note: note || null, shared_by: 'me', created_at: new Date().toISOString() });
        }
      }
      await save();
    },
  };
  return api;
}
