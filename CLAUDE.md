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
- `mobile-first-conventions.md` — **hard rule**: toda la UI DOM es mobile-first (diálogos/formularios full-bleed en móvil, grillas que no se aplastan, targets ≥44px, viewport sin zoom). Cada componente y feature debe cumplirla y verificarse a 375px.
- `unit-tests-conventions.md` — **hard rule**: unit tests cover **only** `core/<context>/domain/` and `core/<context>/application/use-cases/`, and live in `core/<context>/testing/` mirroring the source path exactly. Features are covered by E2E, design-system components by their story's `play`.
- `logging-conventions.md` — **hard rule**: nada llama a `console`; se registra por el puerto `Logger` y **registrar es obligatorio** (un `debug` en cada paso importante, ningún `catch` mudo). `warn`/`error` se ven **siempre, también en producción**, con la traza del error; `debug` se ve según `"debug"` en `public/config.json` (un solo build; se cambia el fichero, no se recompila). `components/` no registra nunca.
- `assets-conventions.md`
- `e2e-tests-conventions.md` — **hard rule**: todos los E2E viven en `e2e/` (config, specs, page objects, fixtures) y prueban las vistas de `src/app/features/` con flujos completos. Cualquier petición de "crear tests E2E" se resuelve con esa forma.

> Note: `main-process-conventions.md` and `asset-protocol-conventions.md` describe an Electron main process (`app/src/`) that does **not** exist in this repo. This is a **browser** Angular app — persistence is **IndexedDB**, not Electron IPC. Treat those two rules as inapplicable here unless an `app/` directory is added.

## Technical docs live in `manual/`

Standalone technical documentation — how something works, why it is built that way, how to operate
it — goes in **[`manual/`](manual/)**, indexed by [`manual/README.md`](manual/README.md). Product and
business material (brand, story, game chapters) stays in `.claude/doc/`; coding **rules** stay in
`.claude/rules/`.

Docs that describe one concrete piece of code stay **next to it** and are listed from the manual's
index — `src/app/components/README.md` (the living component catalog),
`src/app/core/_common/eventbus/README.md` (delivery semantics) and
`src/app/core/_common/logger/README.md`. Co-location is deliberate: a doc nobody sees while editing
the file beside it goes stale.

## Commands

```bash
npm run check       # autofix (lint + format) and then verify EVERYTHING, in CI order
npm run fix         # autofix only: eslint --fix + prettier --write
npm run verify      # validate only, in CI order: lint · format · types · unit · stories · E2E

ng serve            # dev server at http://localhost:4200 (route: /#/home — hash routing)
npm run build       # production build → firebase/public (carries the placeholders as committed)
ng build --watch --configuration development   # also: npm run watch
ng test             # unit tests — Vitest via @angular/build:unit-test (globals, jsdom)
npm run test:unit   # the same, single run (no watch) — what CI runs
npm run test:e2e    # E2E: ng build + Playwright over e2e/ (projects: desktop 1280px, mobile 375px)
npm run test:e2e:ui # the same, in Playwright's UI mode
npm run sb          # Storybook (component states/variants live in *.stories.ts `play`)
npm run sb:test     # the stories' `play` as tests (vitest browser + chromium)
npm run emulators   # Firebase emulators (functions + firestore) — needed by `ng serve` for /api/**
npm run fn:install  # npm ci inside firebase/functions  ·  fn:lint · fn:build
npm run lint        # ESLint (angular-eslint) — `npm run lint:fix` to autofix
npm run format      # Prettier --write .   (npm run format:check to verify only)
npm run typecheck   # tsc over app + stories, unit specs, and the E2E suite
```

**Publishing is not a command.** There is no deploy script in the repo: it is
`Actions → Desplegar (Firebase) → Run workflow` — one workflow, one command: `firebase deploy` with
no `--only` always ships firestore + functions + hosting together. See
[`firebase/README.md`](firebase/README.md).

