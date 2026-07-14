# Handoff: RN Scorecard — Realtime Multi-User Portal

## Overview
A portal for nurse managers to enter monthly performance scores for their Registered Nurses (RNs) and view monthly, quarterly, and annual scorecard averages. Each RN is scored on 6 weighted metrics per month; the app auto-calculates the weighted monthly total, the quarterly average, and annual average, and flags quarterly bonus eligibility.

The prototype in this bundle (`Scorecard Portal.dc.html`) is **fully working but single-device**: all data lives in the browser's `localStorage` and the lock is a client-side PIN. The goal of this handoff is to rebuild it as a **realtime, multi-user web app** backed by **Firebase** (Auth + Firestore) and deployed on **Vercel**.

## About the Design Files
The file in this bundle is a **design reference created in HTML** — a prototype showing the intended look, layout, and behavior. It is **not production code to copy directly**. The task is to **recreate this design in a real front-end framework** (recommended: **Next.js / React**, which deploys natively to Vercel) using Firebase for data and auth, while preserving the exact visual design, layout, copy, and calculations documented below.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interactions are final. Recreate the UI faithfully. All exact values are in the Design Tokens section.

---

## Recommended Architecture (Firebase + Vercel)

- **Hosting:** Vercel (static/SSR). A **Next.js (App Router)** app is the cleanest fit and deploys to Vercel with zero config.
- **Auth:** Firebase Authentication. Replace the demo PIN gate with real accounts.
  - Recommended: Email/Password (or Google) sign-in for managers. Each authenticated user is a **manager**.
  - The old "PIN" concept maps to **login**. "Change PIN" maps to **change password** (`updatePassword`) or a Firebase password-reset email. Drop the client-side PIN entirely — it is not secure.

### Roles: admin vs. manager (IMPORTANT)
There are **two roles**:
- **Manager** — signs in, enters/edits scores for their own nurses, views roster/dashboards/bonus report.
- **Admin** — everything a manager can do **plus** the exclusive right to **change the lock code / security settings** (and, recommended, to create manager accounts and reassign nurses).

In the prototype this is modeled with a separate **admin code** (default `1234`): the "Change lock code" dialog now requires the admin code to authorize a change — a plain manager cannot change it. The unlock/lock code (default `2468`) is what managers use to get in.

In production, implement the role with Firebase, not a shared code:
- Add `role: "admin" | "manager"` on `managers/{uid}` (or use **Firebase custom claims**, e.g. `admin: true`, set via a trusted Cloud Function / Admin SDK — never settable from the client).
- Gate all security-setting and code/password-policy changes behind `role == "admin"` (or the custom claim) in **both** the UI and **Firestore/Function security rules**.
- The "Change lock code" screen becomes an **admin-only settings** page (route-guard it and enforce server-side). Managers changing their *own* password is normal Firebase Auth and is fine; changing org-wide security settings is admin-only.

Example rule guard (custom-claim version):
```
function isAdmin() { return request.auth.token.admin == true; }
match /orgSettings/{doc} {
  allow read: if signedIn();
  allow write: if isAdmin();
}
```
- **Database:** Cloud Firestore with **realtime listeners** (`onSnapshot`) so any score a manager enters appears live for everyone viewing that data.
- **Environment variables on Vercel** (Project → Settings → Environment Variables):
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - (The `NEXT_PUBLIC_` Firebase web config keys are safe to expose to the client; security is enforced by Firestore rules + Auth, not by hiding these.)

### Firestore data model

```
managers/{managerId}                         // managerId === Firebase Auth uid
  displayName: string
  email: string
  createdAt: timestamp

nurses/{nurseId}
  name: string
  managerId: string                          // owning manager's uid
  active: boolean                            // soft-delete instead of hard delete
  createdAt: timestamp

nurses/{nurseId}/entries/{YYYY-MM}           // one doc per month, id e.g. "2026-03"
  year: number                               // 2026
  month: number                              // 1..12
  scores: {                                  // each value is one of 1,2,3,3.5,4,4.5,5 or "NA"
    reliability: number|"NA",
    productivity: number|"NA",
    quality: number|"NA",
    refusal: number|"NA",
    careplan: number|"NA",
    compliance: number|"NA"
  }
  total: number|null                         // denormalized weighted avg (see Calculations); null if all NA
  updatedBy: string                          // manager uid
  updatedAt: timestamp
```

