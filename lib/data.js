'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_YEAR, computeTotal, entryId } from './scoring';

export function useManagers() {
  const [managers, setManagers] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'managers'), orderBy('displayName'));
    return onSnapshot(
      q,
      (snap) => {
        setManagers(snap.docs.map((d) => ({ id: d.id, name: d.data().displayName || d.data().email || d.id })));
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
export function useEntriesByYear(year = DEFAULT_YEAR) {
  const [entriesByNurse, setEntriesByNurse] = useState({});
  const [error, setError] = useState('');
  useEffect(() => {
    setError('');
    const q = query(collectionGroup(db, 'entries'), where('year', '==', year));
    return onSnapshot(
      q,
      (snap) => {
        const map = {};
        snap.forEach((d) => {
          const nurseId = d.ref.parent.parent.id;
          if (!map[nurseId]) map[nurseId] = {};
          map[nurseId][d.id] = d.data();
        });
        setEntriesByNurse(map);
      },
      (err) => {
        console.error('Failed to load scores (entries listener):', err, { code: err?.code });
        setError(err?.message || 'Could not load saved scores.');
      }
    );
  }, [year]);
  return { entriesByNurse, error };
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

export async function updateNurseManager(nurseId, managerId) {
  await updateDoc(doc(db, 'nurses', nurseId), { managerId });
}

export async function saveEntry({ nurseId, year, month, scores, uid }) {
  const total = computeTotal(scores);
  await setDoc(doc(db, 'nurses', nurseId, 'entries', entryId(year, month)), {
    year: Number(year),
    month: Number(month),
    scores,
    total,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });
  return total;
}
