# Unit Test Conventions

Applies to unit tests (`*.spec.ts`) of the bounded contexts under `src/app/core/`.

## CRITICAL: specs live in `testing/`, never beside the source file

A `*.spec.ts` sitting next to the file it tests mixes production and test code in the same folder and **hurts the readability of the source**. Every time you open `domain/entities/` you should see only domain entities, not their tests.

**Therefore: unit specs of a `core/` context live under that context's `testing/` folder, mirroring the source layer path** — they are never co-located with the source.

```
Wrong — spec beside source:
core/recipe-book/domain/value-objects/weight-range.ts
core/recipe-book/domain/value-objects/weight-range.spec.ts   ← clutters the source folder

Correct — spec mirrored under testing/:
core/recipe-book/domain/value-objects/weight-range.ts
core/recipe-book/testing/domain/value-objects/weight-range.spec.ts
```

The mirror inserts `testing/` right after the context root and keeps the rest of the path:
`core/<ctx>/<layer>/<sub>/x.ts` → `core/<ctx>/testing/<layer>/<sub>/x.spec.ts`.

## Scope

This rule applies **only to `core/` bounded contexts** — the DDD layers `domain/`, `application/`, `infrastructure/`, and the shared kernel `_common/`.

It does **not** apply to Angular component/feature specs: those stay **co-located** beside the component (idiomatic Angular), e.g. `src/app/app.spec.ts`, `features/<x>/<x>.spec.ts`.

This is the unit-test counterpart of `e2e-tests-conventions.md` (which governs `tests/e2e/`).

## Structure

```
core/recipe-book/
├── domain/
│   ├── value-objects/        ← only source
│   ├── entities/             ← only source
│   └── services/             ← only source
├── application/use-cases/    ← only source
├── infrastructure/           ← only source
└── testing/                  ← ALL tests + test doubles
    ├── recipe-book-test-doubles.ts        ← doubles at the testing/ root
    ├── domain/
    │   ├── value-objects/*.spec.ts
    │   ├── entities/*.spec.ts
    │   └── services/*.spec.ts
    ├── application/use-cases/*.spec.ts
    └── infrastructure/*.spec.ts
```

- The `testing/` **root** holds the context's **test doubles** (in-memory repositories, recording event bus, fakes) — `recipe-book-test-doubles.ts`, `memory-progress.repository.ts`. Doubles are NOT mirrored into layer subfolders; only specs are.
- Specs mirror the source layer path exactly so a reader can find the test for `domain/entities/sponge-recipe.ts` at `testing/domain/entities/sponge-recipe.spec.ts`.

## Naming

Preserve the source file's name plus `.spec.ts`, keeping any role suffix:

| Source | Spec |
|---|---|
| `sponge-recipe.ts` | `sponge-recipe.spec.ts` |
| `save-ingredient.use-case.ts` | `save-ingredient.use-case.spec.ts` |
| `ingredient.mapper.ts` | `ingredient.mapper.spec.ts` |

Cross-context integration tests use `*.integration.spec.ts` and live in the **downstream** context's `testing/` (it owns the integration), e.g. `progression/testing/infrastructure/cake-composed-progress.integration.spec.ts`.

## Framework

- Tests run on **vitest** via the `@angular/build:unit-test` builder, using globals (`describe` / `it` / `expect`) — no per-file imports of the test API.
- **Pure domain** (value objects, entities, pure domain services): plain unit tests, **no `TestBed`** — construct the class directly.
- **DI-based** (use cases, subscribers, anything using `inject()`): use `TestBed.configureTestingModule({ providers })`, wiring the abstract repositories/`EventBus` to the context's `testing/` **doubles**. Use a real `InMemoryEventBus` when the test must exercise publish/subscribe end-to-end; a `RecordingEventBus` double when it only needs to assert what was published.

## `testing/` is test-only

- **Excluded from the production build:** `tsconfig.app.json` excludes `src/**/testing/**` (and `src/**/*.spec.ts`). Doubles and specs are never type-checked into nor bundled with the app.
- **Discovered for tests:** `tsconfig.spec.json` includes `src/**/*.spec.ts`, so specs under `testing/` are found wherever they sit.
- Production code (including `*.providers.ts`) must **never import from `testing/`**. Only specs import doubles.

## Checklist before adding a `core/` unit test

- [ ] The spec is under `core/<ctx>/testing/` mirroring the source layer path — not beside the source.
- [ ] Its name is `<source-name>.spec.ts` (role suffix preserved).
- [ ] Test doubles it needs live at the `testing/` root and are reused, not redefined per spec.
- [ ] No production file imports anything from `testing/`.