Notes:
- Store `total` denormalized so roster/bonus lists don't recompute on read, but ALWAYS recompute on write from `scores` (never trust a client-supplied total in rules-sensitive contexts).
- Use `nurses/{id}.active = false` for removal so historical entries survive.

### Realtime behavior
- **Roster view:** `onSnapshot` on `nurses where managerId == currentUser.uid` (and their latest entries). New/edited scores from any device update the roster live.
- **Nurse dashboard:** `onSnapshot` on `nurses/{id}/entries where year == 2026`.
- **Bonus report:** derive from the same entries listeners; no separate collection needed.
- Two managers editing different nurses never conflict (per-doc writes). If two people edit the same nurse-month, last-write-wins on that single month doc is acceptable; optionally show `updatedBy`/`updatedAt`.

### Security rules (starting point)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }

    match /managers/{uid} {
      allow read: if signedIn();
      allow write: if signedIn() && request.auth.uid == uid;
    }

    match /nurses/{nurseId} {
      allow read: if signedIn();
      // only the owning manager can create/edit/deactivate their nurses
      allow create: if signedIn() && request.resource.data.managerId == request.auth.uid;
      allow update, delete: if signedIn() && resource.data.managerId == request.auth.uid;

      match /entries/{entryId} {
        allow read: if signedIn();
        allow write: if signedIn()
          && get(/databases/$(database)/documents/nurses/$(nurseId)).data.managerId == request.auth.uid;
      }
    }
  }
}
```
Decide the org's visibility policy: the rules above let any signed-in manager *read* all nurses but only *edit their own*. If managers must not see each other's nurses, change nurse/entry `read` to the same owner check as write.

---

## Screens / Views

The app is a single-page layout with a dark header (brand + manager filter + Change-PIN + Lock), a tab bar (Team Roster · Enter Scores · Bonus Report), and a light content area. A separate full-screen Lock screen gates entry.

### 1. Lock / Sign-in screen
- **Purpose:** Gate access. In production this becomes the Firebase **sign-in** screen.
- **Layout:** Full-viewport, centered card (max-width 400px) on a solid dark `#233B3C` background. Card is `#F4F1EA`, radius 18px, padding 40px 36px, shadow `0 30px 70px rgba(0,0,0,.35)`.
- **Components:** Brand row (28–34px teal rounded-square badge reading "RN" + wordmark "Scorecard"), a padlock icon tile (`#EAE4D6`, radius 14px), heading "Scores are locked" (Space Grotesk 24px/600), subtext, a centered password input, error text (`#A3331F`), full-width primary button "Unlock" (`#0E5B57`). Prototype shows a demo-PIN hint — **remove in production**.
- **Production:** Replace with email + password fields, "Sign in" button, "Forgot password?" (Firebase reset email). No demo hint.

### 2. Header (persistent)
- **Layout:** Full-width bar, `#233B3C`, inner max-width 1220px, padding 16px 28px, flex row.
- **Components:**
  - Brand: 32px teal (`#0E5B57`) rounded-square badge "RN" (Space Grotesk 700, 13px) + wordmark "Scorecard" (Space Grotesk 600, 15px) with sub-line "RN Performance · FY2026" (`#9fb2b0`, 11px).
  - Right cluster: "Manager" label + a **manager filter** `<select>` (`All managers` + one option per manager), a **Change PIN** button (→ change-password in prod), a **Lock** button (→ sign-out in prod). Both buttons: transparent bg, `1px solid #3d5a5b`, `#cdd9d7` text, radius 9px, padding 8px 13px.
