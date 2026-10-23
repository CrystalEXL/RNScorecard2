'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_YEAR, computeTotal, entryId } from './scoring';

// Excludes managers flagged `hidden: true` (e.g. an admin account that
// shouldn't appear as a case-manager choice) — filtered client-side so
// hiding one doesn't require a Firestore index.
export function useManagers() {
  const [managers, setManagers] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'managers'), orderBy('displayName'));
    return onSnapshot(
      q,
      (snap) => {
        setManagers(
          snap.docs
            .filter((d) => !d.data().hidden)
            .map((d) => ({ id: d.id, name: d.data().displayName || d.data().email || d.id }))
        );
      },
      (err) => console.error('Failed to load managers:', err, { code: err?.code })
    );
  }, []);
  return managers;
}

export function useNurses() {
  const [nurses, setNurses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const q = query(collection(db, 'nurses'), where('active', '==', true));
    return onSnapshot(
      q,
      (snap) => {
        setNurses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoaded(true);
      },
      (err) => {
        console.error('Failed to load nurses:', err, { code: err?.code });
        setError(err?.message || 'Could not load the roster.');
        setLoaded(true);
      }
    );
  }, []);
  return { nurses, loaded, error };
}

// Map of nurseId -> { "YYYY-MM": { scores, total } } for the current year, realtime.
// One small listener per nurse (rather than a single collection-group query across
// all nurses) so this needs no special index beyond Firestore's automatic defaults.
export function useEntriesByYear(nurseIds, year = DEFAULT_YEAR) {
  const [entriesByNurse, setEntriesByNurse] = useState({});
  const [error, setError] = useState('');
  const idsKey = (nurseIds || []).join(',');

  useEffect(() => {
    setError('');
    const ids = idsKey ? idsKey.split(',') : [];
    if (!ids.length) {
      setEntriesByNurse({});
      return;
    }
    const unsubscribers = ids.map((nurseId) => {
      const q = query(collection(db, 'nurses', nurseId, 'entries'), where('year', '==', year));
      return onSnapshot(
        q,
        (snap) => {
          setEntriesByNurse((prev) => {
            const nurseEntries = {};
            snap.forEach((d) => { nurseEntries[d.id] = d.data(); });
            return { ...prev, [nurseId]: nurseEntries };
          });
        },
        (err) => {
          console.error(`Failed to load scores for nurse ${nurseId}:`, err, { code: err?.code });
          setError(err?.message || 'Could not load saved scores.');
        }
      );
    });
    return () => unsubscribers.forEach((u) => u());
  }, [idsKey, year]);

  return { entriesByNurse, error };
}

// Nurses who have been removed or resigned (active === false).
export function useFormerNurses() {
  const [nurses, setNurses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const q = query(collection(db, 'nurses'), where('active', '==', false));
    return onSnapshot(
      q,
      (snap) => {
        setNurses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoaded(true);
      },
      (err) => {
        console.error('Failed to load former staff:', err, { code: err?.code });
        setLoaded(true);
      }
    );
  }, []);
  return { nurses, loaded };
}

export async function addNurse({ name, managerId }) {
  await addDoc(collection(db, 'nurses'), {
    name,
    managerId,
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function deactivateNurse(nurseId) {
  await updateDoc(doc(db, 'nurses', nurseId), { active: false });
}

// Resignation: records when they left and hides them the same way deactivateNurse
// does (active: false), so historical scores/entries are kept, not deleted.
export async function setNurseEndDate(nurseId, endDate) {
  await updateDoc(doc(db, 'nurses', nurseId), { endDate, active: false });
}

export async function reactivateNurse(nurseId) {
  await updateDoc(doc(db, 'nurses', nurseId), { active: true, endDate: null });
}

export async function updateNurseManager(nurseId, managerId) {
  await updateDoc(doc(db, 'nurses', nurseId), { managerId });
}

export async function saveEntry({ nurseId, year, month, scores, uid, onLeave = false }) {
  const total = computeTotal(scores);
  await setDoc(doc(db, 'nurses', nurseId, 'entries', entryId(year, month)), {
    year: Number(year),
    month: Number(month),
    scores,
    total,
    onLeave,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });
  return total;
}

export async function deleteEntry({ nurseId, year, month }) {
  await deleteDoc(doc(db, 'nurses', nurseId, 'entries', entryId(year, month)));
}
