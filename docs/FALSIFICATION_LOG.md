# Falsification Log

> **Ontology notice.** See [`../DIFFERENTIAL_FRAME.md`](../DIFFERENTIAL_FRAME.md).
> Claims here are recorded with the bounds they were tested under. A claim that
> failed is not deleted and replaced — it is kept with the run that ended it, so
> the next reader inherits the result instead of re-deriving it.

Each entry follows the same cycle: **claim → bounds assumed → run → result →
diagnosis → edited claim → invalid if**. Entries are append-only. When a claim
here is falsified again, add an entry rather than editing the old one.

Companion documents: [`../legacy/README.md`](../legacy/README.md) records
artifacts whose conditions stopped holding.

---

## 1. Polygon centroid as mean of all coordinates

**Claim.** Averaging every coordinate pair in a GeoJSON geometry yields a usable
marker position for an alert polygon.

**Bounds assumed.** Any geometry type; marker-level precision; dashboard zoom.

**Run.** Rectangle ring
`[[-93.0,45.0],[-93.0,45.4],[-92.6,45.4],[-92.6,45.0],[-93.0,45.0]]`.
Expected centre `45.2, -92.8`, computed independently by hand.

**Result. Falsified.** Returned `45.16, -92.84`.

**Diagnosis.** GeoJSON closes a ring by repeating its first position as its last.
The first corner was therefore counted twice out of five positions, dragging the
mean toward it by ~0.04° in both axes — roughly **5 km of displacement**, scaling
with polygon size. Every NWS warning polygon in the app was affected; the error
was invisible without an independently-computed expected value, because the
output was always *plausible*.

**Edited claim.** The mean of a ring's coordinates is a usable marker position
**once the repeated closing position is dropped per ring**. `geometryCentroid()`
now detects a closed ring (first position equals last) and excludes the duplicate.

**Invalid if.** Used as a true area centroid — this is a centre-of-vertices, so
it is weighted by vertex density, not by area. It can fall outside strongly
concave polygons (a C-shaped flood warning zone). Valid for dropping a marker at
dashboard zoom; invalid for area calculations, containment tests, or centroid
distance metrics.

---

## 2. `REGIONS` bounding boxes as state identifiers

**Claim.** The per-state boxes in `src/lib/mock-data.ts` can map a coordinate to
a two-letter state code, for feeds that report position but no state.

**Bounds assumed.** The seven covered states; any point within them.

**Run.** USGS gauge "Mississippi River at St. Paul, MN" at `44.9442, -93.0858`.
Expected `MN`.

**Result. Falsified.** Returned `null`.

**Diagnosis.** `REGIONS` are dashboard **focus areas**, not state extents — the
names say so plainly once read as claims rather than labels: "North Iowa", "East
North Dakota", "Upper Michigan". Minnesota's box starts at latitude 46.0; St.
Paul is at 44.94, about **118 km south of the box edge**. The failure mode was
silent and severe in exactly the wrong direction: every gauge in the populated
southern half of Minnesota would have returned `state: null` and disappeared from
the region filter, while northern rural gauges resolved fine. A spot-check
against a northern site would have "confirmed" the claim.

**Edited claim.** Point-to-state inference uses `STATE_BBOXES` in
`src/lib/sources/geo.ts` — full state extents, defined separately from `REGIONS`,
which keeps its original and still-correct meaning as UI focus areas. Overlapping
boxes resolve smallest-area-wins.

**Invalid if.** The point is near a state border — rectangles overlap there and
smallest-box-wins is a heuristic, not a boundary test. This is why callers prefer
an authoritative field from the feed itself (NWS UGC prefixes, Open511 area ids)
and fall back to geometry only when the feed provides coordinates alone.

---

## 3. Total source failure always propagates

**Claim.** With every upstream source failing, `fetchAlerts()` rejects.

**Bounds assumed.** All sources enabled and unreachable.

**Run.** `ALERT_SOURCES=NOAA,USGS,Open511` with this environment's egress policy
returning 403 to all three.

**Result. The hypothesis was falsified, not the system.** `fetchAlerts()`
resolved with data.

**Diagnosis.** A `.cache/alerts.json` written by an earlier mock-mode run was
loaded on cold start, and stale-while-error served it — which is the designed
behavior of `AlertCache`, working correctly. The test asserted the wrong thing
because it did not control its own starting state.

