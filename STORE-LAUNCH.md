# Road to the App Store and Google Play

Today: **Thu Nov 12, 2026** · Thanksgiving: **Thu Nov 26, 2026** · 14 days.

## What is realistic

| Where | By Thanksgiving? | Why |
|---|---|---|
| **Website / PWA** (openthefridge.gratiacore.com) | **Yes, this weekend** | No approval needed. Works on every phone. |
| **iPhone (App Store)** | **Yes, if you submit by Tue Nov 17** (Thu Nov 19 at the latest) | Apple account approval (1–2 days, sometimes longer) + review (usually 1–2 days) + room for one rejection and resubmit. |
| **Android (Google Play)** | **No. Earliest about Dec 1–7.** | A new personal Google Play account must run a closed test with 12 testers for 14 days in a row before Google lets you apply to publish, then Google reviews for up to a week. Nothing gets around this except an older account (see step A2). |

Thanksgiving plan for Android people: they use the website and tap **Install** (it looks and works like the app), and your 12+ testers get the real Android app through the test link.

Two things nobody can promise: how fast Apple approves your developer account, and whether Apple's reviewer asks for changes. The plan below leaves a week of buffer for both.

**Not yet proven:** the phone versions of this app have never been built. The code is written for it and the web version is tested, but the first iPhone/Android build (steps C2 and D1) is the real test. Do them as early as you can and send me any error.

---

## TODAY · Thu Nov 12 — start the clocks (about 2 hours)

These three wait on other people, so they come first.