- **Three tsconfigs, three type-checks** — `tsconfig.stories.json` (app + stories, `typecheck:src`), `tsconfig.spec.json` (unit specs, with vitest globals), `e2e/tsconfig.json` (the E2E suite, standalone). **Angular templates are checked only by `ng build`**, so the build job is not optional. Do **not** point `tsc` at `.storybook/tsconfig.json`: that is Storybook's *build* config — `preview.ts` imports `documentation.json` (compodoc-generated, gitignored) and `src/styles.css` (bundler-only), and its `files` entry makes TS infer `rootDir` as `.storybook/` (`TS6059`).
- **Lint = ESLint flat config** (`eslint.config.mjs`, `angular-eslint` + `typescript-eslint`): Angular rules (signals over decorators, native control flow, OnPush), template **a11y**, and the **layer boundaries** as `no-restricted-imports` (`components/` with no app imports, `core/` isolated, features without `infrastructure/`, the E2E suite without `src/`). Not type-aware on purpose — `ng build` and the `tsc -p …` steps already type-check. What is not AST-analysable (real mobile-first at 375px, arbitrary Tailwind values inside a class string, specs living in `core/<ctx>/testing/`, one `Playground` with `play` per component) is still code review.
- Formatting is Prettier (`.prettierrc`: 100 cols, single quotes) via `npm run format` / `npm run format:check`.
- **CI gate** — `.github/workflows/ci.yml` runs on every PR to `main`: format + lint + types, unit tests, the API's own typecheck + tests, production build (with budgets), the stories' `play`, and the E2E suite (desktop + mobile). The single job to require in branch protection is **`CI OK (required)`**; it fails if any other job fails, is cancelled or skipped.
- **Checks are run ON DEMAND, never automatically.** Do **not** run `check`, `verify`, the tests, the build or the linter after editing code — not to "confirm the change works", not before finishing a task, not at the end of a turn. Run them **only when explicitly asked to**. CI is the gate; it runs on every PR and it is what decides whether a change is green.
- What `npm run check` does when you *are* asked for it: autofixes first (`fix`) and then runs the same checks as CI in the same order, cheapest first (`verify`), so the slow E2E run only happens once everything else is green. The production build is covered inside `test:e2e` (it builds `firebase/public` before serving it). CI splits the same work into parallel jobs instead of one chain.
- **E2E lives only in `e2e/`** — one Playwright config (`e2e/playwright.config.ts`), specs mirroring `src/app/features/`, page objects in `e2e/pages/`, fixtures in `e2e/fixtures/`. Tests run against the **compiled build** served by `e2e/support/static-server.mjs`, not `ng serve`. See `e2e-tests-conventions.md` — that shape is mandatory for every new E2E test.
- Tests use Vitest **globals** (`describe`/`it`/`expect`) — no per-file imports. `tsconfig.spec.json` discovers all `src/**/*.spec.ts` wherever they sit.
- TypeScript **6** + Angular **22**. Path aliases have **no `baseUrl`** and use relative targets (`./src/app/*`) — required by TS6 (see `path-aliases-conventions.md`).

## Deployment: placeholders in the repo, substitution in the pipeline

Nothing outside `firebase/` names Firebase, a project id, or a region — and **inside `firebase/`
there is no deployment logic either**. Compiling, substituting and publishing live entirely in the
two workflows under `.github/workflows/`. The folder holds the deploy config, the backend source and
the compiled artifact.

```
firebase/
├── firebase.json                 ← deploy AND emulator config (paths relative to firebase/)
├── .firebaserc                   ← default project — emulator and by-hand commands only
├── firestore.rules               ← + firestore.indexes.json
├── proxy.config.json             ← `ng serve` → emulator, versioned
├── functions/                    ← THE BACKEND: its own npm package (deps, tsc, ESLint)
│   ├── .env                      ← NOT versioned: real values, copied by hand
│   ├── .env.example              ← versioned: documents the two keys, no values
│   ├── README.md                 ← the function's contract
│   └── src/index.ts              ← exports `auth`; the routes live in src/auth/
└── public/                       ← the artifact `ng build` produces (gitignored)
```

