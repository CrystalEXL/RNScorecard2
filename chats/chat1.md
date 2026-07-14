# Nurse Monthly Scorecard Portal

_Started 2026-07-14 19:23 UTC_

---

## User

Create a Monthly Score Card portal for managers to enter the monthly scores for their nurses. The portal should allow the manager to view the monthly, quarterly and annual score card average. The score card has 6 weighted metrics the RN is scored on each month. Radiality =15%  Productivity =20%, Quality=20%, Refusal Rate=15%, Care Plan completion rate=20% and Compliance=10%. The RN receives a score of 1, 2, 3, 3.5, 4, 4.5 or 5 for each section. Nurses who earn a total score of 3.5 or greater receive a quarterly bonus. I would like the manager to manually ad the score for each month and the portal to automatically calculate the monthly and quarterly score.

## Assistant

Let me explore the design system first.

_[tool: list_files]_

_[tool: list_files]_

The design system project is empty, so I'll follow the frontend design skill for visual direction. Let me ask a few focused questions before building.

_[tool: questions_v2]_

## User

Questions answered:
- scope: A working interactive prototype (data persists in the browser, live calculations)
- nurses: Large (20+, needs search/filter)
- scoring_math: Weighted average of the 6 metric scores (each 1–5), giving a total on the 1–5 scale
- quarterly: Average of the 3 monthly total scores in the quarter
- views: Entry form for a nurse's month, Team roster overview (all nurses at a glance), Bonus eligibility report, Per-nurse dashboard (monthly / quarterly / annual)
- bonus_detail: Just 3.5+ quarterly average = eligible
- extra: Nurses are assigned to specific managers. There needs to be a lock feature so that if someone gets the link, they cannot view the scores.

## Assistant

Both the design-system project and this project are empty, so I'll follow the frontend design skill and commit to a clean clinical-admin aesthetic (warm paper background, deep teal primary, Space Grotesk for numbers + Public Sans for text). Building the full working portal now.

_[tool: update_todos]_

_[tool: dc_write]_

Let me fix a stray typo in the roster row style.

_[tool: dc_html_str_replace]_

_[tool: show_html]_

_[tool: update_todos]_

Built the **Meridian Scorecard** portal — a working prototype with data persisted in the browser.

- **PIN lock gate** (demo PIN `2468`) so anyone with the link can't view scores; re-lock anytime from the header.
- **Team Roster** — 24 seeded nurses across 3 managers, searchable, with a manager filter; shows latest month, YTD average, and bonus-quarter tally.
- **Enter Scores** — pick a nurse + month, score all 6 weighted metrics (Radiality 15%, Productivity 20%, Quality 20%, Refusal 15%, Care Plan 20%, Compliance 10%); the weighted monthly total auto-calculates live and saves.
- **Nurse dashboard** — monthly breakdown matrix, quarterly averages (Q avg = average of the 3 monthly totals), YTD average, and bonus flags.
- **Bonus Report** — per-quarter eligibility (≥ 3.5 quarterly avg = eligible) with eligible/not/pending counts.

Sample data covers Jan–Jun 2026, so Q1 and Q2 are fully scored. Everything you enter persists in the browser and recalculates instantly.

_[tool: ready_for_verification]_

Portal is ready and out for review. Note: the manager assignment currently uses seeded names/units as placeholders — send me your real manager and nurse rosters and I'll swap them in.

## User

Change the name to RN Scorecard and add NA as an option for the manager to enter. NA should be pulled out of the final score when the poral calculates the score

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the rename in both the lock screen and header.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Renamed to **RN Scorecard** and added **NA** as a score option. When a metric is marked NA, its weight is dropped and the total is re-normalized across the remaining metrics (e.g. if Compliance is NA, the other five weights are rescaled so the total still lands on the 1–5 scale). If every metric is NA, the month shows no total.

_[tool: ready_for_verification]_

Done — renamed to RN Scorecard and NA is now selectable and excluded from the weighted calculation.

## User

how will I enter the names on the team roster

## Assistant

Right now names are seeded sample data with no way to add your own — let me add that. I'll put an **Add Nurse** button on the roster with a quick form (name, unit, manager) and a remove action per row.

_[tool: read_file]_

Now let me add the Add Nurse button, form panel, remove column, and the logic.

_[tool: dc_html_str_replace]_

Now the remove column in the roster table.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Now the logic: state, handlers, and the `onRemove` per row.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

You now enter names right on the **Team Roster**: click **Add Nurse** (top right), type the nurse's name and unit, pick their manager, and hit **Add** — they appear in the roster immediately and you can start entering scores for them under **Enter Scores**. Each row also has a trash icon to remove a nurse (with confirmation). Everything persists in your browser.

