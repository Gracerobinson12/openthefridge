# Open the Fridge

A pastel, glassy recipe app: **The Fridge** (everyone's recipes, by category), **My Recipe Tin** (your recipes + saves), **Groups** (private recipe boxes with invite codes), and **TikTok photo slides** you can rearrange.

One codebase → an installable web app (PWA) **and**, later, iPhone + Android apps.

Built with Expo (React Native) + Expo Router, with Supabase for accounts, the database and photo storage.

---

## What's inside

| Screen | File |
|---|---|
| The Fridge (social feed) | `src/app/(tabs)/index.tsx` |
| My Recipe Tin | `src/app/(tabs)/tin.tsx` |
| Groups list / create / join | `src/app/(tabs)/groups.tsx` |
| One group's recipes | `src/app/group/[id].tsx` |
| Profile (+ sign out, delete account) | `src/app/(tabs)/profile.tsx` |
| Recipe (ingredients, steps, comments, report/block) | `src/app/recipe/[id].tsx` |
| Add a recipe (photos, category, ingredients, steps) | `src/app/add.tsx` |
| Share to groups / TikTok / link | `src/app/share/[id].tsx` |
| TikTok photo slides (reorder, caption) | `src/app/slides/[id].tsx` |
| Sign in / sign up | `src/app/sign-in.tsx` |

Everything else: shared UI in `src/components/`, data code in `src/lib/`, database setup in `supabase/schema.sql`.

**Demo mode:** with no Supabase keys, the app runs on sample data stored only on that device, so you can click around right away. Once the keys are added it switches to the real backend and asks people to sign in.

---

## 1. Run it on your computer (5 min)

You need [Node.js](https://nodejs.org) (LTS).

```bash
npm install
npx expo start
```

- Press **w** to open it in your browser.
- Or install **Expo Go** on your phone and scan the QR code.

---

## 2. Set up the backend — Supabase (10 min, free)

1. Create an account at [supabase.com](https://supabase.com) → **New project**.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
   This creates the tables, security rules and the `recipe-photos` storage bucket.
3. Go to **Project Settings → API** (or the **Connect** button) and copy the **Project URL** and the **publishable/anon key**.
4. In this folder, copy `.env.example` to `.env.local` and paste them in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=your-publishable-key
   ```
5. Restart `npx expo start`. You'll now see the sign-in screen — create an account and you're live.
6. **Authentication → URL Configuration:** set **Site URL** to `https://recipes.gratiacore.com`.

> The publishable/anon key is meant to be public; the security rules in `schema.sql` protect the data. Never put the `service_role` key in the app.

---

## 3. Put it on the web (15 min, free)

1. Put this folder on GitHub (new repo → upload or `git push`).
2. At [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
   `vercel.json` already sets the build (`npx expo export --platform web`) and output (`dist`).
3. Under **Environment Variables**, add the same `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`. Deploy.
4. In the project → **Settings → Domains** → add `recipes.gratiacore.com`.
   Vercel shows you a DNS record (usually a **CNAME** named `recipes`).
5. At your domain registrar's DNS settings, add exactly that record. It can take a few minutes to an hour to go live.

### It's a PWA (installable web app)

- **iPhone:** open the site in Safari → **Share** → **Add to Home Screen**. It opens full-screen with the fridge icon.
- **Android / desktop Chrome:** an **Install** button appears in the banner on the Fridge (or use the browser menu → Install app).
- It works offline for anything already loaded; posting and loading new recipes need a connection.

PWA files: `public/manifest.json`, `public/sw.js` (service worker), `public/icons/`, `public/index.html` (home-screen tags). If you ever change `sw.js`, bump `VERSION` at the top so phones pick up the new version.

---

## 4. iPhone and Android apps (when it feels solid)

Accounts: **Apple Developer Program** ($99/year) and **Google Play Console** ($25 one-time).

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

EAS builds in the cloud — no Mac or Xcode needed. Add the same two `EXPO_PUBLIC_…` values as EAS environment variables first (`npx eas-cli@latest env:create`).

The bundle id is `com.gratiacore.openthefridge` (in `app.json`); change it before your first build if you want something else.

**Store checklist** (both stores review apps before they go live):

- [x] Report a recipe and block a user — built in (recipe screen → "…").
- [x] Delete account inside the app — built in (Profile).
- [ ] **Privacy policy** and **support** web pages — e.g. `gratiacore.com/recipes/privacy`.
- [ ] A way to review reports: check the `reports` table in Supabase regularly and delete anything that breaks your rules.
- [ ] App icon (1024×1024) and splash: replace the files in `assets/`.
- [ ] Screenshots of the main screens.
- [ ] Terms that say what people can't post (Apple requires this for apps where people share content).

---

## 5. TikTok

**Done now:** the slide builder turns a recipe into cover → ingredients → steps → final-photo slides; you can reorder or remove them and write a caption. The order is saved with the recipe.

**Still to do (needs TikTok's approval):**

1. Register an app at [developers.tiktok.com](https://developers.tiktok.com) and request the **Content Posting API** (photo posts) and **Login Kit**.
2. TikTok reviews the app. Photo posts pull images from web addresses, and TikTok asks you to verify the domain they come from, so `recipes.gratiacore.com` works well for that.
3. Add a small server function (e.g. a Supabase Edge Function) that renders each slide to an image, uploads it, and calls TikTok's API. The hook for it is the `post()` function in `src/app/slides/[id].tsx`.

Sharing your own TikTok videos is marked **Coming soon** in Profile (v2).

---

## Handy commands

```bash
npm run typecheck   # check for type errors
npm run build:web   # build the website into dist/
```