- **Tab bar:** below header, three buttons. Active tab: text `#233B3C` on `#F4F1EA` bg, radius 9px 9px 0 0. Inactive: `#9fb2b0` text, transparent.

### 3. Team Roster
- **Purpose:** See all of a manager's nurses at a glance; entry point to each nurse's dashboard; add/remove nurses.
- **Layout:** Header row with title "Team Roster" + count/scope subtitle on the left; on the right a search input (260px), an outline **Add Nurse** button, and a solid **New Entry** button. Below: a white card (radius 14px, `1px solid #E7E2D8`) containing a table.
- **Add Nurse form** (toggled, white card above table): fields **Full name** (text), **Manager** (`<select>` of managers + "+ Add new manager…" which reveals a **New manager name** text field), plus **Add** (solid) and **Cancel** (outline) buttons. Inline error text on validation.
- **Table columns:** Nurse (avatar circle w/ initials + name + "Registered Nurse"), Manager, Latest (score pill), YTD Avg (score pill), Bonus Qtrs (e.g. "2/2"), Status (pill: On track / Below target / No data), and a trailing trash icon (remove, with confirm).
  - Header row: `#FAF8F2` bg, 11.5px uppercase `#7b847f`, letter-spacing .06em.
  - Rows: 1px `#F0ECE2` bottom border, whole row clickable → nurse dashboard.
- **Search:** filters by nurse name (case-insensitive). Empty state: "No nurses match your search."

### 4. Enter Scores
- **Purpose:** Enter/edit one nurse's scores for one month; see the weighted total compute live.
- **Layout:** Two-column grid (`1.4fr 1fr`, gap 24px), max-width 940px. Left = form card; right = sticky dark summary card.
- **Header:** title "Enter Monthly Scores" + an outline **Scoring Key** toggle button. Intro line: "Score each metric 1–5 (or NA). The monthly total is the weighted average, calculated automatically."
- **Scoring Key panel** (toggled): white card with a reference table — rows = 6 metrics (label + weight), columns = score values `5, 4.5, 4, 3.5, 3, 2, 1` (each a colored pill header), cells = the raw-performance threshold for that score. Values in the Calculations section.
- **Form card:** Nurse `<select>` + Month `<select>` (Jan–Dec, FY2026) on a 2-col grid. Then 6 rows, one per metric: label + "Weight NN%" on the left, a `<select>` on the right with options `— / 1 / 2 / 3 / 3.5 / 4 / 4.5 / 5 / NA`. **Save Scorecard** button; inline success ("Saved — {First} scored {total} for {Month}.") or error ("Please score every metric before saving.").
- **Summary card (dark `#233B3C`):** "Weighted Monthly Total", a large number (Space Grotesk 54px) `/ 5.0`, a status chip ("Bonus eligible pace" ≥3.5 / "Below bonus threshold" / "Complete all 6 metrics"), a note about the 3.5 bonus rule, and (when editing an existing month) an "Editing an existing entry" chip.
- **Behavior:** changing nurse or month reloads existing saved scores into the form if present. Total shows only when all 6 are set (NA counts as set).

### 5. Nurse Dashboard
- **Purpose:** One nurse's full-year view.
- **Layout:** "Back to roster" link; header with avatar, name, "Reports to {manager}", and a nurse-switcher `<select>`. Then: 3 summary stat cards (Latest Month, YTD Average, Bonus Quarters), a row of 4 quarterly cards (Q1–Q4, each with avg, "Bonus"/"No bonus"/"—" badge, months-scored count; eligible quarters get a green highlighted border), and a **Monthly Breakdown** table.
- **Monthly Breakdown table:** rows = Jan–Dec; columns = the 6 metric short labels (Rel, Prod, Qual, Ref, Care, Comp) with weight beneath each header, plus a **Total** column (score pill). Months with no data render at 50% opacity with "—".