⚠️ **`ng build` compiles straight into `firebase/public`** — `angular.json`'s `outputPath` *is*
`firebase.json`'s `hosting.public`. There is no intermediate `dist/` to copy: building is preparing
the deploy, and that folder is gitignored because it is an artifact. `ng build` empties it first, so
nothing you want to keep goes in there.

⚠️ **`firebase init` regenerates two workflows** (`firebase-hosting-merge.yml`,
`firebase-hosting-pull-request.yml`) that deploy on merge, skip the placeholder substitution and
hardcode the project id. They were deleted; delete them again if they come back.

Three rules that make this hold:

- **A value that must not be versioned is never written anywhere.** `public/config.json` is
  **versioned with placeholders** named after their variable — `"googleClientId":
  "GOOGLE_OAUTH_CLIENT_ID"`, `"debug": "DEBUG"`, `"authApiUrl": "AUTH_API_URL"` — and the pipeline
  substitutes them. **`firebase/functions/.env` is different: it is NOT versioned at all.** It holds
  real values, is ignored by `firebase/.gitignore`, and is copied by hand from `.env.example`. So only
  someone whose machine has that file can deploy the function.
- **The pipeline substitutes them on the runner**, right before publishing (`jq` over the secret,
  `sed` over the file, then a grep that fails the job if a placeholder survived). The repository
  never contains a Client ID.
- **An environment is declared in its GitHub environment**, not in the repo: two secrets
  (`GOOGLE_OAUTH_CLIENT` — the client JSON, whole — and `FIREBASE_SERVICE_ACCOUNT`) and **no
  variables**. The Firebase project is not configured anywhere: both workflows read it from the
  service account's own `project_id`, so you cannot deploy to a project other than the one the
  credentials belong to. `debug` is an input of the frontend workflow, ticked on the Run form.
  Adding `stage` touches no file.

**A surviving placeholder does not break the app.** `PublicFileAppConfig` only accepts a
`googleClientId` ending in `.apps.googleusercontent.com`; anything else is treated as absent, so the
integration is off and a `warn` says why. Everything else — the whole recipe book, which lives in
IndexedDB — works untouched. `/cuenta` still shows «Conectar con Google» (the view has never gated on
whether a client is configured); pressing it fails locally with «Falta el identificador de cliente en
la configuración del despliegue», which is a diagnosable message instead of Google answering
`invalid_client`. That is what lets a fresh clone run with **nothing executed**.

`firebase/functions/.env` deliberately has **no project suffix**: Firebase loads it for any
`--project`, so one codebase serves every environment. A stray `.env.<projectId>` would silently
override it, which is why that pattern stays in `.gitignore`. The backend deploys **from source** —
Firebase packages `functions/` itself — so the substitution happens in the runner's working tree,
which is ephemeral and never printed.

⚠️ **There is no workflow that deploys the function.** `.github/workflows/` only has
`deploy-hosting.yml`, which publishes Hosting and nothing else. Publishing the function is
`cd firebase && firebase deploy --project <projectId>`, by hand, from a machine that has the `.env`.
If a deploy would DELETE an already-published function, `--non-interactive` stops the CLI and asks for
`--force` instead of doing it silently.

Full procedure — publishing step by step, what to check afterwards, and how to reproduce the
substitution locally — in [`firebase/README.md`](firebase/README.md).

## What this app is

A 3D in-browser cooking game (`misaevol` / "clapastedyke"). The user navigates a three.js kitchen world (`/#/home`); the real data-entry forms are the screens reached from it. `/#/ui` is the living component showcase. **Routing is hash-based** (`withHashLocation()` in `app.config.ts`): everything after `#` never reaches the server, so `/` is the **only** server route the app has and no app route can collide with `/api/**` or with a static file. There is deliberately **no SPA fallback rewrite** — see the comment on `provideRouter` and `manual/firebase-deploy.md`. State is persisted locally in IndexedDB — **that is the source of truth, and no server ever holds the user's data**.

