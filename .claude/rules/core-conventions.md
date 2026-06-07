# Core Conventions

Applies to files in `src/app/core/*/domain/`, `src/app/core/*/application/`, and `src/app/core/*/infrastructure/`.

## Ubiquitous Language

Names are part of the design, not decoration. Contexts, entities, value objects, use cases and methods must come from the **business language of the domain expert**, not from technical jargon. The code is the model.

- A context is named after a bounded area of the business (`auth`, `license`, `device`), never after a technical mechanism (`http`, `manager`, `data`).
- A use case is named after the **user's intention**: `RegisterLicense`, not `LicenseHandler` or `LicenseProcessor`.
- A domain method is named after the **business verb**: `license.activate(...)`, not `license.setStatus('active')`.

A file that satisfies every structural rule below but uses non-domain names (`DeviceManagerService.processData()`) still violates this convention.

## Folder structure

```
core/<context>/domain/
├── entities/            ← classes with identity by ID
├── value-objects/       ← classes with identity by value
├── repositories/        ← abstract Repository contracts (data access)
│   └── *.repository.ts
└── services/
    ├── *.service.ts         ← abstract Domain Service contracts (behavior)
    └── *.service.types.ts   ← interfaces used in the service contract

core/<context>/application/
└── use-cases/       ← one class per user intention

core/<context>/infrastructure/
├── *.repository.ts  ← concrete Repository implementations
├── *.service.ts     ← concrete Service implementations
├── *.mapper.ts      ← DTO ↔ domain entity translation
└── *-response.ts    ← API response DTOs (never in domain/)
```

The `application/` layer is reserved exclusively for use cases. Guards do NOT belong here — they live in `features/_common/guards/`.

The folder `domain/models/` is deprecated. Do not create new files there.

Cross-cutting projections that don't belong to a specific context (like the
`Resource` DTO used by Home, projected from multiple sources) live in
`core/_common/<topic>/` alongside the existing utilities (`use-case.ts`,
`jwt.utils.ts`).

> **Note — organize by pattern, deliberately.** `domain/` is split by tactical
> pattern (`entities/`, `value-objects/`, `repositories/`, `services/`).
> Classic DDD literature recommends grouping by business concept instead
> (`domain/model/<aggregate>/` holding the root, its children and its
> repository together). We keep the by-pattern layout for consistency with the
> Angular ecosystem; the trade-off is that an aggregate's root, value objects
> and repository live in separate folders. If a context ever grows an aggregate
> with several child entities, reconsider grouping that aggregate by concept.

## Repository vs Service

The distinction matters and the project splits them:

| Suffix | Use for | Examples |
| --- | --- | --- |
| `.repository.ts` | Pure data access (read/write to filesystem, HTTP, IPC, DB, keystore) | `ExerciseRepository`, `LocalExerciseRepository` |
| `.service.ts` | Behavior, orchestration, coordination, state | `HubDiscoveryService`, `SimulationService` |

**Rule of thumb:** if the class only translates calls toward a data source, it's a Repository. If it has logic, state, or coordinates operations across multiple collaborators, it's a Service.

Abstract Repository contracts live in `domain/repositories/`; abstract Service contracts live in `domain/services/`. Both have implementations in `infrastructure/` with the transport prefix (`Local*`, `Http*`).

> **Note on existing code:** `LicenseStorageService`, `LicenseCatalogService` and similar are conceptually Repositories, but were named `*Service` before this distinction was formalized. They remain as-is for now and are candidates for a rename in a future tech-debt pass.

## Dependency injection — prefer `inject()` over constructor

Use Angular's `inject()` function instead of constructor injection wherever possible. It reduces boilerplate (no constructor, no `super()` call) and is the modern Angular idiom.

```typescript
// Correct — inject()
@Injectable({ providedIn: 'root' })
export class CheckUpdatesUseCase extends UseCase<void, Observable<PackageInfo[]>> {
    private readonly _systemUpdate = inject(SystemUpdateService);

    execute(): Observable<PackageInfo[]> {
        return this._systemUpdate.checkUpdates();
    }
}

// Avoid — constructor injection
@Injectable({ providedIn: 'root' })
export class CheckUpdatesUseCase extends UseCase<void, Observable<PackageInfo[]>> {
    constructor(private readonly _systemUpdate: SystemUpdateService) {
        super();
    }

    execute(): Observable<PackageInfo[]> {
        return this._systemUpdate.checkUpdates();
    }
}
```

