# RN Scorecard — Setup Guide (for a first-time Firebase user)

This app is a Next.js website backed by Firebase (Auth + Firestore) and deployed on Vercel.
Follow these steps in order. None of it requires writing code.

## 1. Create the Firebase project pieces

You said you have a Firebase account but no app yet — here's how to create one:

1. Go to https://console.firebase.google.com and create a new project (or open an existing empty one).
2. **Add a Web App**: on the project's Overview page, click the `</>` (Web) icon → give it any nickname (e.g. "RN Scorecard") → **do not** check "Firebase Hosting" (we're using Vercel) → Register app.
3. Firebase will show you a `firebaseConfig` object with values like `apiKey`, `authDomain`, etc. Keep this tab open — you'll need these values in step 3.
4. In the left sidebar, go to **Build → Authentication → Get started**. Click the **Sign-in method** tab → enable **Email/Password**.
5. In the left sidebar, go to **Build → Firestore Database → Create database**. Choose a region close to you, and start in **Production mode**.

## 2. Deploy the security rules

The rules in `firestore.rules` control who can read/write what data — they need to be in place before the app is used for real. Easiest path (no command line):

1. In the Firebase console, go to **Firestore Database → Rules**.
2. Open `firestore.rules` from this project, copy its entire contents, and paste it over what's in the console editor.
3. Click **Publish**.

(If you're comfortable with a terminal, `npm install -g firebase-tools`, then `firebase login`, `firebase use --add` to select this project, then `firebase deploy --only firestore:rules,firestore:indexes` does the same thing plus the index below.)

## 3. Set the environment variables

1. In this project folder, copy `.env.example` to a new file named `.env.local`.
2. Fill in each value from the `firebaseConfig` object you saw in step 1.3 — the names line up directly (e.g. `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`).

## 4. Create your first manager account

1. Firebase console → **Authentication → Users → Add user**. Enter your own email and a password. Do this once for yourself, and once per manager who needs access.
2. That's it — the app auto-registers each person as a "manager" in the roster the first time they sign in.

## 5. Make yourself an admin (optional, for later)

The admin role doesn't gate anything in the app yet (there's no more shared PIN to protect — everyone just signs in with their own account). It's wired up for future use. If you want it now:

1. Firebase console → Project settings → **Service accounts** → **Generate new private key**. Save the downloaded file as `serviceAccountKey.json` in this project's root folder (it's already excluded from git).
2. Firebase console → Authentication → Users → copy your **User UID**.
3. Run: `node scripts/setAdmin.js <your-uid>`
4. Sign out and back in to the app for the change to take effect.

## 6. Run it locally (optional)

```
npm install
npm run dev
```
Visit http://localhost:3000 and sign in with the account you created in step 4.

## 7. Deploy to Vercel

1. Push this repo to GitHub (if it isn't already).
2. In Vercel: **Add New → Project**, import this repo. Framework preset should auto-detect as Next.js.
3. Before deploying, add the same 6 environment variables from your `.env.local` under **Project → Settings → Environment Variables**.
4. Deploy. Share the resulting URL with your managers — they sign in with the accounts you created in step 4.

## Notes

- There is one shared portal/URL for all managers and the admin — everyone signs into the same site, and the header's "Manager" filter scopes what you're viewing.
- A manager can add/edit/remove nurses and scores only for nurses assigned to them; anyone signed in can *view* the full shared roster and bonus report (see `firestore.rules` if you want to lock that down further).
- Adding a brand-new manager = create their login in Authentication (step 4) — there's no in-app "add manager" button by design, since a manager is a real account.