The one network integration is **optional and additive**: from `/cuenta` a user can connect a Google account and mirror recipes and supplies into a spreadsheet in their own Drive. The app creates that spreadsheet and writes it **itself**, with the Sheets and Drive REST APIs and the user's own token — no Apps Script, nothing deployed into anyone's account, one consent checkbox (`drive.file`, which only reaches files the app created). The one-time setup for whoever publishes the app (Cloud project, consent screen, Client ID **and client secret**) is in [`firebase/README.md`](firebase/README.md) — the **only** place that procedure is documented; the design reasoning, the platform constraints and the alternatives that were measured and rejected are in [`manual/google-integration.md`](manual/google-integration.md). Nothing about local persistence changes when it is off — and it is off wherever `googleClientId` or `authApiUrl` is missing. Neither value is in any file of this repository: `public/config.json` carries the placeholders `GOOGLE_OAUTH_CLIENT_ID` and `AUTH_API_URL`, substituted on the runner. The `client_secret` never touches the repo either — it lives only in `firebase/functions/.env`, which is **not versioned**. Both halves of the client must come from the **same** downloaded JSON: pairing the `client_id` of one client with the `client_secret` of another is what Google answers with an unexplained `invalid_client`. Locally the placeholders simply stay, and the app runs with the integration off.

**There is exactly one piece of backend, and it is about identity — never data.** A browser client cannot hold a `client_secret`, so Google gives it no refresh token: its access tokens die in an hour and the only way to get another is a popup, which the browser blocks when it isn't triggered by a click. That is why reloading the page used to sign you out. [`firebase/functions`](firebase/functions/) — a Cloud Function named `auth`, with three routes (`POST /exchange`, `/refresh`, `/logout`) — is the confidential OAuth client that custodies the long-lived grant and mints fresh access tokens on demand. The recipe data never passes through it: the whole sync engine still runs in the browser. Its contract is in [`firebase/functions/README.md`](firebase/functions/README.md); the folder rule (**one npm package, fully separate from the Angular app — its own deps, its own `tsc`, its own ESLint — deployed by hand; a new function is another `export` from `src/index.ts`, not another folder**) is in [`manual/functions.md`](manual/functions.md).

⚠️ **The app reaches it by its direct URL, with CORS — Hosting is not involved.** There is no rewrite: the function's address lives in `authApiUrl` (`public/config.json`), because a Cloud Function URL carries the project and region inside it. Two consequences, both documented in that README: **CORS answers only the origins listed in `ALLOWED_ORIGINS`** (`firebase/functions/.env`) — with `Allow-Credentials: true` the spec forbids the wildcard, and reflecting whatever came let any site the user visited mint a token for their Drive; an empty list answers nobody, app included. And the session travels **both** in an `HttpOnly` `__session` cookie **and** in a `session_token` the app stores in IndexedDB — the cookie is third-party, so Safari and iOS block it, and without that fallback the session would not survive a reload on mobile.

## Architecture: four layers under `src/app/`

```
components/   Design-system UI library (migo- prefix). CDK behavior + Migo Tailwind tokens.
              Zero business logic. Imports ONLY Angular, CDK, approved agnostic UI libs
              (currently `swiper`), and sibling components.
core/         DDD bounded contexts. All business logic lives here.
features/     Route-level pages. Inject use cases ONLY; build UI from components/.
platform/     Cross-cutting tech (currently three/ — the 3D engine). No domain knowledge.
```

The dependency rule is strict and asymmetric: `features/` → `components/` + `core/*/application` (use cases) + `platform/`; `components/` and `platform/` import from **no app layer**; `core/` imports from no other layer.

⚠️ **And inside `core/`, no bounded context may import from another** — not an entity, not a use case, not even an event name. They collaborate only through `core/_common/` (an abstract contract, implemented by the owner and injected by the consumer) and through **events** on the `EventBus`, whose names live in `core/_common/events/integration-events.ts`. ESLint enforces it per context from the `CORE_CONTEXTS` list in `eslint.config.mjs` — add every new context there. Full rule in `core-conventions.md` → «Los contextos no se conocen entre sí».

