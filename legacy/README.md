# legacy/

> **Ontology notice.** See [`../DIFFERENTIAL_FRAME.md`](../DIFFERENTIAL_FRAME.md).
> Nothing here is deleted, because a superseded claim is not a wrong claim — it
> is a claim that ran out of bounds. The bounds are the information. This folder
> keeps each retired artifact next to the conditions under which it held and the
> condition that ended it.

Code in here is **not imported by the running app**. It is kept compiling
(`tsconfig.json` includes `**/*.tsx`, so `npm run typecheck` still covers it) so
that a retired claim stays *checkable* rather than decaying into a story about
itself. If something here stops compiling, that is a result worth reading, not a
lint error to silence.

---

## `MapMock.tsx`

| | |
|---|---|
| **Held from** | `24769d7` — "Reorganize project structure, add docs, and fix code audit issues" |
| **Retired at** | `c326082` — "Integrate Leaflet + OpenStreetMap for real map visualization" |
| **Superseded by** | `src/components/dashboard/AlertMap.tsx` |

**What it claimed.** That a stylized, dependency-free map — absolute-positioned
markers over a CSS-gradient background, coordinates projected by linear
interpolation across a fixed bounding box — was sufficient to show *where* alerts
are, and that this was worth avoiding a mapping dependency for.

**Bounds under which that held.** Mock data only; a small, fixed alert count;
one hardcoded region envelope; no zoom, no pan, no basemap, no real projection.
Under those conditions it was true — the component rendered severity and rough
position, and the app carried no map library.

**What ended it.** Live sources broke every one of those bounds at once:
unbounded alert counts, coordinates anywhere in seven states, and a need to
distinguish positions at a resolution linear interpolation over a fixed box does
not have. The claim did not become wrong; its conditions stopped holding.

**Precedent that still carries.** The severity color scale, the pulse treatment
for critical alerts, and the marker-click-to-detail interaction were all lifted
into `AlertMap.tsx` unchanged. `MapMock` is where those were established. It also
remains the working answer to "what does this look like with no map dependency
and no network" — a real question if the basemap tiles are ever unavailable.

---

## `metadata.json`

| | |
|---|---|
| **Held from** | `7f742dc` — "feat(genkit): Update dev docs and examples" |
| **Retired at** | Superseded in practice long before it was moved here |
| **Superseded by** | `package.json` (`name`), `README.md` (description), `apphosting.yaml` (deploy config) |

**What it claimed.** That this project's identity was
`studio-2687427837` / "App imported from Firebase Studio" — scaffolding metadata
written by Firebase Studio at import time.

**What ended it.** Nothing in the codebase ever read it: no import, no build
step, no deploy config. It described a generated project that the repository
stopped being at its first hand-written commit.

**Precedent that still carries.** It records the actual origin of this codebase —
a Firebase Studio import, not a `create-next-app` scaffold. That explains
otherwise-odd inheritances still present in the tree: `apphosting.yaml`,
the Firebase dependency in `package.json`, and the design spec in
`docs/blueprint.md` being written as a product brief rather than a technical
design.

---

## Not moved here, and why

**`docs/blueprint.md`** — the original design spec. Partly unimplemented
(persistent alert history in a database), but it is the *hypothesis document*,
not a retired implementation. Its style guidelines are still live and still
match `globals.css`. A hypothesis with open predictions is not legacy; it is
pending.

**`src/lib/mock-data.ts`** — still load-bearing in two ways. `MOCK_ALERTS` is the
`ALERTS_USE_MOCK=true` offline path, and `REGIONS` still drives the UI region
filter. Note that `REGIONS`' bounding boxes were falsified for a *different* use
(point-to-state inference) — see
[`../docs/FALSIFICATION_LOG.md`](../docs/FALSIFICATION_LOG.md) #2. They remain
correct for what they are: dashboard focus areas.

**`.modified`** — a zero-byte tooling artifact. It carries no claim, so there is
nothing here to preserve; it is noise rather than precedent. Left in place rather
than moved, since deleting it is a call for a human to make.
