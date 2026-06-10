# Platform Conventions

Applies to files in `src/app/platform/`.

## What is platform

`platform/` contains **cross-cutting technical mechanisms** — infrastructure that the entire app needs but that carries no business domain logic. Think of it as "how the app works technically" vs "what the app does as business".

## Origin of the name

The name follows Angular's own convention: `@angular/platform-browser`, `@angular/platform-server`. Angular uses `platform-*` for packages that adapt the framework to a specific runtime environment. Our `platform/` folder serves the same role at application level — it adapts technical concerns (error handling, translation) so the rest of the app can consume them without coupling to implementation details.

### Why not `infrastructure/`?

Each bounded context in `core/` already has its own `infrastructure/` folder for concrete implementations. Using the same name at app level would create ambiguity: `core/auth/infrastructure/` (context-specific) vs `infrastructure/` (cross-cutting). `platform/` avoids the collision and communicates a different intent.

## Import rules

| Rule | Detail |
|---|---|
| Must NOT import from `core/` | Platform has no knowledge of business domains |
| Must NOT import from `features/` | Platform has no knowledge of pages or routes, including `features/_common/` |
| May import from Angular and external libraries | Framework APIs, third-party packages |

Features, `features/_common/`, and layout may import from `platform/`.

### Exception — `DomainError` contract

`GlobalErrorHandler` imports the `DomainError` abstract class from `core/_common/error/domain-error.ts` to read `error.code` from any domain error that bubbles up. `DomainError` itself is a domain concept: it encodes the product rule that every error surfaced to the user must carry a deterministic triage code for validation and support. It belongs in `core/` for that reason. The exception here is narrow — platform only reads the contract to render and log the code, never to enact business logic.

A future refactor may eliminate this exception by modelling errors as a use case that encapsulates the domain entity — at that point platform would consume the use case's output without touching `core/` directly.

## Internal structure

Platform modules use a **flat structure** — no DDD layers (`domain/`, `infrastructure/`, `application/`). DDD layering is reserved for bounded contexts in `core/`.

The only justified subdirectory is `ui/` for visual components (e.g., error dialogs).

```
platform/
├── platform.providers.ts       # Aggregates all platform providers
├── error/
│   ├── error.providers.ts
│   ├── error.exception.ts
│   ├── error-factory.ts
│   ├── error-handler.ts        # Angular ErrorHandler
│   ├── error.messages.ts
│   ├── error-types.ts
│   ├── error-zone.service.ts
│   └── ui/                     # Only subdirectory — contains visual components
│       └── error-dialog.ts
├── http/
│   ├── http.providers.ts
│   └── auth.interceptor.ts     # HTTP interceptor (documented core/ exception)
└── translation/
    ├── translation.providers.ts
    ├── translation.config.ts
    ├── translation.http-loader.ts
    └── translation.missing-handler.ts
```

## Subdirectory rule

> Subdirectories only when there are UI components.

A platform module stays flat by default. Add a `ui/` subdirectory only when the module needs Angular components or dialogs (e.g., `error/ui/error-dialog.ts`). Do not create `services/`, `models/`, or other subdirectories — keep files at the module root.

## Provider pattern

Each platform module exposes a `provide*()` function using `makeEnvironmentProviders`, aggregated in `platform.providers.ts`:

```typescript
// platform/error/error.providers.ts
export function provideErrorHandling(): EnvironmentProviders {
    return makeEnvironmentProviders([...]);
}

// platform/platform.providers.ts
export function providePlatform(): EnvironmentProviders {
    return makeEnvironmentProviders([
        provideErrorHandling(),
        provideTranslation(),
    ]);
}
```

## Naming

- Files keep their descriptive suffix: `*.service.ts`, `*.config.ts`, `*.providers.ts`
- No `.component` suffix for UI components: `error-dialog.ts`, not `error-dialog.component.ts`
- Selectors use kebab-case: `app-error-dialog`