### Core (DDD) — read `example-conventions.md` for the canonical shape

Each bounded context (`core/recipe-book/`, `core/auth/`, `core/external-sync/`) is split by tactical pattern:

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

Cross-context primitives, **not** a bounded context: `UseCase`, `AggregateRoot` (records domain events via `pullEvents()`), `EntityId`, `Quantity`, the `EventBus` port + `InMemoryEventBus`, `config/` (the `AppConfig` port over `public/config.json`, read in `main.ts` **before** bootstrap so it is synchronous everywhere), and `infrastructure/indexeddb/` (single DB `clapastedyke`, one object store per aggregate, versioning only ever ADDS stores). New cross-cutting projections also go here.

**`core/auth/` and `core/external-sync/` are technology-agnostic on purpose.** Their domain and application layers never name Google or Sheets — not even in a type. Each has exactly one port (`Authenticator`, `SyncGateway`) and one concrete adapter, bound in its `provide*()`:

| Context | Port | Today's adapter | Swapping it |
|---|---|---|---|
| `auth` | `Authenticator` | `infrastructure/google-authenticator.ts` (all of Google Identity Services) | one line in `auth.providers.ts` |
| `external-sync` | `SyncGateway` | `infrastructure/google-sheets.gateway.ts` + `google-api.ts` | one line in `external-sync.providers.ts` |

The deployment config (`AppConfig` over `public/config.json`) lives under `_common/infrastructure/config/` for the same reason: its keys are technology (`debug`, `googleClientId`), so only adapters read it — never a use case. **There is one build for every environment**: no `src/environments/`, no `fileReplacements` — what changes per deployment is that served file.

### Domain events

Aggregates record events **in their `create(...)` factory** (`extends AggregateRoot`); the use case pulls them with `pullEvents()` and publishes them through `EventBus` after persisting. Subscribers in another context react — e.g. `external-sync/infrastructure/recipe-book-changed.subscriber.ts` listens for `RecipeSaved`/`SupplySaved` and queues the change for the spreadsheet. This is how contexts stay decoupled.

⚠️ **There is no create-vs-update anywhere: only persist.** If the aggregate isn't there it is inserted, if it is there it is updated, with no observable difference (`save` is an upsert). Hence **one event per aggregate** (`*Saved`, no `isNew`, no "what changed") and **no mutation verbs** (`renamedTo`, `repricedTo`) — you rebuild the aggregate with the new data on the **same identity**. The use case only resolves *which* identity (by id, by name/label, or a new one) and the uniqueness rules, because that needs repositories.

⚠️ **Every aggregate also has `restore(data)`, which records nothing** — used by mappers, the seed and test builders. Reading is not saving: rehydrating through `create` would queue a spurious event on every IndexedDB read.

⚠️ **The bus is `PersistentEventBus`: it queues to IndexedDB and delivers later, on its own tick** — `publish()` does *not* await the subscribers, so a slow handler never blocks the save, and a pending event survives a reload. Delivery is at-least-once per subscriber, so **handlers must tolerate running twice**. Full spec: [`core/_common/eventbus/README.md`](src/app/core/_common/eventbus/README.md).

### DI composition

`app.config.ts` only **aggregates** `provide*()` functions (`provideEventBus()`, `provideRecipeBook()`, `provideProgression()`) — it never decides implementations. Each context owns its bindings in its `*.providers.ts`. Routes are lazy-loaded standalone components in `app.routes.ts`.

## Registro — obligatorio y `console.*` PROHIBIDO (hard rule)

Regla completa en **[`logging-conventions.md`](.claude/rules/logging-conventions.md)**. Lo que hay
que saber sin abrirla:

