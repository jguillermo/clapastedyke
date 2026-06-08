# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Detailed conventions live in `.claude/`

The authoritative coding rules are in **`.claude/CLAUDE.md`** (always loaded) and **`.claude/rules/*.md`** (one per area). Read the relevant rule before touching files in that area:

- `components-conventions.md` — the `src/app/components/` design-system library (CDK + Migo Tailwind tokens, zero business logic)
- `core-conventions.md` + `example-conventions.md` — DDD inside `src/app/core/` (the worked example is the reference shape for new code)
- `features-conventions.md`, `features-common-conventions.md` — route-level pages and cross-feature reusables
- `platform-conventions.md` — cross-cutting technical mechanisms
- `providers-conventions.md` — per-context DI via `provide*()` functions
- `path-aliases-conventions.md` — `@app/@components/@core/@features/@platform`
- `unit-tests-conventions.md`, `e2e-tests-conventions.md`, `assets-conventions.md`

> Note: `main-process-conventions.md` and `asset-protocol-conventions.md` describe an Electron main process (`app/src/`) that does **not** exist in this repo. This is a **browser** Angular app — persistence is **IndexedDB**, not Electron IPC. Treat those two rules as inapplicable here unless an `app/` directory is added.

## Commands

```bash
ng serve            # dev server at http://localhost:4200 (routes: /home, /ui)
ng build            # production build → dist/
ng build --watch --configuration development   # also: npm run watch
ng test             # unit tests — Vitest via @angular/build:unit-test (globals, jsdom)
```

- **No lint script and no ESLint config** — conventions are enforced by code review, not tooling. Formatting is Prettier (`.prettierrc`: 100 cols, single quotes); there is no `format` script.
- **No e2e runner is configured** despite `e2e-tests-conventions.md` existing.
- Tests use Vitest **globals** (`describe`/`it`/`expect`) — no per-file imports. `tsconfig.spec.json` discovers all `src/**/*.spec.ts` wherever they sit.
- TypeScript **6** + Angular **22**. Path aliases have **no `baseUrl`** and use relative targets (`./src/app/*`) — required by TS6 (see `path-aliases-conventions.md`).

## What this app is

A 3D in-browser cooking game (`misaevol` / "clapastedyke"). The user navigates a three.js kitchen world (`/home`); the real data-entry forms are the screens reached from it. `/ui` is the living component showcase. State is persisted locally in IndexedDB — there is no backend HTTP API in the current contexts.

## Architecture: four layers under `src/app/`

```
components/   Design-system UI library (migo- prefix). CDK behavior + Migo Tailwind tokens.
              Zero business logic. Imports ONLY Angular, CDK, and sibling components.
core/         DDD bounded contexts. All business logic lives here.
features/     Route-level pages. Inject use cases ONLY; build UI from components/.
platform/     Cross-cutting tech (currently three/ — the 3D engine). No domain knowledge.
```

The dependency rule is strict and asymmetric: `features/` → `components/` + `core/*/application` (use cases) + `platform/`; `components/` and `platform/` import from **no app layer**; `core/` imports from no other layer.

### Core (DDD) — read `example-conventions.md` for the canonical shape

Each bounded context (`core/recipe-book/`, `core/progression/`) is split by tactical pattern:

```
domain/         entities/ value-objects/ repositories/(abstract) services/(abstract) events/
application/     use-cases/   ← one class per user intention, extends UseCase<Req,Res>
infrastructure/  indexeddb-*.repository.ts (concrete) + *.mapper.ts (DTO↔domain ACL) + *.records.ts
<context>.providers.ts   ← binds abstract domain contracts → concrete impls via makeEnvironmentProviders
testing/         ← ALL specs (mirroring the source layer path) + test doubles. Never beside source.
```

Key invariants the code already follows:
- **The domain decides, the use case orchestrates.** Business rules live on entities/VOs as methods returning new instances; use cases only load → call domain → persist. Anemic models are the anti-pattern this prevents.
- **`inject()` over constructor injection** everywhere.
- Repositories = pure data access; Services = behavior/coordination. Concrete impls carry a transport prefix (`Indexeddb*`, `Local*`, `Http*`).
- Cross-context references are held **by `string` id**, never by the other context's value object.

### Shared kernel — `core/_common/`

Cross-context primitives, **not** a bounded context: `UseCase`, `AggregateRoot` (records domain events via `pullEvents()`), `EntityId`, `Quantity`, the `EventBus` port + `InMemoryEventBus`, and `infrastructure/indexeddb/` (single DB `clapastedyke`, one object store per aggregate, versioning only ever ADDS stores). New cross-cutting projections also go here.

### Domain events

Aggregates record events; the use case pulls and publishes them through `EventBus` after persisting. Subscribers in another context react — e.g. `progression/infrastructure/cake-composed-progress.subscriber.ts` listens for a recipe-book event to advance player progress. This is how contexts stay decoupled (see `progression`'s integration spec).

### DI composition

`app.config.ts` only **aggregates** `provide*()` functions (`provideEventBus()`, `provideRecipeBook()`, `provideProgression()`) — it never decides implementations. Each context owns its bindings in its `*.providers.ts`. Routes are lazy-loaded standalone components in `app.routes.ts`.

## Styling — SOLO Tailwind del tema Migo (hard rule)

All DOM styling uses **Tailwind v4 utilities generated from the Migo theme** — **never raw CSS, `var(--token)`, or arbitrary values** (`p-[40px]`, `bg-[#fff]`). Missing values are added as **tokens** to the theme, not invented in templates.

- Theme source: `src/styles/migo/theme.css` (`@theme`) over the primitive palette in `palette.css`. Only **semantic** utilities exist (`bg-brand`, `text-body`, `rounded-xl`, `shadow-focus`, `min-h-11`).
- **No per-component `.css`/`styleUrl`.** Component style = utilities in the template and the decorator `host` object (static base in `host: { class }`; signal-driven variants via a `computed()` bound to `host: { '[class]' }`).
- The **only** global CSS (`src/styles.css`) is the theme import chain + document base + the CDK Dialog overlay chrome (which targets CDK-generated DOM that can't carry utilities).
- **Exception — the 3D world** (`platform/three/*` + the 3D render in `features/game/*`): rendered with three.js, not DOM, so this rule does not apply. A DOM HUD overlaid on the canvas still uses Tailwind.

## Conventions that bite if missed

- Standalone components only; **never** set `standalone: true` (default in v20+). `ChangeDetectionStrategy.OnPush`. `input()`/`output()`/`computed()`/`signal()` — no `@Input`/`@Output`. Host bindings in the `host` object, never `@HostBinding`/`@HostListener`. Native control flow (`@if`/`@for`/`@switch`).
- **No `.component` suffix** on files or classes. Library selectors use `migo-`; feature selectors use `app-`.
- **Build all UI from `components/`.** If a needed component doesn't exist, create it there first (per `components-conventions.md`), then use it. Icons go through `<migo-icon>` (typed registry, `mat:`/`custom:` prefixes) — never inline `<svg>`.
- Cross-area imports use the `@` alias; intra-context `core/` imports stay relative.
