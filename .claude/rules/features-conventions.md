# Feature Conventions

Applies to files in `src/app/features/`.

## What is a feature

A feature is a **route-level page component** — one per route. Features orchestrate UI and delegate all business logic to use cases.

There is NO 1-to-1 correspondence between features and core contexts. A feature can use multiple contexts; a context can serve multiple features.

## Construir la UI con los componentes del design system

La plantilla HTML de una feature **se arma con los componentes de `@components/`** (`migo-button`,
`migo-card`, `migo-input`, `MigoDialog`, etc.), no con HTML/CSS ad-hoc. Si falta un componente, **se
crea primero en la librería** y luego se usa (la biblioteca crece conforme se necesita). Regla
completa en [`components-conventions.md`](components-conventions.md) → "Uso obligatorio".

Cuando una feature maqueta layout propio alrededor de esos componentes (rejillas, secciones,
HUD…), lo hace con **utilidades Tailwind del tema Migo** (sin `.css`/`styleUrl`, sin valores
arbitrarios), igual que la librería — ver [`components-conventions.md`](components-conventions.md)
→ "Estilo: solo utilidades Tailwind del tema Migo".

**Excepción:** el mundo 3D (`features/game/*` + `platform/three/*`) se renderiza con three.js y no
aplica esta regla. (El **HUD DOM** superpuesto al canvas sí usa utilidades Tailwind; solo el render
3D queda fuera.)

## Import rules

Features may import from:

| Source | What | Example |
|---|---|---|
| `core/*/application/use-cases/` | Use cases, DTOs | `SignInUseCase`, `RegisterLicenseDto` |
| `core/*/domain/entities/` | Entity classes (as types) | `License`, `AuthUser` |
| `core/*/domain/value-objects/` | Value object classes (as types) | `DeviceId`, `OrganizationId` |
| `core/*/domain/services/*.types.ts` | Service contract interfaces | `SignInCredentials`, `LicenseBindingData` |
| `features/_common/` | Cross-feature guards, components, pipes | `Logo`, `InitialsPipe`, `authGuard` |
| `platform/` | Cross-cutting infrastructure | `TranslocoDirective` |

Features must NEVER import:

| Forbidden source | Why |
|---|---|
| `core/*/domain/services/*.service.ts` | Inject use cases, not domain services directly |
| `core/*/infrastructure/` | Implementation details are hidden behind the domain contract |
| Other features | Features are independent route-level units |

## Component naming

- No `.component` suffix on files or classes — the `@Component` decorator is sufficient
- File: `sign-in.ts`, class: `SignIn`
- Associated files follow the same pattern: `sign-in.html`, `sign-in.scss`, `sign-in.spec.ts`
- Selectors use kebab-case: `app-sign-in`

## Use case injection

Features inject **use cases**, never domain services. Each use case represents one user intention. Use `inject()` instead of constructor injection.

```typescript
// Correct — inject() with a use case
private readonly _signIn = inject(SignInUseCase);

// Wrong — constructor injection
constructor(private readonly _signIn: SignInUseCase) {}

// Wrong — feature injects a domain service directly
private readonly _auth = inject(AuthService);
```

## Passing data to use cases

Use plain object literals when the use case accepts a service contract type. Do NOT instantiate classes for input.

```typescript
// Correct — object literal
await this._signIn.execute({ email, password });

// Wrong — unnecessary class instantiation
await this._signIn.execute(new SignInCredentials(email, password));
```

## Standalone components

All components must be standalone (`@angular-eslint/prefer-standalone: "error"`). There is no `AppModule` — the app uses `bootstrapApplication`.

## Feature structure

Each feature lives in its own folder under `features/`:

```
features/
├── sign-in/
│   ├── sign-in.ts
│   ├── sign-in.html
│   └── sign-in.spec.ts
└── setup/
    ├── setup.routes.ts
    ├── select-license/
    │   ├── select-license.ts
    │   └── select-license.html
    └── check-updates/
        ├── check-updates.ts
        └── check-updates.html
```

Route configuration lives in `*.routes.ts` files within the feature folder.

## Guards

Cross-feature reusables live in `features/_common/` — guards and pipes shared across multiple features. See `features-common-conventions.md` for full rules.

```
features/
├── _common/
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── no-auth.guard.ts
│   │   ├── license.guard.ts
│   │   └── setup.guard.ts
│   └── pipes/
│       ├── convert-units.pipe.ts
│       ├── initials.pipe.ts
│       ├── range.pipe.ts
│       ├── time-format.pipe.ts
│       └── time-unit.pipe.ts
├── sign-in/
└── setup/
```

Guards follow the same injection rule as components: **inject use cases, never domain services**. Use `inject()`.

```typescript
// Correct — inject() with use cases
private readonly _checkAuth = inject(CheckAuthUseCase);
private readonly _router = inject(Router);

// Wrong — constructor injection
constructor(
    private readonly _checkAuth: CheckAuthUseCase,
    private readonly _router: Router
) {}

// Wrong — guard injects a domain service directly
private readonly _authService = inject(AuthService);
```

Guards must NOT live in `core/*/application/`. The `application/` layer inside a bounded context is reserved exclusively for use cases.