**Nada en el proyecto llama a `console`.** Se registra por el puerto `Logger`
(`core/_common/logger/logger.ts`), con cuatro niveles: `debug` · `info` · `warn` · `error`. Lo impone ESLint:
`no-console` es **error** en todo el repo, con **una única excepción declarada por ruta** —el
adaptador `core/_common/logger/console-logger.ts`—, así que no se puede saltar con un
`eslint-disable` suelto. (En specs y stories la regla está apagada.)

**Registrar no es opcional.** Cada paso importante de un flujo lleva su `debug`; cada `catch`
registra o relanza; cada `void promesa` tiene dueño de su fallo. Registran `core/`, `features/` y
`platform/`; **`components/` no registra nunca** (el design system no importa nada de la app).

```typescript
private readonly log = inject(Logger).scoped('recipe-book/save-recipe'); // → [recipe-book/save-recipe]

this.log.debug('guardando receta', { id, ingredientes: lines.length });
this.log.warn('no se pudo sembrar la receta', error, { id }); // el error va en SU ranura
```

**La firma es asimétrica a propósito**: `debug(msg, context?)` lleva datos; `warn`/`error(msg, cause?,
context?)` llevan *la cosa que falló*, en ranura propia, para que la consola pinte la pila y la
cadena `cause`. Anidar el error dentro del contexto pierde los frames pinchables. `info` está
**prohibido** (sigue en el puerto `@deprecated`, se emite como `debug`).

Vive en `core/_common/` —junto al `EventBus`— y no en `platform/` porque **`core/` también registra y
no puede importar de `platform/`**; la dependencia inversa sí vale, y por eso `eslint.config.mjs`
abre una grieta explícita para `@core/_common/logger` en el bloque de `platform/`.

### Qué se ve y cuándo

| Nivel | Se ve |
|---|---|
| `error` · `warn` · `info` | **siempre**, en cualquier despliegue |
| `debug` | si `public/config.json` dice `"debug": true` |

**`info`, `warn` y `error` no se pueden apagar**: no hay configuración que los toque, así que si algo
falla en la máquina de alguien deja rastro con su pila. **`debug`** viene encendido en el repo, así
que `ng serve` y ya se ve todo.

Todo lo que nadie captura acaba en `GlobalErrorHandler` (`platform/error/`), que lo saca por el
puerto con scope `[uncaught]` y su traza completa. El fallo de arranque, que ocurre antes de que
exista el inyector, lo recoge `logBootstrapFailure` en `main.ts`.

### La única configuración: `public/config.json`

Un booleano en el fichero de configuración que ya existe, y **nada más**: ni `environment.ts`, ni
umbral de nivel, ni interruptor en `window`, ni estado en `localStorage`.

```jsonc
// public/config.json — el MISMO build lo lee en todos los entornos
{
  "debug": true,          // ¿se ve el detalle del flujo? Ausente = false
  "googleClientId": "",   // identidad de la app ante Google
  "authApiUrl": ""        // URL de la función `auth`; sin ella no hay sesión que reanudar
}
```

**El build es uno solo**: no hay `src/environments/` ni `fileReplacements`. Compilar dos veces la
misma app para cambiarle un booleano obliga a republicar por cada ajuste y hace que lo que corre en
producción no sea el artefacto que se probó. Para callar el detalle en un despliegue se edita **su**
`config.json` y se recarga.

`main.ts` lo lee con `readConfigDocument()` **antes** de `bootstrapApplication` y se lo pasa a
`appConfig(document)`. Ese orden importa: como app-initializer habría corrido en paralelo con los
demás, y el bus, el seed y el mundo 3D podían registrar antes de saber si `debug` estaba encendido —
perdiendo justo las trazas del arranque. Si el fichero falta o es ilegible, `document` es `null`: la
app arranca en local-only con un `warn` y `debug` apagado.

### Comprobar que los eventos están llegando

Un evento sin suscriptor es invisible: se publica, se encola y se entrega a nadie, así que «no se
publicó» y «no lo escucha nadie» se ven igual. Para distinguirlos, `provideEventTracing()`
(`app.config.ts`) engancha `TraceEvents`, que registra en **`debug`** *todos* los nombres del
Published Language:

```js
// con `ng serve` ya salen; solo hay que usar la app
// [events] SupplySaved          { aggregateId: 'ing-manjar', occurredOn: '…', data: { name: 'Manjar blanco', … } }
// [events] RecipeSaved          { aggregateId: 'rec-bano-manjar', occurredOn: '…', data: { name: 'Baño de Manjar', ingredients: […], … } }
// [events] RecipeCapacitySaved  { aggregateId: 'RC-1', occurredOn: '…', data: { group: 'portions', label: '33', factor: 33 } }
```

Si un evento **no** aparece ahí, no se publicó (mira si el caso de uso llegó a guardar). Si aparece
pero no pasa lo que esperabas, el que falta es el suscriptor. Quitar `provideEventTracing()` de
`app.config.ts` lo apaga del todo.

## Styling — SOLO Tailwind del tema Migo (hard rule)

All DOM styling uses **Tailwind v4 utilities generated from the Migo theme** — **never raw CSS, `var(--token)`, or arbitrary values** (`p-[40px]`, `bg-[#fff]`). Missing values are added as **tokens** to the theme, not invented in templates.

- Theme source: `src/styles/migo/theme.css` (`@theme`) over the primitive palette in `palette.css`. Only **semantic** utilities exist (`bg-brand`, `text-body`, `rounded-xl`, `shadow-focus`, `min-h-11`).
- **No per-component `.css`/`styleUrl`.** Component style = utilities in the template and the decorator `host` object (static base in `host: { class }`; signal-driven variants via a `computed()` bound to `host: { '[class]' }`).
- The **only** global CSS (`src/styles.css`) is the theme import chain + document base + the CDK Dialog overlay chrome (which targets CDK-generated DOM that can't carry utilities).
- **Exception — the 3D world** (`platform/three/*` + the 3D render in `features/game/*`): rendered with three.js, not DOM, so this rule does not apply. A DOM HUD overlaid on the canvas still uses Tailwind.

## Mobile-first (hard rule) — see `mobile-first-conventions.md`

La app se usa **principalmente en móvil**; el uso en móvil debe ser fluido y sólido. Reglas que muerden:

- **Base = móvil.** Utilidades sin prefijo describen el móvil; se *mejora* con `sm:`/`md:`/`lg:`. Nunca desktop-first (`grid-cols-3` base que se aplasta). Breakpoints = defaults de Tailwind.
- **Diálogos/formularios full-bleed en móvil.** `MigoDialog` ocupa toda la pantalla en `<640px` (fijo, sin radio); el `migo-card` enviado usa el input **`fill`** para que solo el body scrollee y header/footer queden fijos. En `sm+` vuelve a tarjeta centrada (`max-h: 90dvh`).
- **Grillas/tablas no se aplastan**: apilan (`grid-cols-1 sm:…`) o scrollean en horizontal (`migo-grid`).
- **Targets táctiles ≥ 44px** (`min-h-11`). **Viewport sin zoom** (`src/index.html`) — excepción aceptada a la regla AXE `meta-viewport` (ver la regla y la sección de a11y de `.claude/CLAUDE.md`).

## Conventions that bite if missed

- Standalone components only; **never** set `standalone: true` (default in v20+). `ChangeDetectionStrategy.OnPush`. `input()`/`output()`/`computed()`/`signal()` — no `@Input`/`@Output`. Host bindings in the `host` object, never `@HostBinding`/`@HostListener`. Native control flow (`@if`/`@for`/`@switch`).
- **No `.component` suffix** on files or classes. Library selectors use `migo-`; feature selectors use `app-`.
- **Build all UI from `components/`.** If a needed component doesn't exist, create it there first (per `components-conventions.md`), then use it. Icons go through `<migo-icon>` (typed registry, `mat:`/`custom:` prefixes) — never inline `<svg>`.
- Cross-area imports use the `@` alias; intra-context `core/` imports stay relative.
