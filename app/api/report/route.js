// Read-only JSON export of the scorecard data, for Power BI / Excel.
//
// The scorecard's Firestore data is login-protected (see firestore.rules), so
// this endpoint reads it with the Firebase Admin SDK using a service-account
// key. It only READS Firestore — it never writes or deletes.
//
// Required Vercel environment variable:
//   FIREBASE_SERVICE_ACCOUNT  = the full contents of a service-account JSON key
//     (Firebase console -> Project settings -> Service accounts ->
//      Generate new private key). Paste the whole file as the value.
//
// Optional:
//   REPORT_KEY  = a secret; when set, callers must use /api/report?key=THE_KEY.
//
// Sanity-check in a browser:  https://<your-app>.vercel.app/api/report

import { NextResponse } from 'next/server';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { METRICS } from '@/lib/scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set.');
  const parsed = JSON.parse(raw);
  // Some hosts escape the newlines in the private key; normalize them back.
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}

function adminDb() {
  const app = getApps().length ? getApp() : initializeApp({ credential: cert(getServiceAccount()) });
  return getFirestore(app);
}

// Turn Firestore Timestamps into ISO strings so Power BI can read them.
function iso(value) {
  return value instanceof Timestamp ? value.toDate().toISOString() : value ?? null;
}

export async function GET(request) {
  const reportKey = process.env.REPORT_KEY;
  if (reportKey) {
    const key = new URL(request.url).searchParams.get('key');
    if (key !== reportKey) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  try {
    const db = adminDb();

    // Manager display names, keyed by uid.
    const managersSnap = await db.collection('managers').get();
    const managerName = new Map();
    managersSnap.forEach((m) => {
      const d = m.data();
      managerName.set(m.id, d.displayName || d.email || m.id);
    });

    // All nurses, then each nurse's monthly score entries. One flat row per
    // (nurse, month), with each metric split into its own column plus the total.
    const nursesSnap = await db.collection('nurses').get();
    const rows = [];

    for (const nurseDoc of nursesSnap.docs) {
      const nurse = nurseDoc.data();
      const entriesSnap = await nurseDoc.ref.collection('entries').get();

      for (const entryDoc of entriesSnap.docs) {
        const e = entryDoc.data();
        const scores = e.scores || {};
        const year = e.year ?? null;
        const month = e.month ?? null;

        const row = {
          nurseId: nurseDoc.id,
          nurse: nurse.name ?? '',
          managerId: nurse.managerId ?? '',
          manager: nurse.managerId ? managerName.get(nurse.managerId) ?? '' : '',
          active: nurse.active !== false,
          year,
          month,
          monthKey: year && month ? `${year}-${String(month).padStart(2, '0')}` : '',
          total: e.total ?? null,
          updatedAt: iso(e.updatedAt),
        };

        // One column per metric (reliability, productivity, quality, ...).
        for (const m of METRICS) {
          const v = scores[m.key];
          row[m.key] = v === undefined ? null : v;
        }

        rows.push(row);
      }
    }

    return NextResponse.json(rows, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