To start with a clean slate of your own people, add your nurses and delete the seeded sample rows.

_[tool: ready_for_verification]_

I'll add an **Export CSV** button to the bonus report that downloads the current quarter's eligibility list.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Added an **Export CSV** button on the Bonus Report. It downloads the selected quarter's list — nurse, unit, manager, months scored, quarterly average, and eligibility — sorted highest-first, opening cleanly in Excel or Sheets. The file is named by quarter (e.g. `RN-Scorecard-Bonus-Q2-2026.csv`).

_[tool: ready_for_verification]_

Done — the Bonus Report now has an Export CSV button that downloads the selected quarter's eligibility list.

## User

Add a key for the manger, reliablity = attendance  1<90%, 2=90%, 3= 95% 3.5=96% 4-97%, 4.5=99% 5=100% the nurse is here during their schedule shift. Productivity 100% of calls are completed as scheduled -3.5 TBD for the other scores for productivity. Quality 100%=5, 98%=4.5, 97%=4, 95%=3.5, 92%=2 <90% = 1; refusal rate = less or equal to 2%=5, 3%=4.5, 4%=4, 5%=3.5, 6%=3, 7%=2, > or equal to 8% = 1; Care Plan Completion - 100% =5 98%=4.5, 96%=4, 95%=3.5, 94%=3, 92%=2 less than 92%=1; Compliance >100% (completes additonal training)=5, 100%=3.5, 95%=3, 90%=2, <90%=1

## Assistant

Renaming Radiality → **Reliability** and adding a **Scoring Key** reference on the Enter Scores page.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the template: toggle button + key panel on the Enter Scores page.

_[tool: dc_html_str_replace]_

Renamed Radiality → **Reliability** and added a **Scoring Key** panel (toggle on the Enter Scores page) showing the raw-performance thresholds that map to each score:

- **Reliability** (attendance): 100%=5, 99%=4.5, 97%=4, 96%=3.5, 95%=3, 90%=2, <90%=1
- **Productivity**: 100%=3.5; other tiers marked TBD until you define them
- **Quality**: 100%=5, 98%=4.5, 97%=4, 95%=3.5, 92%=2, <90%=1
- **Refusal Rate**: ≤2%=5, 3%=4.5, 4%=4, 5%=3.5, 6%=3, 7%=2, ≥8%=1
- **Care Plan Completion**: 100%=5, 98%=4.5, 96%=4, 95%=3.5, 94%=3, 92%=2, <92%=1
- **Compliance**: >100% (extra training)=5, 100%=3.5, 95%=3, 90%=2, <90%=1

Send me the Productivity tiers (and Quality's "3" / Compliance's 4 & 4.5) whenever you finalize them and I'll drop them in.

_[tool: ready_for_verification]_

Done — Reliability rename and the Scoring Key reference are in place.

## User

quality's 3 =93%

## User

Compliance 4 and 4.5= NA

## User

Compliance 4 and 4.5= NA

## Assistant

_[tool: dc_js_str_replace]_

Updated — Compliance 4 and 4.5 now show NA in the Scoring Key.

## User

change the M on the main page to RN and remove the RN before Scorecard so it is not redundent

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Done — logo badge now reads **RN** and the title is just **Scorecard** on both the lock screen and the main header.

## User

remove Unit

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Now update the search filter and CSV export to drop unit.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Right now the Add Nurse form only lets you pick from existing managers — you can't type a new one. Let me fix that so you can add a manager on the fly.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Yes — you assign a manager when adding a nurse. The Manager dropdown lists existing managers, and I've now added a **"+ Add new manager…"** option: pick it and a name field appears so you can create the manager right there while adding the nurse. New managers then show up in the top-right manager filter too.

_[tool: ready_for_verification]_

Set — you can now add a new manager inline while adding a nurse.

## User

the weighted monthly score should only be 1 decimal point so 2.5 or 4.3 not 4.31

## Assistant

_[tool: dc_js_str_replace]_

Done — all computed scores (monthly total, quarterly, YTD, live preview) now show to 1 decimal, e.g. 4.3.

## User

I am ready to move this to production

## Assistant

Before you ship it, here's the honest readiness picture — this is a working prototype, and a couple of things matter for real production use:

- **Data is stored only in each person's browser** (localStorage). It is not shared between managers or devices, and it's lost if the browser cache is cleared. Real production needs a database/backend so scores are centralized and backed up.
- **The PIN is a demo gate, not secure authentication** — anyone technical can bypass it. Production needs real accounts/login and per-manager permissions.
- No audit trail, no server-side backup.

