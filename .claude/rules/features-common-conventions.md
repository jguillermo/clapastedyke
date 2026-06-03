# Features Common Conventions

Applies to files in `src/app/features/_common/`.

## What is \_common

`features/_common/` contains **cross-feature reusables** — guards and pipes shared across multiple features. These pieces have no business logic and no dependency on any specific feature. If it can work across any feature without knowing about a particular route, it belongs here.

## Why `_common/` instead of `shared/`

Previously these lived in a top-level `shared/` directory. Moving them under `features/` reflects that they are consumed exclusively by features and layout — they are part of the feature layer, not a separate architectural layer. The `_` prefix sorts the folder first and signals "infrastructure for features, not a feature itself."

## Import rules

| Rule                                           | Detail                                 |
| ---------------------------------------------- | -------------------------------------- |
| May import from Angular and external libraries | Framework APIs, third-party packages   |
| Must NOT import from `core/`                   | No business logic dependency           |
| Must NOT import from specific features         | No page-level dependency               |
| Must NOT import from `platform/`               | No technical infrastructure dependency |

`features/`, `layout/`, and `platform/` may import from `features/_common/`.

## Structure

```
features/_common/
├── guards/
│   ├── auth.guard.ts
│   ├── no-auth.guard.ts
│   ├── license.guard.ts
│   └── setup.guard.ts
└── pipes/
    ├── convert-units.pipe.ts
    ├── initials.pipe.ts
    ├── range.pipe.ts
    ├── time-format.pipe.ts
    └── time-unit.pipe.ts
```

## Naming

-   Components follow the no-`.component`-suffix convention: `logo.ts` / `class Logo`
-   Pipes keep the `.pipe.ts` suffix: `initials.pipe.ts` / `class InitialsPipe`
-   Guards keep the `.guard.ts` suffix: `auth.guard.ts`
-   Animations are plain exported functions, no suffix needed
-   Selectors use kebab-case: `app-logo`

## Standalone components

All components and pipes must be **standalone**. There is no shared module — consumers import each piece directly in their `imports` array.

```typescript
// Consumer component
@Component({
    imports: [Logo, InitialsPipe],
    // ...
})
export class SelectLicense {}
```

## Guidelines

-   **No business logic** — components receive data via `@Input()` and emit events via `@Output()`. They never inject domain services.
-   **No state management** — components are stateless. They render what they receive.
-   **Guards inject use cases** — guards orchestrate use cases to decide navigation. They never inject domain services directly. Use `inject()`.
-   **Utils are functions, not classes** — if utility functions are needed, use plain exported functions in a `*.utils.ts` file, not injectable services.
-   **One component per folder** — each component lives in its own folder with its template, styles, and spec file.
-   **Pipes are flat** — pipes live directly under `pipes/` without individual folders, since they are single-file.
