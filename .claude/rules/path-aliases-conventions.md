# Path Alias Conventions

Applies to all TypeScript imports under `src/app/`.

## Core principle

Cada área de primer nivel bajo `src/app/` tiene un **alias `@`**. Los imports que **cruzan
áreas** usan el alias; los imports **internos de un mismo contexto/carpeta** se quedan
**relativos**.

## Aliases

Declarados en `tsconfig.json` → `compilerOptions.paths`:

| Alias | Apunta a |
|---|---|
| `@app/*` | `./src/app/*` |
| `@components/*` | `./src/app/components/*` |
| `@core/*` | `./src/app/core/*` |
| `@features/*` | `./src/app/features/*` |
| `@platform/*` | `./src/app/platform/*` |

```jsonc
// tsconfig.json
"compilerOptions": {
  "paths": {
    "@app/*": ["./src/app/*"],
    "@components/*": ["./src/app/components/*"],
    "@core/*": ["./src/app/core/*"],
    "@features/*": ["./src/app/features/*"],
    "@platform/*": ["./src/app/platform/*"]
  }
}
```

> **Sin `baseUrl`.** TypeScript 6 deprecó `baseUrl` (error `TS5101`). Por eso los `paths` van
> **sin** `baseUrl` y con **targets relativos** (`./src/app/...`); si se omite el `./`,
> TypeScript 6 lanza `TS5090`. Tanto el build de Angular (esbuild) como el runner de tests
> (vitest) resuelven estos `paths`.

## Cuándo alias y cuándo relativo

| Situación | Import |
|---|---|
| Cruzar áreas (feature → componente, feature → use case, app → core, feature → platform) | **Alias** `@components/...`, `@core/...`, `@features/...`, `@platform/...` |
| Dentro del **mismo contexto** de `core/` (entity → value-object, mapper → response, use case → repository del mismo contexto) | **Relativo** `../value-objects/x`, `./x.repository` |
| Dentro de la **misma carpeta** (componente → su barrel/sibling directo del mismo módulo) | **Relativo** `./x` |
| Entre componentes de la librería (`components/input` → `components/form-field`) | **Alias** `@components/form-field/form-field` |

### Por qué intra-`core` es relativo

Dentro de un bounded context, la cercanía relativa es la **locality idiomática de DDD**: el
agregado, sus value objects, su repositorio y su mapper viven juntos y se referencian entre sí
con rutas cortas. Reescribir esos imports a `@core/<ctx>/...` añade ruido sin ganar nada y
acopla el contexto a su propia ruta absoluta. **No migrar los imports internos de un contexto.**

```typescript
// Correcto — cruzar áreas con alias
import { SignInUseCase } from '@core/auth/application/use-cases/sign-in.use-case';
import { Button } from '@components/button/button';
import { KitchenEngine } from '@platform/three/kitchen-engine';

// Correcto — dentro del mismo contexto de core, relativo
import { OrganizationId } from '../value-objects/organization-id';
import { AuthUserResponse } from './auth-user-response';

// Incorrecto — alias para un import interno del propio contexto
import { OrganizationId } from '@core/auth/domain/value-objects/organization-id'; // ← usar relativo
```

## Reglas

- **Todo import que sale del área actual usa alias.** Nada de `../../platform/...` ni
  `../../components/...`.
- **Los `import()` dinámicos (lazy routes) también usan alias** —
  `loadComponent: () => import('@features/ui-showcase/ui-showcase')`.
- **Nunca añadir `baseUrl`** — rompe en TypeScript 6. Si se necesita un alias nuevo, añadirlo a
  `paths` con target relativo (`./src/app/...`).
- Esta regla **no** sustituye a las reglas de capas: que un import sea técnicamente posible con
  alias no autoriza dependencias prohibidas (p.ej. `components/` sigue sin poder importar de
  `core/`, ver [components-conventions.md](components-conventions.md)).
