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
    return onSnapshot(q, (snap) => {
      setManagers(snap.docs.map((d) => ({ id: d.id, name: d.data().displayName || d.data().email || d.id })));
    });
  }, []);
  return managers;
}

export function useNurses() {
  const [nurses, setNurses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const q = query(collection(db, 'nurses'), where('active', '==', true));
    return onSnapshot(q, (snap) => {
      setNurses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoaded(true);
    });
  }, []);
  return { nurses, loaded };
}

// Map of nurseId -> { "YYYY-MM": { scores, total } } for the current year, realtime.
export function useEntriesByYear(year = DEFAULT_YEAR) {
  const [entriesByNurse, setEntriesByNurse] = useState({});
  useEffect(() => {
    const q = query(collectionGroup(db, 'entries'), where('year', '==', year));
    return onSnapshot(q, (snap) => {
      const map = {};
      snap.forEach((d) => {
        const nurseId = d.ref.parent.parent.id;
        if (!map[nurseId]) map[nurseId] = {};
        map[nurseId][d.id] = d.data();
      });
      setEntriesByNurse(map);
    });
  }, [year]);
  return entriesByNurse;
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
