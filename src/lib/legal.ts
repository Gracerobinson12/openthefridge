/**
 * ─────────────────────────────────────────────────────────────
 *  FILL THESE IN BEFORE LAUNCH (they appear on every legal page)
 * ─────────────────────────────────────────────────────────────
 */
export const LEGAL = {
  appName: 'Open the Fridge',
  /** Your full legal name, or your business name if you set one up (e.g. "Gratia Core LLC"). */
  owner: '[YOUR NAME OR BUSINESS NAME]',
  /** An inbox you check. Apple requires published contact info for apps where people post. */
  contactEmail: '[CONTACT EMAIL]',
  /** The US state whose laws apply (where you live or where your business is registered). */
  state: '[YOUR STATE]',
  website: 'https://openthefridge.gratiacore.com',
  effectiveDate: 'November 20, 2026',
  minAge: 13,
};

export type Section = { h: string; p: string[] };
export type LegalDoc = { title: string; intro: string; sections: Section[] };

const L = LEGAL;

export const TERMS: LegalDoc = {
  title: 'Terms of Service',
  intro: `These terms are an agreement between you and ${L.owner} ("we", "us"), who runs ${L.appName} (the "app"). By creating an account or using the app, you agree to them. Please read them, along with our Privacy Policy and Community Guidelines, which are part of these terms.`,
  sections: [
    { h: '1. Who can use the app', p: [
      `You must be at least ${L.minAge} years old. If you're under 18, you need permission from a parent or guardian, and they agree to these terms for you.`,
      `You can't use the app if we've banned you before, or if the law where you live doesn't allow it.`,
    ] },
    { h: '2. Your account', p: [
      'Give accurate information, keep your password private, and let us know if you think someone else is using your account. You are responsible for what happens on your account.',
      'Usernames that impersonate someone, or that are offensive, may be changed or removed.',
    ] },
    { h: '3. Zero tolerance for objectionable content and abusive users', p: [
      'There is no place in the app for objectionable content or abusive behavior. That includes hate, harassment, bullying, threats, sexual content, nudity, graphic violence, spam, scams, and anything illegal. Our Community Guidelines explain this in more detail.',
      'Anyone can report a recipe or comment and block another person. We review reports within 24 hours. We may remove content and suspend or permanently ban accounts that break these rules, with or without warning.',
    ] },
    { h: '4. What you post', p: [
      'You own the recipes, photos and comments you post ("your content"). Only post things you have the right to share. Recipe ingredient lists are fine to share, but don\'t copy other people\'s photos, videos or written instructions word for word without permission.',
      `So we can run the app, you give us a worldwide, non-exclusive, royalty-free license to store, display, copy and share your content inside the app, to the people you choose (everyone on the Fridge, or only your groups). For recipes you post publicly, you also let us show them in posts that promote ${L.appName} (for example, a screenshot of the Fridge), and we'll credit your username. This license ends when you delete the content or your account, except where it's already been shared by others or we need to keep it for legal reasons.`,
    ] },
    { h: '4a. Recipes imported from videos', p: [
      'When you import a recipe from a TikTok or YouTube link, the app uses AI to write out the ingredients and steps, and always credits and links to the original creator. Imported recipes stay private in your Tin unless you choose to share them. Don\'t present someone else\'s recipe as your own, and check AI-written recipes before cooking: they can contain mistakes.',
    ] },
    { h: '5. Copyright complaints', p: [
      `If you believe something in the app infringes your copyright, email ${L.contactEmail} with: what the work is, where it appears in the app, your contact details, and a statement that you believe in good faith the use isn't authorized. We'll remove infringing content and close the accounts of repeat infringers.`,
    ] },
    { h: '6. Recipes and food safety', p: [
      'Recipes are posted by users. We don\'t test, verify or endorse them. Always check ingredients for allergies and dietary needs, follow safe food handling, and cook foods to safe temperatures. Nutrition or health claims in recipes are the poster\'s opinion, not advice from us.',
    ] },
    { h: '7. Other services (like TikTok)', p: [
      'If you connect or post to another service such as TikTok, that service\'s own terms and privacy policy apply to what you share there. We only post to TikTok when you choose to.',
    ] },
    { h: '8. Ending your account', p: [
      'You can delete your account any time in Profile → Delete my account. We may suspend or end your access if you break these terms or to protect other people. Sections 4 (for content already shared), 6, 9, 10 and 12 continue after your account ends.',
    ] },
    { h: '9. The app is provided "as is"', p: [
      'The app is free. We work to keep it running well, but we provide it "as is" and "as available", without warranties of any kind, to the fullest extent the law allows. We may change, pause or stop features at any time.',
    ] },
    { h: '10. Limits on our liability', p: [
      `To the fullest extent the law allows, ${L.owner} is not liable for indirect, incidental, special, consequential or punitive damages, or for lost data, arising from your use of the app or from content posted by others. Our total liability for any claim is limited to $50. Some places don't allow these limits, so they may not apply to you.`,
    ] },
    { h: '11. Changes to these terms', p: [
      'We may update these terms. If the changes are important, we\'ll tell you in the app before they take effect. Using the app after that means you accept the new terms.',
    ] },
    { h: '12. Law and disputes', p: [
      `These terms are governed by the laws of the State of ${L.state}, USA, without regard to conflict-of-law rules. Before filing any claim, please contact us at ${L.contactEmail} so we can try to resolve it informally.`,
    ] },
    { h: '13. Apple', p: [
      'If you downloaded the app from Apple\'s App Store: these terms are between you and us, not Apple. Apple isn\'t responsible for the app or its content, has no obligation to provide support, and isn\'t responsible for any claims about it. Apple and its subsidiaries are third-party beneficiaries of these terms and can enforce them.',
    ] },
    { h: 'Contact', p: [`${L.owner} · ${L.contactEmail}`] },
  ],
};

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  intro: `This policy explains what information ${L.appName} collects, why, who can see it, and the choices you have. In short: we collect only what the app needs to work, we don't sell your data, and we don't show ads.`,
  sections: [
    { h: 'What we collect', p: [
      'Account details: your email address and password. Passwords are stored encrypted (hashed) by our sign-in provider; we can never see them.',
      'Profile: your username, display name, and, if you add them, a profile photo, short bio and TikTok handle.',
      'What you create: recipes, photos, comments, groups you create or join, likes, saves, follows, blocks and reports.',
      'Technical information: our hosting providers automatically log basic information such as IP address, browser or device type, and the time of requests, to keep the app secure and working.',
      'On your device: the app stores a sign-in token so you stay logged in. We don\'t use advertising or tracking cookies.',
    ] },
    { h: 'How we use it', p: [
      'To run the app: show your recipes on the Fridge or in your groups, let people follow and comment, and keep you signed in.',
      'To keep the community safe: review reports, enforce our Community Guidelines, and prevent spam and abuse.',
      'To contact you about your account, such as confirming your email or resetting your password. We don\'t send marketing emails unless you opt in.',
    ] },
    { h: 'Who can see your information', p: [
      'Recipes you post publicly, plus your username, display name, photo and bio, can be seen by anyone signed in to the app.',
      'Recipes shared only to a group, and group notes, can be seen by members of that group.',
      'Your email address is never shown to other people.',
      'We don\'t sell or rent your personal information, and we don\'t share it for advertising.',
    ] },
    { h: 'Service providers', p: [
      'We use a few companies to run the app, and they process data only on our behalf: Supabase (database, sign-in and photo storage) and Vercel (website hosting). Their servers are in the United States.',
      'If you import a recipe from a video, the video link (and, for TikTok, the video\'s public caption) is sent to Google\'s Gemini API so it can write out the recipe. We don\'t send your name or email with it.',
      'If you choose to post to TikTok, the content you post is sent to TikTok and handled under TikTok\'s privacy policy.',
      'We may disclose information if the law requires it, or to protect the safety of people using the app.',
    ] },
    { h: 'How long we keep it', p: [
      'We keep your information while your account is open. When you delete your account (Profile → Delete my account), your profile, recipes, photos, comments and groups you own are deleted right away from our database. Copies may remain for a short time in provider logs or backups before they are overwritten.',
    ] },
    { h: 'Your choices and rights', p: [
      'You can edit your profile and delete any recipe or comment at any time, and delete your whole account in the app.',
      `You can ask us for a copy of your data, or to correct or delete it, by emailing ${L.contactEmail}. Depending on where you live (for example California or other US states), you may have additional rights, and we won't treat you differently for using them.`,
    ] },
    { h: 'Children', p: [
      `The app is not for children under ${L.minAge}. We don't knowingly collect information from anyone under ${L.minAge}. If you believe a child under ${L.minAge} has an account, email ${L.contactEmail} and we'll delete it.`,
    ] },
    { h: 'Security', p: [
      'We use encrypted connections (HTTPS), access rules on our database so people can only see what they\'re allowed to, and encrypted password storage. No system is perfectly secure, so please use a strong password you don\'t use elsewhere.',
    ] },
    { h: 'Changes', p: [
      'If we change this policy in an important way, we\'ll let you know in the app before the change takes effect.',
    ] },
    { h: 'Contact', p: [`${L.owner} · ${L.contactEmail}`] },
  ],
};

