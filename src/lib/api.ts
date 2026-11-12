import type { Category } from './theme';
import type { Comment, Group, GroupPost, ImportedRecipe, NewRecipe, Profile, Recipe, Report } from './types';

export type ProfileStats = { recipes: number; groups: number; followers: number };

/**
 * Everything the screens need from a backend.
 * Two implementations: `demo` (in-memory, no setup needed) and `live` (Supabase).
 */
export interface Api {
  mode: 'demo' | 'live';

  // Auth
  getMe(): Promise<Profile | null>;
  onAuthChange(cb: () => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, username: string, displayName: string): Promise<{ needsConfirm: boolean }>;
  signOut(): Promise<void>;
  usernameAvailable(username: string): Promise<boolean>;
  deleteAccount(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  changePassword(password: string): Promise<void>;
  updateProfile(patch: Partial<Pick<Profile, 'display_name' | 'bio' | 'tiktok_handle' | 'avatar_url'>>): Promise<void>;
  stats(): Promise<ProfileStats>;

  // Recipes
  feed(category: Category | 'All'): Promise<Recipe[]>;
  tin(category: Category | 'All'): Promise<Recipe[]>;
  recipe(id: string): Promise<Recipe | null>;
  createRecipe(input: NewRecipe): Promise<string>;
  /** Turns a TikTok or YouTube link into a draft recipe (not saved yet). */
  importFromLink(url: string): Promise<ImportedRecipe>;
  deleteRecipe(id: string): Promise<void>;
  setSlideOrder(id: string, order: string[]): Promise<void>;
  setLiked(id: string, on: boolean): Promise<void>;
  setSaved(id: string, on: boolean): Promise<void>;

  // People
  isFollowing(userId: string): Promise<boolean>;
  setFollowing(userId: string, on: boolean): Promise<void>;
  report(input: { recipeId?: string; commentId?: string; reportedUserId: string; reason: string }): Promise<void>;
  block(userId: string): Promise<void>;

  // Comments
  comments(recipeId: string): Promise<Comment[]>;
  addComment(recipeId: string, body: string): Promise<void>;

  // Moderation (admins only)
  reports(): Promise<Report[]>;
  resolveReport(id: string): Promise<void>;
  setRecipeHidden(id: string, hidden: boolean): Promise<void>;
  deleteComment(id: string): Promise<void>;
  banUser(userId: string): Promise<void>;

  // Groups
  groups(): Promise<Group[]>;
  group(id: string): Promise<Group | null>;
  createGroup(name: string, color: string): Promise<string>;
  joinGroup(code: string): Promise<string>;
  groupFeed(groupId: string): Promise<GroupPost[]>;
  shareToGroups(recipeId: string, groupIds: string[], note: string): Promise<void>;
}
