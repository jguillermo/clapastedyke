# Unit Test Conventions

Applies to unit tests (`*.spec.ts`) of the bounded contexts under `src/app/core/`.

## CRITICAL: solo el dominio y los casos de uso se testean por unidad

Los **únicos** tests unitarios del proyecto son los de `src/app/core/<bounded-context>/`, y solo de
**dos capas**:

| Capa | Qué se testea |
|---|---|
| `domain/` | entities, value objects y servicios de dominio puros — las **reglas de negocio** |
| `application/use-cases/` | un spec por **caso de uso** (la orquestación de una intención del usuario) |

**Nada más es un test unitario.** No se escriben specs unitarios de:

| No se testea por unidad | Dónde se cubre |
|---|---|
| `features/` (páginas, diálogos, formularios) | **E2E** en `e2e/` — ver [e2e-tests-conventions.md](e2e-tests-conventions.md) |
| `components/` (librería del design system) | el **`play`** de su `*.stories.ts` — ver [components-conventions.md](components-conventions.md) |
| `platform/` (three.js, viewport…) | E2E de la vista que lo usa |
| `core/*/infrastructure/` (repositorios, mappers, seed) | se ejercita desde los casos de uso y desde E2E |

> Si una regla de negocio necesita test, **vive en el dominio** y se testea ahí. Si lo que se quiere
> comprobar es que el usuario puede hacer algo de punta a punta, eso es un **E2E**, no un unitario.

## CRITICAL: los specs viven en `testing/`, nunca junto al fuente

Un `*.spec.ts` al lado del fichero que prueba mezcla producción y test en la misma carpeta y
**estropea la legibilidad del fuente**: al abrir `domain/entities/` se deben ver solo entidades, no
sus tests. Con muchas clases juntas, además, la carpeta se vuelve ilegible.

**Por eso: los specs de un contexto de `core/` viven bajo la carpeta `testing/` de ese contexto,
replicando exactamente la ruta del fuente.**

```
Mal — spec junto al fuente:
core/recipe-book/domain/value-objects/weight-range.ts
core/recipe-book/domain/value-objects/weight-range.spec.ts   ← ensucia la carpeta del fuente

Bien — spec replicado bajo testing/:
core/recipe-book/domain/value-objects/weight-range.ts
core/recipe-book/testing/domain/value-objects/weight-range.spec.ts
```

El espejo inserta `testing/` justo después de la raíz del contexto y **conserva el resto de la ruta
tal cual**:

`core/<ctx>/<capa>/<sub>/x.ts` → `core/<ctx>/testing/<capa>/<sub>/x.spec.ts`

## Estructura

```
core/recipe-book/
├── domain/
│   ├── value-objects/        ← solo fuente
│   ├── entities/             ← solo fuente
│   ├── services/             ← solo fuente
│   └── repositories/         ← solo fuente
├── application/use-cases/    ← solo fuente
├── infrastructure/           ← solo fuente (no se testea por unidad)
└── testing/                  ← TODOS los tests + los dobles
    ├── recipe-book-test-doubles.ts        ← los dobles, en la raíz de testing/
    ├── domain/                            ← espejo EXACTO de domain/
    │   ├── value-objects/*.spec.ts
    │   ├── entities/*.spec.ts
    │   └── services/*.spec.ts
    └── application/                       ← espejo EXACTO de application/
        └── use-cases/*.spec.ts
```

- **Solo se replican `domain/` y `application/`** dentro de `testing/`: son las dos capas con tests
  unitarios.
- La **raíz** de `testing/` guarda los **dobles** del contexto (repositorios en memoria, event bus de
  registro, fakes) — `recipe-book-test-doubles.ts`. Los dobles **no** se replican en subcarpetas de
  capa; solo los specs.
- El espejo es literal: el test de `domain/entities/sponge-recipe.ts` está en
  `testing/domain/entities/sponge-recipe.spec.ts`.
- **`core/_common/`** es el shared kernel, no un bounded context: no tiene capas, así que sus specs de
  primitivas de dominio (`EntityId`, `Quantity`) van directos en `_common/testing/`.

> **Legado.** Quedan tres specs bajo `recipe-book/testing/infrastructure/` (mappers y seed) escritos
> antes de esta regla. No se añaden más specs de `infrastructure/`; los existentes son deuda a
> retirar cuando su cobertura quede absorbida por los casos de uso y los E2E.

## Naming

Se conserva el nombre del fuente más `.spec.ts`, manteniendo el sufijo de rol:

| Fuente | Spec |
|---|---|
| `sponge-recipe.ts` | `sponge-recipe.spec.ts` |
| `save-ingredient.use-case.ts` | `save-ingredient.use-case.spec.ts` |
| `purchase-price.ts` | `purchase-price.spec.ts` |

Los tests de integración entre contextos usan `*.integration.spec.ts` y viven en el `testing/` del
contexto **aguas abajo** (el que posee la integración), p. ej.
`progression/testing/application/cake-composed-progress.integration.spec.ts`.

## Framework

- Corren con **vitest** vía el builder `@angular/build:unit-test`, con globals
  (`describe` / `it` / `expect`) — sin imports de la API de test en cada fichero.
- **Dominio puro** (value objects, entities, servicios de dominio puros): test unitario plano,
  **sin `TestBed`** — se construye la clase directamente.
- **Casos de uso** (usan `inject()`): `TestBed.configureTestingModule({ providers })`, enchufando los
  repositorios abstractos y el `EventBus` a los **dobles** de `testing/`. `InMemoryEventBus` real
  cuando el test debe ejercitar publish/subscribe de punta a punta; el doble `RecordingEventBus`
  cuando solo hace falta asertar qué se publicó.
- El caso de uso se testea por su **contrato**: entrada → efecto observable en el repositorio doble y
  eventos publicados. Las reglas de negocio se asertan en el spec del dominio, no aquí (si una regla
  solo se puede comprobar desde el caso de uso, está en la capa equivocada).

## `testing/` es solo para tests

- **Fuera del build de producción:** `tsconfig.app.json` excluye `src/**/testing/**` (y
  `src/**/*.spec.ts`). Dobles y specs nunca se type-checkean ni se empaquetan con la app.
- **Descubiertos para test:** `tsconfig.spec.json` incluye `src/**/*.spec.ts`, así que los specs bajo
  `testing/` se encuentran donde estén.
- El código de producción (incluidos los `*.providers.ts`) **nunca** importa de `testing/`. Solo los
  specs importan dobles.

## Checklist antes de añadir un test unitario

- [ ] Lo que se prueba es **dominio** o un **caso de uso** de `core/` (si no, no es un unitario: será
      un E2E en `e2e/` o el `play` de una story).
- [ ] El spec está bajo `core/<ctx>/testing/` **replicando la ruta del fuente** (`domain/…` o
      `application/…`), no junto al fuente.
- [ ] Se llama `<nombre-del-fuente>.spec.ts` (sufijo de rol incluido).
- [ ] Los dobles que necesita viven en la raíz de `testing/` y se reutilizan, no se redefinen por spec.
- [ ] Ningún fichero de producción importa nada de `testing/`.
