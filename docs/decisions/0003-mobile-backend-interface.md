# 0003: What mobile needs from backend

Status: Draft — for backend/data lead to review and confirm or adjust
Date: (fill in today's date)
Author: Mobile lead
Related: 0001-v1-decisions.md, 0002-mobile-schema-additions.md

This is a concrete handoff: what the mobile app currently sends, what
it expects to receive, and where each screen's placeholder logic needs
to be replaced with a real call. Everything below is built and working
against mock/placeholder data — swapping in the real backend should be
a drop-in replacement, not a rewrite, as long as shapes match.

## 1. Firebase project config (currently blocking everything)

Mobile has a placeholder config at `mobile/src/lib/firebase.ts`:

```ts
const firebaseConfig = {
  apiKey: 'PLACEHOLDER_API_KEY',
  authDomain: 'PLACEHOLDER.firebaseapp.com',
  projectId: 'PLACEHOLDER_PROJECT_ID',
  storageBucket: 'PLACEHOLDER.appspot.com',
  messagingSenderId: 'PLACEHOLDER_SENDER_ID',
  appId: 'PLACEHOLDER_APP_ID',
};
```

**Needed:** the real config object from Firebase console → Project
settings → General → Your apps (register a Web app or React Native
app to get this). Once dropped in, anonymous auth (already wired,
see item 2) should start working immediately with no other mobile
changes.

## 2. Auth

Mobile already calls `signInAnonymously()` on app launch
(`mobile/src/lib/AuthContext.tsx`) and expects a stable UID per
device/install. No login screen in v1 — every citizen gets an
anonymous identity automatically.

**Needed from backend:** Firebase Auth → Sign-in method → Anonymous,
enabled in the console. Nothing else; this is config, not code.

## 3. Submitting a report (ReportScreen)

Currently, on submit, mobile builds this object and either logs it
(online) or queues it locally in AsyncStorage (offline, see
`mobile/src/lib/offlineQueue.ts`):

```ts
{
  category: string,        // see expanded enum below
  description: string,     // now required, non-empty
  durationEstimate: string,// "just_noticed" | "few_days" | "few_weeks" | "months" | "over_a_year" | "not_sure"
  photoUrl: string,        // currently a local file:// URI — see note below
  location: { lat: number, lng: number },
  ward: string,            // currently always "" — mobile has no ward lookup yet
  reporterId: string | null, // currently always null — should become auth UID once wired
  reportedAt: string,      // currently ISO string — should become serverTimestamp()
  status: "received",
}
```

**Needed from backend:** a way for mobile to actually submit this,
ideally a Cloud Function (not a direct client write to Firestore —
see the reasoning in 0001, decision 2: the client should never write
`reports_public` directly, since fuzzing logic needs to live
server-side). Mobile needs to know:
- The function's name/trigger (callable function? HTTP endpoint?)
- Whether it uploads the photo itself, or expects mobile to upload
  to Storage first and pass a Storage URL
- What it returns on success (so mobile knows the submit worked and
  can show the success screen) and on failure (so mobile can show an
  error rather than a false success)

**Category list actually in use** (expanded from the original 4 — see
0002 item 1): `pothole | broken_light | water_leak | blocked_drainage
| garbage_dumping | damaged_road | fallen_tree | broken_signage |
flooding | other`

**Photo handling note:** right now `photoUrl` is a local device file
path, not a real URL. Someone needs to decide and confirm: does the
Cloud Function receive the raw image data and upload it itself
(simpler for mobile, needs the function to accept multipart/base64),
or does mobile upload directly to Firebase Storage first and pass the
resulting Storage URL to the function (simpler for the function, but
means the face-blur step — see 0001 decision 6 — needs to run as a
Storage-triggered function rather than inline in the submit function)?
This affects both sides' code, so needs a decision before either
side builds the real integration.

## 4. Feed screen — reading public reports

Feed currently renders mock data shaped like this (in
`mobile/src/screens/FeedScreen.tsx`):

```ts
{
  reportId: string,
  category: string,
  photoUrl: string,       // NEW — see 0002, not in original reports_public draft
  description: string,    // NEW — see 0002, needs privacy sign-off
  location: { lat: number, lng: number }, // fuzzed
  ward: string,
  office: string | null,  // NEW — see 0002, needs decision on merging with assignedDepartment
  reportedAt: string,
  status: string,
  confirmationCount: number,
  upvoteCount: number,    // NEW — see 0002, needs per-user vote tracking
  userHasUpvoted: boolean,// NEW — derived per-user, not stored on the report itself
}
```

**Needed from backend:** confirmation on the four `0002` schema
additions (description, office, upvoteCount, and the per-user vote
pattern), then the actual Firestore query mobile should run — most
likely `reports_public`, possibly filtered by ward or geographic
proximity once that's meaningful. For now, mobile would be fine
starting with an unfiltered query ordered by `reportedAt desc`, with
filtering added later.

**Upvote/confirm writes:** mobile currently mutates local state only.
Real version needs a transactional write pattern — a per-user vote
record (something like `votes/{reportId}_{uid}`) checked before
incrementing `upvoteCount`, so one citizen can't vote twice. This
depends on auth (item 2) being live first.

## 5. Map screen — reading public reports geographically

Same `reports_public` shape as Feed. Currently mobile loads all mock
reports unfiltered. **Open question for backend:** once there are
many reports, should mobile query everything and filter client-side,
or does backend want to expose a geo-bounded query (e.g. by map
viewport)? Not blocking for now — fine to start with an unfiltered
query, same as Feed — but worth deciding before report volume grows.

## 6. Profile screen — reading the citizen's own reports

Mobile expects to query `reports_private` filtered by
`reporterId == <current user's auth UID>`. This only returns the
signed-in citizen's own reports, never anyone else's — if that's not
how security rules are planned, mobile needs an alternative.

## 7. Offline queue — what "flush" should actually do

`mobile/src/lib/offlineQueue.ts` has a `flushQueue()` function that
currently just logs each queued report and discards it. Once item 3
above is resolved, `flushQueue()` should call the real submit
function for each item, and — this matters — **only remove an item
from the queue on confirmed success**. A failed attempt should stay
queued and retry on the next connectivity change, not silently
disappear. Worth backend knowing this exists, since a flaky submit
endpoint has a different failure mode here (retried) than it would
for a single online submit (shown as an error).

## Summary of decisions needed from backend/data lead

- [ ] Hand over real Firebase config (item 1) — unblocks everything else
- [ ] Enable Anonymous auth in Firebase console (item 2)
- [ ] Decide: Cloud Function shape for submit — callable vs HTTP, and what it returns (item 3)
- [ ] Decide: photo upload flow — function receives raw image vs. mobile uploads to Storage first (item 3)
- [ ] Confirm/adjust the four 0002 schema additions are approved (item 4)
- [ ] Decide: vote record pattern for upvotes (item 4)
- [ ] Confirm Profile's reporterId-filtered query matches planned security rules (item 6)