When `inject()` is not possible (e.g., the class is not in an injection context), constructor injection is acceptable as a fallback.

## Value Object — `domain/value-objects/`

Measures, quantifies or describes a concept whose **identity is its value**. Immutable.

A VO is NOT limited to a single primitive. It may either:

-   **Wrap one primitive** as a strong type — `OrganizationId`, `DeviceId`.
-   **Group several related attributes as a conceptual whole** — `Money { amount, currency }`, `DateRange { from, to }`. The attributes only make sense together.

Rules:

-   Immutable — never mutated; replaced as a whole.
-   Implement `equals()` (compares by value, attribute by attribute) and `toString()`.
-   Single-primitive VOs expose `readonly value: T`.
-   **Behavior is allowed** when it belongs to the value itself, as long as it has **no side effects** and **returns a new instance** — `money.add(other): Money`, `range.overlaps(other): boolean`. What is forbidden is application/orchestration logic (loading from repositories, calling services), not value semantics.

```typescript
// Single primitive — strong type over a string
export class OrganizationId {
    constructor(readonly value: string) {}
    equals(other: OrganizationId): boolean {
        return this.value === other.value;
    }
    toString(): string {
        return this.value;
    }
}

// Conceptual whole — several attributes + side-effect-free behavior
export class Money {
    constructor(
        readonly amount: number,
        readonly currency: string,
    ) {}
    add(other: Money): Money {
        if (other.currency !== this.currency) {
            throw new Error('Currency mismatch');
        }
        return new Money(this.amount + other.amount, this.currency);
    }
    equals(other: Money): boolean {
        return this.amount === other.amount && this.currency === other.currency;
    }
    toString(): string {
        return `${this.amount} ${this.currency}`;
    }
}
```

## Entity — `domain/entities/`

Object with multiple fields and **identity by ID**.

Rules:

-   Constructor accepts a private `*Data` interface (not exported) that normalizes input
-   All fields are `readonly`
-   Implement `equals()` comparing by `id`
-   Fields typed as value objects use the VO class, not `string`

```typescript
interface AuthUserData {
    id: string;
    name: string;
    organization?: string;
}

export class AuthUser {
    readonly id: string;
    readonly organizationId: OrganizationId;
    constructor(data: AuthUserData) {
        this.id = data.id;
        this.organizationId = new OrganizationId(data.organization ?? '');
    }
    equals(other: AuthUser): boolean {
        return this.id === other.id;
    }
}
```

### The domain decides, the use case orchestrates

`readonly` fields make entities immutable — but immutable is NOT the same as anemic. An entity that only carries data and `equals()` while all business rules live in use cases is an **Anemic Domain Model**, the anti-pattern this convention exists to prevent.

Business behavior and invariants belong **on the entity or value object**, expressed as intention-revealing methods that return a **new instance** (the immutable equivalent of state change):

```typescript
export class License {
    // ...readonly fields, constructor, equals()...

    // Business verb, validates its own invariant, returns a new instance
    activate(on: DeviceId): License {
        if (this.isExpired) {
            throw new LicenseExpiredError(this.id);
        }
        return new License({ ...this.toData(), activatedOn: on.value });
    }
}
```

The use case **orchestrates** — it loads the aggregate from the repository, calls the domain method, and persists the result. It must not contain business rules:

```typescript
// Correct — use case orchestrates, the entity decides
execute({ licenseId, deviceId }: ActivateLicenseInput): Promise<void> {
    const license = await this._licenses.byId(new LicenseId(licenseId));
    const activated = license.activate(new DeviceId(deviceId)); // ← rule lives here
    return this._licenses.save(activated);
}

// Wrong — anemic: the rule leaked into the use case
execute({ license, deviceId }: ActivateLicenseInput): Promise<void> {
    if (license.expiresAt < Date.now()) { // ← belongs on License.activate()
        throw new LicenseExpiredError(license.id);
    }
    // ...
}
```

**Rule of thumb:** if a rule can be expressed with the data the entity/VO already holds, it lives there — not in the use case.

## Aggregates

A cluster of entities and value objects that change together has an **Aggregate Root** — the single entity through which the cluster is accessed. Even though there are no transactions in the renderer, the aggregate is still the **consistency boundary** of the model.