### A1. Apple Developer Program ($99/year)
1. On your iPhone, install the **Apple Developer** app from the App Store.
2. Sign in with your Apple ID (turn on two-factor authentication if asked).
3. **Account → Enroll Now → Individual**.
4. Use your **legal name** exactly as on your ID, and pay with **your own card** (a nickname or someone else's card causes delays).
5. Scan your driver's license or passport when asked.
6. Wait for the email "Welcome to the Apple Developer Program". Often within 48 hours. If nothing by Mon Nov 16, contact Apple Developer Support by phone: developer.apple.com/contact.

Your legal name will show as the seller on the App Store (individual accounts can't show a business name).

### A2. Google Play Console ($25 once)
1. Go to **play.google.com/console/signup** → **Personal** account.
   - If you already have a Play Console account from **before Nov 13, 2023**, use that one: it skips the 14-day test and Android can launch much sooner. Tell me if so.
2. Pay $25 and complete identity verification (ID photo). Google may also ask you to verify using a real Android phone, so borrow one if you don't have one.
3. Approval usually takes a couple of days.

### A3. Recruit Android testers (start texting now)
You need **at least 12 people with Android phones**, each with a Gmail address. Ask for **16–20** so drop-outs don't hurt.
- Collect their Gmail addresses in a note.
- Tell them: "I'll send a link around Saturday. Tap it, join, install, and open the app a few times over two weeks."

### A4. Free accounts (5 min each)
- **Expo:** expo.dev → sign up (this builds the phone apps in the cloud; no Mac needed).
- **Gemini key:** aistudio.google.com/apikey (for video imports).
- **Resend:** resend.com (for sign-up emails).

### A5. Code on GitHub
1. Unzip the update files into your `openthefridge` folder (replace when asked).
2. Open `src/lib/legal.ts` and fill in **owner**, **contactEmail**, **state**.
3. In the VS Code terminal:
   ```
   npm install
   npx tsc --noEmit
   git add -A
   git commit -m "Store launch prep"
   git push -u origin main
   ```
   `tsc` should print nothing. If it prints errors, send them to me.

---

## FRI Nov 13 — the live website (about 2 hours)

Follow **LAUNCH.md → Week 1** steps 2–6:
1. Supabase: run `reset.sql`, then `schema.sql`. Set the Site URL.
2. Resend email sender (so confirmation emails arrive).
3. Video imports: Gemini key + deploy the `import-recipe` function (step 5b).
4. Vercel: import the repo, add the two environment variables, deploy.
5. Domain: add `openthefridge.gratiacore.com` in Vercel and the CNAME record at your registrar.
6. Sign up on the live site, then make yourself admin with the SQL line in LAUNCH.md.

**Check before moving on:**
- [ ] https://openthefridge.gratiacore.com opens and you can sign up and log in
- [ ] The confirmation email arrives
- [ ] You can post a recipe with a photo
- [ ] https://openthefridge.gratiacore.com/privacy and /support open **without logging in** (Apple and Google both need these links)
- [ ] Import one YouTube cooking video

Then **post 15–20 real recipes with photos**, a few in every category. Apple rejects apps that look empty, and the reviewer will look at your Fridge.

---

## SAT Nov 14 — first phone builds

### C1. Try it on your own phone (15 min)
1. Create a file named `.env.local` in the project with your two Supabase values (copy `.env.example`).
2. Install **Expo Go** from the App Store.
3. In VS Code: `npx expo start` → scan the QR code with your iPhone camera.
4. Tap through everything: sign up, add a recipe with a photo from your library and from the camera, import a video, comment, report, block, delete account.
5. Write down anything that looks wrong and send it to me with screenshots.

### C2. Connect the project to Expo's build service (10 min)
```
npx eas-cli@latest login
npx eas-cli@latest init
```
Say yes to creating the project. Then give the builds your Supabase values (they aren't read from `.env.local`):
```
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOURPROJECT.supabase.co" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_KEY --value "YOUR-PUBLISHABLE-KEY" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SITE_URL --value "https://openthefridge.gratiacore.com" --visibility plaintext
```
Commit and push the small change `init` made to `app.json`.

### C3. Android build + start the 14-day clock
Do this the moment your Play Console account is approved. Every day of delay moves the Android launch a day.
1. Build: `npx eas-cli@latest build --platform android --profile production`
   - "Generate a new Android Keystore?" → **Yes**.
   - Takes 15–30 minutes. When done, download the **.aab** file from the link.
2. Play Console → **Create app**: name *Open the Fridge*, App, Free, accept the declarations.
3. Left menu → **Testing → Closed testing → Manage track** (the "Alpha" track):
   - **Testers** tab → Create email list → paste your testers' Gmail addresses → save.
   - **Create new release** → upload the .aab → release name `1.0.0` → **Next → Save → Send for review**.
4. Google asks you to finish **"Set up your app"** first (same page, dashboard checklist):
   - **Privacy policy:** `https://openthefridge.gratiacore.com/privacy`
   - **App access:** "All or some functionality is restricted" → add the demo login from step D3.
   - **Ads:** No.
   - **Content rating:** fill in the questionnaire honestly. Users can interact and share content: Yes. The app has reporting and blocking: Yes.
   - **Target audience:** 13 and over.
   - **Data safety:** collects Email, Name, Photos, Other user-generated content, User IDs. All for "App functionality", encrypted in transit, users can request deletion. Not shared with third parties for advertising. No tracking.
   - **Account deletion link:** `https://openthefridge.gratiacore.com/support`
   - **Store listing:** short and full description (text at the bottom of this file), app icon 512×512 (`public/icons/icon-512.png`), feature graphic 1024×500, at least 2 phone screenshots. Ask me and I'll make the screenshots and feature graphic for you.
5. When the closed-test release is approved (hours to a couple of days), copy the **opt-in link** from the Testers tab and text it to your testers.
6. The 14 days count from when **12 testers have opted in**. Check **Dashboard** daily; it shows the count and the days remaining.
7. Ask testers to open the app a few times a week. Google checks that it was really used.
8. After 14 days: **Dashboard → Apply for production**. Answer the questions about your test (what feedback you got, what you changed). Google decides in a few days.
9. When granted: **Production → Create new release** → use the same build → all countries → send for review.

---

## As soon as Apple approves you (target: Sat Nov 14 – Mon Nov 16)

### D1. iPhone build
```
npx eas-cli@latest build --platform ios --profile production
```
- "Log in to your Apple account?" → **Yes**, sign in with your developer Apple ID.
- Let EAS **generate** the distribution certificate and provisioning profile (answer Yes to each).
- 20–40 minutes.

### D2. Send it to Apple and test with TestFlight
```
npx eas-cli@latest submit --platform ios --latest
```
- First time it asks to create the app in App Store Connect: say yes. If the name "Open the Fridge" is taken, try "Open the Fridge: Recipes".
- After 10–30 minutes of "processing", install **TestFlight** on your iPhone, open it, and install your app.
- Run the same test list as step C1 on the real build. Fix anything broken before submitting (send me the problem; each fix needs a new build + submit).

### D3. Demo account for the reviewers
Apple and Google both need a login they can use.
1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Email: `review@gratiacore.com` (any address works), a password you make up, tick **Auto Confirm User**.
3. Log in as that user in the app once and add a display name and one recipe.

### D4. App Store Connect listing (appstoreconnect.apple.com → My Apps → Open the Fridge)
**App Information**
- Subtitle: `Recipes on your fridge door`
- Category: **Food & Drink** (secondary: Social Networking)
- Content Rights: you do show third-party content (users' posts and credited video imports) and you have the rights through your Terms: answer accordingly.
- Age Rating: answer the questionnaire honestly. Declare **user-generated content**: Yes. Everything else (violence, gambling, etc.): None.

**Pricing and Availability:** Free. United States (add more countries later).

**App Privacy** → Privacy Policy URL `https://openthefridge.gratiacore.com/privacy`, then "Get Started":
| Data type | Collected | Linked to the user | Used for tracking | Purpose |
|---|---|---|---|---|
| Email Address | Yes | Yes | No | App Functionality |
| Name | Yes | Yes | No | App Functionality |
| Photos or Videos | Yes | Yes | No | App Functionality |
| Other User Content (recipes, comments) | Yes | Yes | No | App Functionality |
| User ID | Yes | Yes | No | App Functionality |

**Version 1.0 page**
- Screenshots: iPhone 6.9" display, at least 3 (ask me and I'll generate them at the exact size).
- Promotional text, description, keywords: at the bottom of this file.
- Support URL: `https://openthefridge.gratiacore.com/support`
- Build: pick the build you uploaded.
- **App Review Information:**
  - Sign-in required: Yes → the demo email and password from D3.
  - Your phone number and email.
  - Notes (paste this):
    ```
    Open the Fridge is a recipe-sharing community.

    User-generated content safeguards (Guideline 1.2):
    - Users must agree to Terms with zero tolerance for objectionable content at sign-up.
    - Filter: objectionable words are blocked in recipes, comments, names and groups.
    - Report: tap "..." on any recipe or comment > Report, and choose a reason.
    - Block: tap "..." on any recipe or comment > Block. Their content disappears immediately.
    - Recipes reported by 3 users are hidden automatically. We review all reports within 24 hours
      and remove content and ban offending users (in-app moderation screen for admins).
    - Contact info: Profile > Help & Support.

    Account deletion: Profile > Delete my account.
    Recipe import: paste a public YouTube or TikTok link on the Add screen (+). The recipe is
    private by default and credits and links to the original creator.
    ```
- Version Release: **Manually release this version** (so you choose the moment it goes live).

### D5. Submit for review — target **Tue Nov 17**
Click **Add for Review → Submit**. Status goes Waiting for Review → In Review → Approved (or a message from the reviewer).

### D6. If Apple sends it back
This is normal for a first app. Read the message in **App Store Connect → App Review**, send it to me word for word, and I'll make the fix the same day. Text-only issues (description, screenshots) can be fixed and resubmitted without a new build. Reply to the reviewer in the Resolution Center politely and briefly.

### D7. Release
When the status is **Pending Developer Release**, press **Release This Version** on Wed Nov 25 or Thanksgiving morning. It appears in the App Store within a few hours.

---

## Calendar

| Date | You do | Waiting on |
|---|---|---|
| **Thu Nov 12** | A1–A5: Apple + Google accounts, testers, code on GitHub | Apple, Google approvals |
| **Fri Nov 13** | Live website: Supabase, emails, Vercel, domain. Post recipes. | |
| **Sat Nov 14** | Expo Go test. EAS setup. Android build → closed test. Send tester link. | Google test review |
| **Sun Nov 15** | iPhone build → TestFlight (if Apple approved). Store listings. | |
| **Mon Nov 16** | Fix what testing found. Screenshots. Demo account. | |
| **Tue Nov 17** | **Submit iPhone app for review.** | Apple review |
| Wed–Fri Nov 18–20 | Answer Apple. Fix + resubmit if needed. Friends beta on the website. | |
| Sat–Tue Nov 21–24 | Buffer for a second review round. Record promo videos. | |
| **Wed Nov 25** | Release the iPhone app. | |
| **Thu Nov 26** | **Thanksgiving launch:** iPhone app + website. | |
| ~Sat Nov 28 | Android 14 days complete → apply for production. | Google |
| ~Dec 1–7 | **Android app live on Google Play.** | |

---

## Store listing text (copy and paste)

**Name:** Open the Fridge
**Subtitle (Apple, 30 max):** Recipes on your fridge door
**Short description (Google, 80 max):** Save, share and swap recipes with the people you cook for.
**Promotional text (Apple):** Pin your Thanksgiving favorites to the Fridge and swap recipes with family and friends.
**Keywords (Apple, 100 max):** recipes,cooking,meal,family,cookbook,share,holiday,thanksgiving,baking,dinner,friends,groups

**Description:**
```
Open the Fridge is the recipe box you share with your people.

THE FRIDGE
See what everyone's cooking. Browse by Desserts, Appetizers, Breakfast, Lunch, Party Food and Holiday, and save anything you love to your own Recipe Tin.

MY RECIPE TIN
All your recipes in one place: the ones you write, the ones you save, and the ones you import.

IMPORT FROM A VIDEO
Paste a YouTube or TikTok link and get the ingredients and steps written out, with credit and a link back to the creator.

GROUPS
Make a private recipe box for your family, roommates or friends. Share an invite code and start swapping.

MADE TO FEEL GOOD
Photos, checkable ingredient lists, clear numbered steps, and a calm, pastel design.

A kind community: report or block in two taps, and we review every report within 24 hours.
```
(Don't use the TikTok or YouTube logos in screenshots, and don't put their names in the Apple keywords field.)

---

## After both are live
- Each update: change code → `eas build` → `eas submit` → a short review. The website still updates instantly from GitHub.
- Keep checking **Profile → Moderation** daily.
- Renew Apple each year ($99) or the app leaves the store.
