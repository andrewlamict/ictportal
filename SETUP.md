# Turn on Google sign-in and XP saving (about 10 minutes, free)

The site works without this (guest mode). Do these steps once to let students sign in with Google, keep their XP, and let you see who used the portal.

1. Go to https://console.firebase.google.com and click **Add project**. Name it (for example `ict-portal`). You can turn Google Analytics off.
2. In the project, click the **</>** (Web) icon to register a web app. Copy the `firebaseConfig` values (`apiKey`, `authDomain`, `projectId`, `appId`) into `firebase-config.js`.
3. **Build > Authentication > Get started > Sign-in method > Google > Enable**. Choose a support email and save.
4. **Authentication > Settings > Authorized domains > Add domain**: add your site domain (for example `yourname.github.io`).
5. **Build > Firestore Database > Create database** (production mode, any nearby region such as `asia-east2` Hong Kong).
6. In Firestore open the **Rules** tab, paste the contents of `firestore.rules`, replace `teacher@example.com` with your Google account, and **Publish**.
7. In `firebase-config.js` put the same Google account in `ICT_ADMINS`.
8. Upload the changed files to GitHub. After you sign in with that account, a **Class** button appears in the top bar. It lists every student's name, email, XP and last visit.

## About student data
The portal stores each signed-in student's Google name, email, photo URL, XP, pages visited and last visit time. Tell students and parents what is collected, and check your school's policy on student accounts and Hong Kong's PDPO before using it with minors. Using school-issued Google accounts is the simplest option. XP is stored by the browser app, so a technical student could edit their own score.