So this is production-ready for **single-user, single-device** use (one manager on one computer), but not yet for a shared multi-manager rollout. Let me give you a self-contained file you can use/host right now, then tell you the two paths forward.

_[tool: read_file]_

Adding a **Change PIN** option in the header so you can update the lock code.

_[tool: dc_html_str_replace]_

Now the modal. Let me add it right after the header's tabs block closes — inside the app div.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Added a **Change PIN** button in the header. It opens a dialog asking for your current PIN, then a new one (4+ digits) with confirmation. The new code is saved immediately and used for all future unlocks — the demo `2468` stops working once you change it.

_[tool: ready_for_verification]_

You can now change the lock code anytime from the **Change PIN** button in the header.

One heads-up for your production plan: because everything is stored in the browser, the PIN and scores live on each device separately. If you want a shared, secure, multi-manager version with real logins and a central database, I can prepare a developer handoff package to build that out — just say the word.

## User

I want this to be a realitime multiple user document I have a firebase account to back this up and vercel

## Assistant

This is a real engineering build now — realtime sync, auth, and secrets belong in code with your Firebase config, not in the prototype sandbox. The right move is a developer handoff package. Let me pull that up.

_[tool: read_skill_prompt]_

I'll build a developer handoff package tailored to your Firebase + Vercel stack — data model, realtime sync design, auth, security rules, and deploy notes — plus the working prototype as the design reference.

_[tool: write_file]_

Good — "change the code" should be admin-only. I'll gate the Change-PIN dialog behind a separate **admin code** in the prototype, and document an admin role in the handoff.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

Now copy the design file into the handoff folder, add the admin role to the README, and package it.

_[tool: copy_files]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: present_fs_item_for_download]_

Two things done:

1. **Admin-only lock code** — the Change lock code dialog now requires an **admin code** (demo: `1234`) to authorize; the manager unlock code stays `2468`. A manager without the admin code can't change it.

2. **Developer handoff package** (download above) — a full spec for rebuilding this as a realtime multi-user app on **Firebase + Vercel**: Firestore data model, realtime `onSnapshot` design, Auth replacing the PIN, **admin vs. manager roles** (with custom-claims + security-rule guards so only admins change security settings), exact calculations/scoring key, all design tokens, and a build order. The working prototype is included as the design reference.

Hand this folder to Claude Code (or any developer) to build the production version. Want me to add screenshots of each screen to the package?

_[tool: ready_for_verification]_

Ready — admin-only lock code is live in the prototype, and the Firebase + Vercel handoff package is available to download above.

## User

what is the admin code

## Assistant

The admin code is **`1234`** (the demo default). It's separate from the manager unlock code, which is **`2468`**.

Use `1234` in the "Change lock code" dialog to authorize changing the unlock code. In the production Firebase build, this becomes a real admin role instead of a shared code.

## User

use a different code for admin please

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Updated — the admin code is now **`4820`** (the manager unlock code stays `2468`).

## User

great, I am going to send the instructions for production to claude code

## Assistant

Sounds good. The handoff folder (`design_handoff_rn_scorecard`) has everything Claude Code needs — README spec, the working prototype, and `support.js`.

A couple of quick pointers to give Claude Code:
- Start from `README.md` — it has the Firebase + Vercel architecture, Firestore schema, security rules, the admin/manager roles, and exact calculations.
- Set the admin role via Firebase custom claims (server-side), not a shared code — the `4820` code in the prototype is just a stand-in.
- The exact scoring math and Scoring Key thresholds in the README must match; have it QA the calculations against the prototype.

If anything comes back with questions or you want screenshots added to the package, let me know.

## User

how do I send it to claude code from this screen

## Assistant

You can't launch Claude Code directly from here — this screen just generates the package. To get it there:

1. **Download the folder** — click the download card I posted above ("RN Scorecard — Developer Handoff"). It saves as a zip; unzip it.
2. **Put it in your project** — move the `design_handoff_rn_scorecard` folder into the repo (or a new empty folder) where you want the production app built.
3. **Open that folder in Claude Code** — in your terminal, `cd` into it and run `claude`, or open the folder in your IDE with the Claude Code extension.
4. **Prompt it** — something like: *"Read design_handoff_rn_scorecard/README.md and build this as a Next.js app on Vercel with Firebase Auth + Firestore, following the spec exactly."*

If you don't have Claude Code installed yet, it's at claude.com/product/claude-code. Want me to write out a ready-to-paste kickoff prompt for it?