export const GUIDELINES: LegalDoc = {
  title: 'Community Guidelines',
  intro: `${L.appName} is a kitchen table, not a comment war. These rules apply everywhere in the app, including private groups.`,
  sections: [
    { h: 'Do', p: [
      'Share food you\'ve actually made or love, with honest photos.',
      'Credit the cook. If a recipe came from a cookbook, a friend or a creator, say so.',
      'Be kind in comments. Helpful tips and substitutions are always welcome.',
    ] },
    { h: 'Don\'t post', p: [
      'Hate, harassment, bullying or threats, including about anyone\'s identity, body or culture.',
      'Nudity, sexual content, or graphic violence.',
      'Spam, scams, fake giveaways, or misleading links.',
      'Other people\'s private information (addresses, phone numbers, photos of people who didn\'t agree).',
      'Dangerous food advice (for example, unsafe canning or raw-food practices presented as safe) or anything illegal.',
      'Photos, videos or writing copied from others without permission.',
      'Anything involving anyone under 18 in a sexual or exploitative way. We report this to authorities.',
    ] },
    { h: 'If you see something', p: [
      'Tap "…" on any recipe or comment to report it, or to block the person. Blocked people\'s recipes and comments disappear for you.',
      'We review every report within 24 hours. Recipes reported by several people are hidden right away while we look.',
    ] },
    { h: 'What happens when rules are broken', p: [
      'We may remove the content, give a warning, suspend the account, or ban it permanently, depending on how serious it is. Serious violations lead to an immediate ban.',
    ] },
  ],
};

export const SUPPORT: LegalDoc = {
  title: 'Help & Support',
  intro: `Questions, problems or ideas? Email ${L.contactEmail}. We usually reply within 2 days.`,
  sections: [
    { h: 'Report a problem with a post or a person', p: ['Tap "…" on the recipe or comment and choose Report or Block. We review reports within 24 hours.'] },
    { h: 'Forgot your password', p: ['On the Log in screen, type your email and tap "Forgot password?". We\'ll email you a link to set a new one.'] },
    { h: 'Delete your account', p: ['Profile → Delete my account. This permanently deletes your profile, recipes, photos, comments and groups you own.'] },
    { h: 'Add the app to your home screen', p: ['iPhone: open the site in Safari, tap Share, then "Add to Home Screen". Android: tap Install on the welcome screen, or use the browser menu → Install app.'] },
    { h: 'Contact', p: [`${L.owner} · ${L.contactEmail}`] },
  ],
};
