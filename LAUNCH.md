# Launch plan: Open the Fridge 🦃 by Thanksgiving (Thu Nov 26, 2026)

Web app (PWA) at **https://openthefridge.gratiacore.com** first. App Store and Google Play after.
Total cost to launch the PWA: **$0** (you already own gratiacore.com).

> I'm not a lawyer. The Terms, Privacy Policy and Guidelines in the app are solid, plain-language starting points that cover what Apple and US privacy rules expect, but have someone review them before you grow big or start making money.

---

## Week 1 · Nov 6–12 · Get it live

### 1. Fill in your details (5 min)
Open `src/lib/legal.ts` and replace the 3 placeholders:
- `owner` → your full legal name (or business name if you register one)
- `contactEmail` → an inbox you'll check, e.g. `hello@gratiacore.com` (Apple requires published contact info)
- `state` → your US state

### 2. Supabase: database + accounts (15 min, free)
1. supabase.com → **New project** → name `openthefridge`, region **East US**. Save the database password.
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run** → "Success".
3. **Authentication → URL Configuration**
   - Site URL: `https://openthefridge.gratiacore.com`
   - Redirect URLs: add `https://openthefridge.gratiacore.com/**` and `http://localhost:8081/**`
4. **Authentication → Sign In / Providers → Email**: keep **Confirm email** ON.
5. **Project Settings → API**: copy the **Project URL** and **publishable key**.

### 3. Emails that actually arrive (15 min, free) — don't skip
Supabase's built-in email sender only sends a couple of emails an hour, so on launch day most people would never get their confirmation email. Use Resend's free tier:
1. resend.com → sign up → **Domains → Add domain** → `gratiacore.com` → add the DNS records it shows at your registrar → wait for **Verified**.
2. **API Keys → Create** → copy it.
3. Supabase → **Authentication → Emails → SMTP Settings** → enable custom SMTP:
   - Host `smtp.resend.com` · Port `465` · Username `resend` · Password = the API key
   - Sender email `hello@gratiacore.com` · Sender name `Open the Fridge`
4. Supabase → **Authentication → Rate Limits** → raise "emails per hour" to ~100.
5. Supabase → **Authentication → Emails → Templates** → change "Confirm signup" subject to *Open the Fridge: confirm your email*.

### 4. Vercel: put it online (10 min, free)
1. vercel.com → sign in with GitHub → **Add New → Project** → import `openthefridge`.
2. **Environment Variables**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`. **Deploy**.
3. **Settings → Domains** → add `openthefridge.gratiacore.com` → add the CNAME record it shows at your registrar.
4. From now on, every change pushed to GitHub goes live automatically in ~2 minutes.

### 5. Keep it awake (5 min)
Free Supabase projects pause after a week without activity. The included GitHub Action pings it daily:
GitHub repo → **Settings → Secrets and variables → Actions** → add `SUPABASE_URL` and `SUPABASE_KEY` → **Actions** tab → *Keep Supabase awake* → **Run workflow** once to test.

### 6. Make yourself the moderator (2 min)
Sign up in the live app, then in Supabase **SQL Editor** run:
```sql
update public.profiles set is_admin = true where username = 'yourusername';
```
Log out and back in → **Profile → Moderation** appears. Check it daily (Apple and your Terms promise 24 hours).

---

## Week 2 · Nov 13–19 · Friends & family beta
- [ ] Send the link to 10–15 people. Ask them to: sign up, install to home screen, post one recipe with a photo, make a group.
- [ ] **Post 15–20 of your own recipes**, especially in **Holiday**, so the Fridge isn't empty on day one.
- [ ] Watch for: confirmation emails arriving, photos uploading, anything confusing. Send me the notes and I'll fix them.
- [ ] Optional: add more words to Supabase → Table Editor → `blocked_words`.

## Week 3 · Nov 20–25 · Promo
- [ ] Record TikToks: "I built a recipe app that looks like your fridge door", screen-record installing it, posting a pie.
- [ ] Hook: *"Drop your family's Thanksgiving side in the Holiday tin"* + link in bio.
- [ ] Make a group like "Friendsgiving 2026" and share the invite code in your stories.

## Thanksgiving · Nov 26 · Launch 🥧

---

## After launch · December · App Store & Google Play
- **Apple Developer Program: $99 per year** (renews yearly; one membership covers unlimited apps). If you let it lapse, your apps leave the store until you renew. Enrollment can take a few days, so start early December.
- **Google Play: $25 one time.**
- Build and submit with EAS (no Mac needed): see README → step 4.
- Already built in for Apple's review: report content, block users, word filter, auto-hide after reports, Terms agreement with zero-tolerance wording, in-app account deletion, published contact info (Help & Support page).
- You'll also need: App Store screenshots, the privacy "nutrition label" (you collect: email, name, photos, user content, user ID; **not** used for tracking), and a test account for the reviewer (put the login in App Review notes, and mention Profile → Moderation).

## Free-tier limits (plenty for launch)
- Supabase free: 50,000 monthly active users, 500 MB database, 1 GB photo storage. Photos are shrunk to ~300 KB before upload, so that's roughly 3,000+ photos. You'll get an email before you hit a limit; Pro is $25/month if you outgrow it.
- No automatic backups on the free plan. Once a week, export `recipes` and `profiles` from **Table Editor → Export → CSV** and keep the files somewhere safe, or upgrade to Pro once the app really matters.

---

## How we work from here (no more zips)
1. Once the code is on GitHub: VS Code → **Source Control → Clone Repository** → `Gracerobinson12/openthefridge` → `npm install` (once).
2. When I make changes, I push them to GitHub. You click **Sync Changes** (or run `git pull`) in VS Code to get them, and Vercel updates the live site automatically.
3. Your own edits: change files → **Source Control → Commit → Sync**. Live in ~2 minutes.
