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
| Must NOT import from `core/` | Platform has no knowledge of business domains — **two narrow exceptions below** |
| Must NOT import from `features/` | Platform has no knowledge of pages or routes, including `features/_common/` |
| May import from Angular and external libraries | Framework APIs, third-party packages |

Features, `features/_common/`, and layout may import from `platform/`.

### Las dos excepciones — contratos de `core/_common/`

Están escritas como globs negativos en `eslint.config.mjs` (bloque de `src/app/platform/**`). Son las
**únicas**, y las dos apuntan al shared kernel, que no tiene dominio dentro:

```js
group: [
  ...AREA.core,
  '!@core/_common/error',  '!@core/_common/error/**',
  '!@core/_common/logger', '!@core/_common/logger/**',
  ...AREA.features,
],
```

**1. El puerto `Logger`** (`@core/_common/logger/logger`) — **la única viva hoy**. `platform/` también
registra: lo usan `GlobalErrorHandler` y `ViewportService`, y los motores 3D lo reciben por
constructor desde la feature. El puerto vive en `core/_common/` y no aquí porque **`core/` también
registra y no puede importar de `platform/`**; la dependencia inversa sí es posible, así que la
grieta se abre en este lado. Regla completa en
[logging-conventions.md](logging-conventions.md).

**2. El contrato `DomainError`** (`@core/_common/error/…`) — **aspiracional: ese directorio todavía no
existe** en este repo. Cuando exista, `GlobalErrorHandler` leerá su `code` para poder mostrarlo y
registrarlo, nunca para ejecutar lógica de negocio. `DomainError` es un concepto de dominio (codifica
la regla de producto de que todo error mostrado lleve un código de triaje determinista), y por eso
vive en `core/`.

Ninguna de las dos autoriza a importar nada más de `core/`: ni una entidad, ni un caso de uso, ni un
contexto.

## Internal structure

Platform modules use a **flat structure** — no DDD layers (`domain/`, `infrastructure/`, `application/`). DDD layering is reserved for bounded contexts in `core/`.

The only justified subdirectory is `ui/` for visual components (e.g., error dialogs).

Lo que hay hoy en el repo:

```
platform/
├── platform.providers.ts       # Agrega los providers de la capa
├── error/
│   ├── error-handler.ts        # GlobalErrorHandler → Logger, scope [uncaught]
│   └── error.providers.ts      # provideErrorHandling()
├── viewport/
│   ├── viewport.providers.ts
│   └── viewport.service.ts
├── stale-build/
│   └── stale-build.ts          # Recarga cuando el despliegue cambió bajo una pestaña abierta
└── three/                      # El motor 3D (no es DOM: fuera de las reglas de estilo)
    ├── kitchen-engine.ts  camera-rig.ts  chef-engine.ts  …
    └── book/
        └── book-engine.ts  page-turn.ts  …
```

El módulo `error/` es el **último recinto**: `provideBrowserGlobalErrorListeners()` (en
`app.config.ts`) engancha `window.error` y `unhandledrejection` y los enruta al `ErrorHandler` de la
app, así que **no hacen falta listeners propios** — añadirlos duplicaría cada reporte. Sin este
módulo, Angular usaría su handler por defecto, que escribe con un `console.error` crudo y se salta el
puerto.

Un módulo con UI añadiría un `ui/` (p. ej. `error/ui/error-dialog.ts`); hoy no hay ninguno.

## Subdirectory rule

> Subdirectories only when there are UI components.

A platform module stays flat by default. Add a `ui/` subdirectory only when the module needs Angular components or dialogs (e.g., `error/ui/error-dialog.ts`). Do not create `services/`, `models/`, or other subdirectories — keep files at the module root.

## Provider pattern

Each platform module exposes a `provide*()` function using `makeEnvironmentProviders`, aggregated in `platform.providers.ts`.

> **Excepción — lo que no es un provider.** `stale-build/` exporta una función suelta y no un
> `provide*()`: lo suyo es una **feature del router** (`withNavigationErrorHandler`), que solo se
> puede pasar como argumento a `provideRouter(...)` y no cabe en un `makeEnvironmentProviders`. Se
> engancha en `app.config.ts`. Corre en contexto de inyección, así que puede usar `inject()`.

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
