import type { Category } from './theme';

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  tiktok_handle: string | null;
};

export type Ingredient = { qty: string; name: string };

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
};

export type NewRecipe = {
  title: string;
  category: Category;
  total_time: string;
  servings: string;
  ingredients: Ingredient[];
  steps: string[];
  photos: string[];
};

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
