/* ICT Portal: Google sign-in settings.
   1) Follow SETUP.md to create a free Firebase project.
   2) Paste your web app config below (these values are safe to publish).
   3) Put the teacher Google account(s) in ICT_ADMINS to see the class dashboard.
   Leave apiKey empty to run in guest-only mode. */
window.ICT_FIREBASE = {
  apiKey: "AIzaSyA6gtAoUwD67aypCF_YnrECDU2Ch9QyqL4",
  authDomain: "ict-portal-28894.firebaseapp.com",
  projectId: "ict-portal-28894",
  appId: "1:398486470103:web:2e986c212b48019e655f92"
};
window.ICT_ADMINS = [
  "andrewlamict@gmail.com"
];


/* Optional: a shared AI key so every student gets AI explanations without their own key. Anyone can read it in the page source, so use a free key with a low quota. */
window.ICT_AI = { provider: 'gemini', key: '' };
