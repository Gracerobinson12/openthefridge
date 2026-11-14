import type { Category } from './theme';

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  tiktok_handle: string | null;
  is_admin?: boolean;
  banned?: boolean;
};

export type Ingredient = {
  qty: string;
  name: string;
  /** Only while editing a recipe built from notes: the AI added this ingredient to complete the dish. */
  suggested?: boolean;
  /** Only while editing: the amount wasn't in the notes, the AI estimated it. */
  qty_guessed?: boolean;
};

export type Recipe = {
  id: string;
  author_id: string;
  author: Profile;
  title: string;
  category: Category;
  total_time: string;
  servings: string;
  ingredients: Ingredient[];
  steps: string[];
  photos: string[];
  created_at: string;
  like_count: number;
  comment_count: number;
  liked: boolean;
  saved: boolean;
  /** Slide order for TikTok photo posts, as slide ids. */
  slide_order: string[] | null;
  is_public?: boolean;
} & Partial<VideoSource>;

/** Where an imported recipe came from, so we can credit and link back to the creator. */
export type VideoSource = {
  source_url: string;
  source_platform: 'youtube' | 'tiktok';
  source_author: string;
  source_thumbnail: string | null;
};

/** What the importer hands back: a draft the person reviews before saving. */
export type ImportedRecipe = {
  title: string;
  category: Category;
  total_time: string;
  servings: string;
  ingredients: Ingredient[];
  steps: string[];
  /** True when the video caption/description didn't include everything (e.g. TikTok with a short caption). */
  partial: boolean;
  /** Who to credit for a video import; null for a recipe built from the person's own notes. */
  source: VideoSource | null;
};

export type NewRecipe = {
  title: string;
  category: Category;
  total_time: string;
  servings: string;
  ingredients: Ingredient[];
  steps: string[];
  photos: string[];
  is_public?: boolean;
} & Partial<VideoSource>;

export type Group = {
  id: string;
  name: string;
  color: string;
  invite_code: string;
  member_count: number;
};

export type Comment = {
  id: string;
  recipe_id: string;
  author: Profile;
  body: string;
  created_at: string;
};

export type GroupPost = {
  recipe: Recipe;
  note: string | null;
  shared_by: Profile;
  created_at: string;
};

export type Report = {
  id: string;
  reason: string;
  created_at: string;
  reporter: Profile | null;
  reported_user: Profile | null;
  recipe: { id: string; title: string; is_hidden: boolean } | null;
  comment: { id: string; body: string } | null;
};