### 6. Bonus Report
- **Purpose:** Per-quarter bonus eligibility across the manager's team; export.
- **Layout:** Title "Bonus Eligibility" + subtitle "Quarterly average ≥ 3.5 qualifies for the bonus · {scope}". Right side: a quarter `<select>` (Q1–Q4) and a solid **Export CSV** button. Then 3 stat cards (Eligible / Not Eligible / Not Yet Scored) and a table.
- **Table columns:** Nurse (avatar + name), Months Scored (n/3), {Quarter} Avg (score pill), Bonus (pill: Eligible / Not eligible / Pending). Sorted highest average first.
- **CSV export:** downloads `RN-Scorecard-Bonus-Q{n}-2026.csv` with headers `Nurse, Manager, Quarter, Months Scored, Quarterly Average, Bonus Eligible`, UTF-8 BOM, CRLF line endings, sorted highest-first.

---

## Interactions & Behavior
- **Navigation:** tab bar switches views; clicking a roster row opens that nurse's dashboard; "New Entry" / "Add Nurse" open the Enter Scores view / add form.
- **Live calc:** the Enter Scores total recomputes on every metric change (see Calculations).
- **Manager filter:** the header `<select>` scopes roster, bonus report, and entry nurse list to one manager (or all). In production, default scope = the signed-in manager's own nurses.
- **Add manager inline:** choosing "+ Add new manager…" in the Add Nurse form reveals a name field; on save it creates the manager and assigns the nurse. In production, creating a manager = inviting/creating another Auth user — decide whether managers can do this or only an admin.
- **Remove nurse:** trash icon → `window.confirm` → remove. In production, prefer soft-delete (`active=false`).
- **Change lock code (admin-only):** modal requires the **admin code** to authorize, then a new lock code + confirm (≥4 digits, must match). A manager without the admin code cannot change it. In production this is an admin-gated settings action enforced in security rules; individual managers change their own password via Firebase `reauthenticateWithCredential` + `updatePassword`.
- **Persistence:** prototype writes to `localStorage` on every change. Production writes each nurse/entry as a Firestore document and relies on `onSnapshot` for realtime updates.
- **Validation:** all 6 metrics required before a month can be saved; new PIN ≥ 4 digits and must match confirmation; nurse name required; new-manager name required when that option is chosen.

## Calculations (must match exactly)

**Metrics & weights** (sum = 100%):
- Reliability 15%, Productivity 20%, Quality 20%, Refusal Rate 15%, Care Plan Completion 20%, Compliance 10%.

**Score options per metric:** `1, 2, 3, 3.5, 4, 4.5, 5`, or `NA`.

**Weighted monthly total:**
- Exclude any metric marked `NA` — drop its weight and renormalize across the remaining metrics.
- `total = Σ(score_i × weight_i) / Σ(weight_i)` over non-NA metrics.
- If every metric is `NA`, total = `null` (no score).
- If any metric is blank/unset, the month is incomplete (cannot save; total not shown).
- **Display to 1 decimal place** (e.g. `4.3`, `2.5`) — round half-up: `(Math.round(v*10)/10).toFixed(1)`.

**Quarterly average:** mean of the monthly totals present within the quarter (Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec). Only months with a total count.

**Annual (YTD) average:** mean of all months in the year that have a total.

**Bonus eligibility:** a nurse is eligible for a quarter when that **quarter's average ≥ 3.5**.

**Scoring Key — raw-performance thresholds** (reference table shown on Enter Scores):
- **Reliability** (attendance vs. scheduled shifts): 100%→5, 99%→4.5, 97%→4, 96%→3.5, 95%→3, 90%→2, <90%→1.
- **Productivity** (calls completed as scheduled): 100%→3.5. Other tiers **TBD** (not yet defined by the business — show "TBD").
- **Quality:** 100%→5, 98%→4.5, 97%→4, 95%→3.5, 93%→3, 92%→2, <90%→1.
- **Refusal Rate:** ≤2%→5, 3%→4.5, 4%→4, 5%→3.5, 6%→3, 7%→2, ≥8%→1.
- **Care Plan Completion:** 100%→5, 98%→4.5, 96%→4, 95%→3.5, 94%→3, 92%→2, <92%→1.
- **Compliance:** >100% (completes additional training)→5, 4.5→NA, 4→NA, 100%→3.5, 95%→3, 90%→2, <90%→1.