**Edited claim.** Total source failure propagates **only when no cached set
exists in memory or on disk**. Re-run after `rm -rf .cache` threw as designed,
and the route returned 503 with a user-facing message.

**Invalid if.** Read as "an empty feed means everything is fine." It means the
opposite is being masked: check `degraded` and the `sources[]` array in the API
response, not the alert count. Note also that this makes cache state a hidden
input to any test of failure behavior — a category of bug this run demonstrates
rather than merely predicts.

---

## 4. NBI coordinate packing (fixture, not code)

**Claim.** NBI `LAT_016` / `LONG_017` values in the test fixture (`452812000`,
`931500000`) represent 45°28'12"N, 93°15'00"W.

**Run.** Normalizer over that fixture, expecting `45.47, -93.25`.

**Result. Falsified — and the code was right.** Coordinates came back `null`.

**Diagnosis.** NBI packs as **8-digit** `DDMMSSss` (latitude) and `DDDMMSSss`
(longitude); the fixture used nine digits. `toDecimalDegrees()` parsed a degrees
value of 452, exceeded the ±90 limit, and returned `null` rather than emitting a
coordinate. The guard did its job: **the failure surfaced as absence, not as a
bridge placed in the wrong hemisphere.**

**Edited claim.** The fixture was corrected, not the code. Recorded here because
the useful result is about the *guard*: rejecting out-of-range output is what
made a malformed input visible at all.

**Invalid if.** A malformed value happens to land inside ±90/±180 after
unpacking — it would pass the guard and produce a plausible wrong location. The
range check catches magnitude errors, not subtler ones.

---

## 5. The repository builds

**Claim.** `npm run build` succeeds on `main`.

**Run.** Clean `git worktree` of `main`, `npm run build`.

**Result. Falsified.** `Module not found: Can't resolve 'fs'`.

**Diagnosis.** Pre-existing, introduced with the disk-persistence cache. The
client dashboard imported `filterAlerts` from `alert-service.ts`, which imports
`alert-cache.ts`, which imports `fs` — pulling a Node built-in into the browser
bundle. `typecheck` and `lint` both passed throughout, because neither one
resolves the server/client boundary; only the bundler does.

**Edited claim.** `typecheck` + `lint` passing does **not** imply the app builds.
The pure helper now lives in `src/lib/alert-filters.ts`, which the client imports
directly, and `alert-service.ts` is server-only.

**Invalid if.** Anything client-side imports `alert-service.ts` again. There is
no automated guard for this — the failure only appears in `npm run build`.
Running the build is the check.

---

## Method notes

**What made falsification possible.** Expected values computed independently of
the implementation. Every bug above produced *plausible* output — a marker 5 km
off, a `null` state, a populated alert list. None would have failed an
eyeball check or a snapshot test recorded from the code's own behavior. The
rectangle centroid was caught only because 45.2 was worked out by hand first.

**Where the tests came from.** Payloads are hand-authored against each API's
documented schema, because this environment's egress policy blocks
`api.weather.gov`, `waterservices.usgs.gov`, and `earthquake.usgs.gov` (403 on
CONNECT). They exercise the transforms, and cannot validate field names.

---

## Open unknowns — searched, not resolved

These are live claims awaiting a run. They are the highest-value next tests.

1. **No fetcher has run against a live upstream response.** Every schema
   assumption below is untested against reality, not merely under-tested.
2. **NBI ArcGIS field spellings vary by host** — the single largest schema risk.
   Mitigated by probing multiple spellings per attribute and by configurable
   `NBI_WHERE`, but unverified against any real layer.
3. **Open511 severity vocabulary varies by deployment.** `MAJOR/MODERATE/MINOR`
   is the spec; deployments extend it. Unrecognized values fall through to
   `Unknown` rather than being dropped — check this against a real deployment.
4. **USGS assumes the last entry in a `values[]` series is the current reading.**
   True for the documented ordering; unverified for series with gaps, and
   unverified for sites reporting multiple time series per parameter.
5. **NWS UGC prefixes are assumed to be state codes.** Holds for zone/county
   codes (`MNZ060`, `WIC075`); marine and offshore zones use different prefixes
   and would yield a non-state two-letter code.
6. **Whether 30 minutes is the right TTL** for feeds that update at different
   rates — NWS alerts change minute-to-minute, NBI is annual. One TTL currently
   covers both.
