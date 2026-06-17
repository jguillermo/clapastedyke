
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

> **Excepción ÚNICA y aceptada — zoom del usuario.** El viewport desactiva el zoom
> (`maximum-scale=1, user-scalable=no`, `src/index.html`) a propósito, para que la app se sienta
> nativa y "sólida" en móvil (decisión de producto). Esto incumple WCAG 1.4.4 y dispara la regla
> **`meta-viewport` de AXE**: es la **única** excepción a "MUST pass all AXE checks" y **NO se
> arregla** — si hay una corrida de AXE en `/ui`/e2e, se deshabilita esa regla puntual. El resto de
> WCAG AA (contraste, foco, ARIA, teclado) sigue siendo obligatorio. Ver
> [mobile-first-conventions.md](rules/mobile-first-conventions.md).

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Styling — SOLO Tailwind, nada de CSS puro

**Todo el estilado de la app (componentes, features, layout, diálogos, HUD) se hace con utilidades
de Tailwind v4 generadas del tema Migo. NO se escribe CSS puro.** Aplica a todo el desarrollo salvo
el render **three.js** (`platform/three/*` + el render 3D de `features/game/*`), que no es DOM.

- **Sin `.css`/`styleUrl` por componente ni feature.** El estilo son utilidades Tailwind en la
  plantilla y en el objeto `host` (base estática en `host: { class }`; variantes por signal en un
  `computed()` enlazado a `host: { '[class]' }`).
- **El tema es la única fuente** (`src/styles/migo/theme.css`, directiva `@theme`): genera una
  utilidad por token **semántico** del design system (`bg-brand`, `text-body`, `rounded-xl`,
  `shadow-focus`, `min-h-11`…) sobre la paleta primitiva de `palette.css`.
- **PROHIBIDO valores arbitrarios** de Tailwind (`p-[40px]`, `bg-[#fff]`, `text-[13px]`),
  `var(--token)` y CSS crudo. Si falta un valor, se añade como token al tema; no se inventa en la
  plantilla. (Variantes estructurales como `[&>*]:`, `peer-*`, `group-*`, `aria-*`,
  `motion-reduce:` **sí** se permiten: condicionan, no introducen medidas/colores mágicos.)
- **Único CSS global permitido**: `src/styles.css` (tema + base del documento + chrome del overlay
  de CDK Dialog, que apunta a DOM generado por el CDK y no puede llevar utilidades).
- Detalle completo y mapeo de tokens en
  [components-conventions.md](rules/components-conventions.md) → "Estilo: solo utilidades Tailwind
  del tema Migo".

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Project Rules (`.claude/rules/`)

Convenciones específicas por área. Consulta la regla correspondiente antes de tocar esos ficheros:

- [components-conventions.md](rules/components-conventions.md) — **librería de componentes** en `src/app/components/`: UI agnóstica con **Angular CDK**, **cero lógica de negocio**, estilo con **utilidades Tailwind del tema Migo** (sin CSS por componente; sin valores arbitrarios), `ControlValueAccessor` para form controls, patrón de Overlay.
- [mobile-first-conventions.md](rules/mobile-first-conventions.md) — **regla dura**: toda la UI DOM es **mobile-first** (base = móvil, se mejora con `sm:`/`md:`/`lg:`); diálogos/formularios **full-bleed** en móvil (`migo-card` con `fill`), grillas que no se aplastan, targets ≥44px, **viewport sin zoom** (excepción aceptada a AXE). Verificar a 375px.
- [path-aliases-conventions.md](rules/path-aliases-conventions.md) — alias `@app/@components/@core/@features/@platform`: **cruzar áreas con alias, intra-contexto `core/` relativo**.
- [core-conventions.md](rules/core-conventions.md) — DDD en `core/`: entities, value objects, aggregates, repositories vs services, use cases.
- [features-conventions.md](rules/features-conventions.md) — features (páginas de ruta): inyectan use cases, nunca servicios de dominio.
- [features-common-conventions.md](rules/features-common-conventions.md) — reutilizables cross-feature en `features/_common/` (guards, pipes).
- [platform-conventions.md](rules/platform-conventions.md) — mecanismos técnicos transversales en `platform/`.
- [providers-conventions.md](rules/providers-conventions.md) — DI por contexto con `provide*()` y `makeEnvironmentProviders`.
- [assets-conventions.md](rules/assets-conventions.md) — recursos estáticos en `src/assets/`.
- [unit-tests-conventions.md](rules/unit-tests-conventions.md) — specs de `core/` bajo `testing/`; specs de componentes co-locados.
- [e2e-tests-conventions.md](rules/e2e-tests-conventions.md) — tests E2E en `tests/e2e/`: flujos completos, no estados intermedios.
- [main-process-conventions.md](rules/main-process-conventions.md) — proceso principal de Electron en `app/src/`.
- [example-conventions.md](rules/example-conventions.md) — ejemplo DDD canónico de punta a punta.
