import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isNewApp = !getApps().length;
export const app = isNewApp ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
// Some corporate networks/VPNs/proxies block Firestore's default streaming
// connection (WebChannel) but allow plain long-polling requests, which
// otherwise surfaces as a misleading "client is offline" error.
// Auto-detection can misjudge a degraded connection as fine, so force
// long-polling unconditionally rather than relying on detection.
export const db = isNewApp
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app);
