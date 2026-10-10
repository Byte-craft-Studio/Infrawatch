# 0002: Schema additions from mobile implementation

Status: Proposed — needs backend/privacy sign-off before implementing in Firestore rules
Date: (fill in today's date)
Author: Mobile lead
Related: 0001-v1-decisions.md

While building the citizen app and feed, the following fields were added
beyond the original schema draft in 0001. None of these are live — they
exist in mobile mock data only, shaped to match what the real documents
should look like once Firestore is wired in. This record exists so
backend/data and privacy can review and approve before implementation.

## 1. `reports_private` — category list expanded

Original: `pothole | broken_light | water_leak | other`

New: `pothole | broken_light | water_leak | blocked_drainage | garbage_dumping | damaged_road | fallen_tree | broken_signage | flooding | other`

Reasoning: four categories were too narrow for what citizens actually
report. If Firestore security rules or validation logic hard-code the
original four, real submissions using the new categories will be
rejected.

## 2. `reports_private` — new field: `durationEstimate`

durationEstimate: “just_noticed” | “few_days” | “few_weeks” | “months” | “over_a_year” | “not_sure”


Reasoning: citizens are asked how long the problem has existed, as a
structured value rather than free text, so it can feed the AI priority
score later (an old pothole likely weighs differently than one from
today). This is the citizen's own estimate at the time of reporting —
distinct from the actual elapsed time, which the app calculates
separately from `reportedAt` wherever it's displayed.

## 3. `reports_private` — description is now required, not optional

The capture form validates that `description` is non-empty before
allowing submission. No schema change, but worth noting the field
can no longer be assumed empty/null in private records going forward.

## 4. `reports_public` — proposed new field: `description`

The original schema (0001) deliberately excluded `description` from
`reports_public`, keeping the full picture private to officials. The
Feed screen's detail view now shows each report's description to
other citizens, which means this field needs to move into
`reports_public`.

**Flag for privacy review:** description text is free-form and could
incidentally contain identifying details (e.g. "the leak outside
John's shop", a landmark tied to someone's home or business) in a way
a photo alone might not. Worth deciding whether this needs any
filtering/warning to the citizen at submission time, or whether it's
accepted as-is for v1.

## 5. `reports_public` and `reports_private` — proposed new field: `office`

office: string | null // e.g. “Tharaka Nithi County Roads Department”


Reasoning: citizens asked for official-sounding status messages, e.g.
"Handled by [office]" instead of a bare status label. This requires
knowing *which* office is responsible for a given report, which the
schema doesn't currently capture (0001 has `assignedDepartment` as a
private-only field, similar in spirit — recommend consolidating
`office` and `assignedDepartment` into one field rather than keeping
both, since they'd otherwise drift).

Null until an official assigns the report; the detail screen shows
"Awaiting review" when null and status is `received`.

## 6. `reports_public` — proposed new field: `upvoteCount`

upvoteCount: number


Distinct from `confirmationCount` (0001), which tracks citizens
confirming a *fix*. `upvoteCount` tracks citizens signaling a problem
is severe/affects them, before it's fixed — intended as a priority
signal alongside AI severity scoring.

**Needs its own abuse protection**, same as confirmation: one vote per
citizen per report, enforced via a per-user vote record (not just an
incrementing counter), so a single citizen can't inflate a report's
priority. Mobile currently mocks this with a local `userHasUpvoted`
boolean per report — the real version needs a subcollection or a
`votes/{reportId}_{userId}` document pattern, written transactionally.
This depends on Phase D (auth) for a stable per-user ID.

## Summary of what backend/data + privacy need to decide

- [ ] Approve expanded category list (item 1) — low risk, just needs to match in validation/rules
- [ ] Approve `durationEstimate` field (item 2) — low risk, new field only
- [ ] Approve moving `description` into `reports_public` (item 4) — privacy review needed
- [ ] Approve `office` field, and whether to merge it with `assignedDepartment` (item 5)
- [ ] Approve `upvoteCount` + per-user vote record pattern (item 6) — depends on Phase D auth
