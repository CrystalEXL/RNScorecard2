'use client';

import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const RETRY_DELAYS_MS = [1000, 2500, 5000]; // a slow first connection shouldn't strand the user permanently

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setProfileReady(false);
      setProfileError('');
      setUser(u);
      if (!u) return;

      let lastErr;
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        if (cancelled) return;
        try {
          await ensureManagerProfile(u);
          if (!cancelled) setProfileReady(true);
          return;
        } catch (e) {
          lastErr = e;
          if (attempt < RETRY_DELAYS_MS.length) {
            await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
          }
        }
      }
      console.error('Failed to set up manager profile after retries:', lastErr, {
        code: lastErr?.code,
        name: lastErr?.name,
        online: typeof navigator !== 'undefined' ? navigator.onLine : 'n/a',
      });
      if (!cancelled) {
        const codeSuffix = lastErr?.code ? ` (code: ${lastErr.code})` : '';
        setProfileError((lastErr?.message || 'Could not set up your account.') + codeSuffix);
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [retryTick]);

  const retryProfileSetup = () => setRetryTick((t) => t + 1);

  return { user, loading: user === undefined, profileReady, profileError, retryProfileSetup };
}

async function ensureManagerProfile(user) {
  const ref = doc(db, 'managers', user.uid);
  const snap = await getDocFromServer(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Manager'),
      email: user.email || '',
      createdAt: serverTimestamp(),
    });
  }
}

export async function signIn(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function changeOwnPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Not signed in.');
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}