-   **Child entities are created and modified only through the root.** Never instantiate a child entity on its own and attach it from outside — expose a method on the root (`order.addLine(...)`), not `new OrderLine(...)` followed by `order.setLine(...)`.
-   **One repository per Aggregate Root**, never per child entity. The repository loads and saves the whole aggregate.
-   **Reference other aggregates by identity, not by direct object reference.** Hold the other aggregate's id, not its instance. Across bounded contexts this id is a `string` (see [Cross-context type consistency](#cross-context-type-consistency)); within the same context it is the other root's value object id.
-   **Keep aggregates small.** Most are a single entity plus value objects. Pull an entity into the aggregate only when it must stay consistent with the root; otherwise model it as a separate aggregate referenced by id.

```typescript
// Correct — mutate through the root, which enforces the invariant
const updated = order.addLine(productId, new Money(2999, 'USD'));

// Wrong — building a child outside the root bypasses its invariants
const line = new OrderLine(productId, new Money(2999, 'USD'));
order.setLine(line); // ← do not do this
```

## Service Contract Types — `domain/services/*.service.types.ts`

Interfaces that form part of a domain service's contract (input/output types). They live alongside the service that defines them.

Rules:

-   Plain interfaces, no classes — callers pass object literals `{ email, password }`
-   No `equals()`, no behavior
-   Use cases import from `domain/services/*.service.types.ts`
-   Do NOT duplicate these types in `application/` — if the use case input matches the service contract 1:1, reuse the same interface

A command DTO in `application/use-cases/*.dto.ts` is only justified when the use case **transforms or aggregates** input before calling the service (i.e., the shapes differ). If it's 1:1, it's unnecessary duplication.

```typescript
// domain/services/auth.service.types.ts
export interface SignInCredentials {
    email: string;
    password: string;
}

// domain/services/auth.service.ts — uses the named type
abstract signIn(credentials: SignInCredentials): Promise<void>;

// application/use-cases/sign-in.use-case.ts — reuses the same type
execute(credentials: SignInCredentials): Promise<void> {
    return this._auth.signIn(credentials);
}

// feature — passes a plain object literal, no `new` needed
await this._signIn.execute({ email, password });
```

## Infrastructure services — `infrastructure/`

Each abstract service in `domain/services/` has a concrete implementation in `infrastructure/`. The implementation name follows the pattern `<Transport><DomainServiceName>`:

| Transport prefix | Meaning | Example |
|---|---|---|
| `Local*` | IPC — delegates to `window.*` (main process: filesystem, crypto, hardware) | `LocalDeviceIdentityService` |
| `Http*` | HTTP — calls an API directly from the renderer | `HttpLicenseCatalogService` |

### Naming alignment

The file name, class name, and domain contract must be consistent:

| Domain contract | Implementation class | File name |
|---|---|---|
| `LicenseStorageService` | `LocalLicenseStorageService` | `local-license-storage.service.ts` |
| `LicenseCatalogService` | `HttpLicenseCatalogService` | `http-license-catalog.service.ts` |
| `DeviceIdentityService` | `LocalDeviceIdentityService` | `local-device-identity.service.ts` |

The domain contract name reflects **what** the service does (responsibility). The implementation prefix reflects **how** it does it (transport).

### Service segregation

When a monolithic service has multiple responsibilities, split into focused services named by responsibility — not by transport:

```typescript
// Correct — named by responsibility
DeviceIdentityService     // getId, getSystemInfo
DeviceControlService      // restart, shutdown, factoryReset
DeviceSettingsService     // get, update, restore

// Wrong — named by transport
DeviceIpcService          // mixes identity + control + settings
DeviceHttpService         // mixes updates + system info
```

## API DTOs — `infrastructure/`

API response interfaces (`*Response`, `*Payload`) are infrastructure contracts, never domain models. They live in `infrastructure/` of their context.

## When to create a Value Object

| Condition                                                  | Recommended type                |
| ---------------------------------------------------------- | ------------------------------- |
| A use case returns or accepts it **as a standalone value** | Value Object                    |
| Has invariants or comparison logic (`=== 'owner'`)         | Enum or Value Object            |
| Only lives as a field of an entity, no logic of its own    | `string` / `number` / primitive |

If the value is **only accessed as `entity.field`** and never travels alone through the system, it does not need a VO.

## Cross-context type consistency

When a model in one context references an ID from another context, use `string` — NOT the other context's value object (that would violate bounded context boundaries).

```typescript
// DeviceInfo (device context) — organizationId as string
readonly organizationId: string;

// AuthUser (auth context) — uses its own value object
readonly organizationId: OrganizationId;
```