## State Management
Prototype state (per view) → production equivalent:
- `locked / pinInput` → Firebase Auth session (`onAuthStateChanged`).
- `managerId` filter, `search`, `view`, `selectedNurseId`, `bonusQuarter` → local UI state (React `useState`/URL params).
- `form` (nurseId, month, 6 scores, saved/err messages, existed flag) → local form state; on save → Firestore `setDoc` on `nurses/{id}/entries/{YYYY-MM}`.
- `nurses`, `entries`, `managers`, `pin` (the prototype's `data` object in `localStorage`) → Firestore collections + realtime listeners.
- PIN-change modal state → change-password flow.

## Design Tokens
**Colors**
- Background (app): `#F4F1EA`
- Surface / cards: `#FFFFFF`; card border `#E7E2D8`; table header bg `#FAF8F2`; row border `#F0ECE2` / `#F2EEE4`
- Ink / text: primary `#1B2A2C`, secondary `#4b5654` / `#6b7674`, muted `#98a09d` / `#7b847f`, faint `#b3b8b2`
- Primary teal: `#0E5B57` (hover `#0a413e`)
- Dark header / dark cards: `#233B3C`; on-dark subtext `#9fb2b0`; on-dark control border `#3d5a5b`; on-dark control bg `#2f4b4c`
- Score/status color scale (foreground / background pill):
  - ≥4.5 → `#0F6B3E` / `#E1F0E7`
  - ≥3.5 (bonus threshold) → `#0E5B57` / `#DCEBEA`
  - ≥3 → `#8A5A12` / `#F5E9D2`
  - <3 → `#A3331F` / `#F6E0DA`
  - no data → `#98a09d` / `#EDEAE1`
- Success text `#0F6B3E`; error text `#A3331F`; warning accent `#e0b96b`

**Typography**
- Display / numbers / headings: **Space Grotesk** (400/500/600/700), with `font-variant-numeric: tabular-nums` for score columns.
- Body / UI: **Public Sans** (400/500/600/700).
- Sizes: page H2 26px/600 (letter-spacing -.02em); card titles 15px/600; big stat numbers 30–32px/600; live total 54px/600; table body 13.5–14px; labels 11.5–12px uppercase, letter-spacing .05–.06em.

**Spacing / shape**
- Content max-width 1220px (940px on Enter Scores), page padding 28–30px.
- Card radius 13–14px; pill/badge radius 8px (score pills) / 20px (status pills); button radius 9–11px.
- Card border `1px solid #E7E2D8`; standard card padding 18–26px.

**Shadows**
- Modal / lock card: `0 30px 70px rgba(0,0,0,.35)`.

## Assets
- **Fonts:** Google Fonts — Public Sans + Space Grotesk. Self-host or use `next/font` in production.
- **Icons:** inline SVG (lock, search, plus, user-plus, trash, download, back-chevron, info, key, check). No external icon library required; swap for the codebase's icon set if one exists.
- No raster images or logos — brand mark is a text badge ("RN"). Replace with a real logo if available.

## Files
- `Scorecard Portal.dc.html` — the complete working prototype (design reference). It is a self-contained single-file app (custom lightweight component runtime + inline styles). Read it for exact markup, copy, and the reference implementation of every calculation, but rebuild the UI in the target framework rather than copying this file.

## Suggested build order
1. Next.js app on Vercel + Firebase SDK init from env vars.
2. Auth (sign-in/out, change password) replacing the lock/PIN.
3. Firestore schema + security rules; seed one manager + a few nurses.
4. Roster with realtime listener; Add/remove nurse.
5. Enter Scores form + exact weighted calc + write to Firestore.
6. Nurse dashboard (monthly/quarterly/annual) from listeners.
7. Bonus report + CSV export.
8. Lock down read/visibility policy; QA the calculations against the prototype.
