# Canonical DDD Example

This file is **not a rule** — it is a single, end-to-end worked example that shows what code looks like when **every** DDD convention in `.claude/rules` is followed at once. Read it alongside:

- `core-conventions.md` — entities, value objects, aggregates, repositories, services, use cases
- `features-conventions.md` — how a feature consumes a use case
- `providers-conventions.md` — abstract → concrete DI bindings
- `main-process-conventions.md` — the mapper as Anticorruption Layer

It follows the rules **to the letter**, even where the existing code in some contexts predates them. When in doubt, this example is the reference shape for **new** code.

The domain is an invented `purchasing` bounded context (buying supplies from suppliers), chosen because it fits the kitchen/`catalog` Ubiquitous Language without colliding with any real context. Each artifact is preceded by a short **Por qué** that names the rule it satisfies.

---

## 1. Ubiquitous Language + folder layout

**Por qué:** names come from the business, not from technical jargon. A purchaser **places** a `PurchaseOrder` to a supplier and later **receives** it. The folder layout is organized **by tactical pattern** (`core-conventions.md` §Folder structure — a deliberate, documented divergence from grouping-by-aggregate).

```
core/purchasing/
├── domain/
│   ├── entities/
│   │   ├── purchase-order.ts          ← Aggregate Root
│   │   └── purchase-order-line.ts     ← child entity (accessed only via the root)
│   ├── value-objects/
│   │   ├── purchase-order-id.ts       ← single-primitive VO
│   │   └── quantity.ts                ← conceptual-whole VO
│   ├── repositories/
│   │   └── purchase-order.repository.ts   ← abstract contract (data access)
│   └── services/
│       ├── exchange-rate.service.ts        ← abstract contract (behavior)
│       └── exchange-rate.service.types.ts  ← contract input/output types
├── application/
│   └── use-cases/
│       ├── place-purchase-order.use-case.ts
│       └── get-purchase-order-total-in-currency.use-case.ts
├── infrastructure/
│   ├── http-purchase-order.repository.ts   ← concrete Repository (Http*)
│   ├── http-exchange-rate.service.ts       ← concrete Service (Http*)
│   ├── purchase-order.mapper.ts            ← DTO ↔ domain translation
│   └── purchase-order-response.ts          ← API DTO (never in domain/)
└── purchasing.providers.ts                 ← context-owned DI bindings
```

---

## 2. Value Object — single primitive

**Por qué:** identity **is** the value; `readonly value`, `equals()` by value, `toString()`. A strong type over a `string` so a `PurchaseOrderId` can never be confused with any other id.

```typescript
// domain/value-objects/purchase-order-id.ts
export class PurchaseOrderId {
    constructor(readonly value: string) {}

    equals(other: PurchaseOrderId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
```

---

## 3. Value Object — conceptual whole (multi-attribute + behavior)

**Por qué:** a VO is **not** limited to one primitive. `Quantity` groups `amount` + `unit` as a unit that only makes sense together, and exposes **side-effect-free** behavior that **returns a new instance** (`add`). This is value semantics, not application logic — so it belongs on the VO.

```typescript
// domain/value-objects/quantity.ts
export type MeasureUnit = 'kg' | 'l' | 'unit';

export class Quantity {
    constructor(
        readonly amount: number,
        readonly unit: MeasureUnit,
    ) {
        if (amount < 0) {
            throw new Error('Quantity cannot be negative');
        }
    }

    add(other: Quantity): Quantity {
        if (other.unit !== this.unit) {
            throw new Error('Unit mismatch');
        }
        return new Quantity(this.amount + other.amount, this.unit);
    }

    equals(other: Quantity): boolean {
        return this.amount === other.amount && this.unit === other.unit;
    }

    toString(): string {
        return `${this.amount} ${this.unit}`;
    }
}
```

---

## 4. Entity (child) — `PurchaseOrderLine`

**Por qué:** an entity has **identity by id** and is built from a private `*Data` interface that normalizes input. All fields are `readonly`, `equals()` compares by `id`, and value-object fields are typed as the VO class (`Quantity`), not as primitives.

```typescript
// domain/entities/purchase-order-line.ts
import { Quantity } from '../value-objects/quantity';

// Not exported — normalizes the input shape for the constructor.
interface PurchaseOrderLineData {
    id: string;
    supplyId: string; // reference to the catalog context, by id (see §5 of core-conventions)
    quantity: Quantity;
    unitPriceSoles: number;
}

export class PurchaseOrderLine {
    readonly id: string;
    readonly supplyId: string;
    readonly quantity: Quantity;
    readonly unitPriceSoles: number;

    constructor(data: PurchaseOrderLineData) {
        this.id = data.id;
        this.supplyId = data.supplyId;
        this.quantity = data.quantity;
        this.unitPriceSoles = data.unitPriceSoles;
    }

    get subtotalSoles(): number {
        return this.quantity.amount * this.unitPriceSoles;
    }

    equals(other: PurchaseOrderLine): boolean {
        return this.id === other.id;
    }
}
```

---

## 5. Aggregate Root — `PurchaseOrder`

**Por qué:** the aggregate is the **consistency boundary**. Child lines are created and modified **only through the root** (`addLine`), never by `new PurchaseOrderLine()` from outside. Business rules and invariants live **on the entity** (`addLine` validates, `place` enforces "an order needs at least one line"); the use case only orchestrates. Fields stay `readonly`, so state-changing methods **return a new instance**. Other aggregates/contexts are referenced **by `string` id** (`supplierId`), never by object reference.

Every constructor property carries an inline `// Nivel N:` comment describing what it is and its role:
- **Nivel 1** — core identity and intrinsic data of the aggregate.
- **Nivel 2** — associations to other aggregates/contexts (held by id).
- **Nivel 3** — collections and metadata.

```typescript
// domain/entities/purchase-order.ts
import { PurchaseOrderId } from '../value-objects/purchase-order-id';
import { Quantity } from '../value-objects/quantity';
import { PurchaseOrderLine } from './purchase-order-line';

export type PurchaseOrderStatus = 'draft' | 'placed' | 'received';

// Not exported — normalizes constructor input.
interface PurchaseOrderData {
    id: PurchaseOrderId;
    supplierId: string;
    status: PurchaseOrderStatus;
    lines: PurchaseOrderLine[];
    createdAt: string;
}

export class PurchaseOrder {
    readonly id: PurchaseOrderId;                  // Nivel 1: identidad única de la orden de compra
    readonly supplierId: string;                   // Nivel 2: proveedor al que se compra (id de otro contexto, no su VO)
    readonly status: PurchaseOrderStatus;          // Nivel 1: estado del ciclo de vida (draft → placed → received)
    readonly lines: readonly PurchaseOrderLine[];  // Nivel 3: líneas de la orden; solo se modifican a través de la raíz
    readonly createdAt: string;                    // Nivel 3: metadato de auditoría (ISO date) fijado al crear

    private constructor(data: PurchaseOrderData) {
        this.id = data.id;
        this.supplierId = data.supplierId;
        this.status = data.status;
        this.lines = data.lines;
        this.createdAt = data.createdAt;
    }

    // Factory: an order always starts empty and in draft. Lines are added via addLine().
    static open(id: PurchaseOrderId, supplierId: string, createdAt: string): PurchaseOrder {
        return new PurchaseOrder({ id, supplierId, status: 'draft', lines: [], createdAt });
    }

    // Business verb: add a line through the root. Validates its invariant and returns a NEW instance.
    addLine(line: { id: string; supplyId: string; quantity: Quantity; unitPriceSoles: number }): PurchaseOrder {
        if (this.status !== 'draft') {
            throw new Error('Cannot add lines to an order that is not a draft');
        }
        const newLine = new PurchaseOrderLine(line); // child created ONLY here, inside the root
        return this.with({ lines: [...this.lines, newLine] });
    }

    // Business verb: place the order. Enforces the invariant "an order needs at least one line".
    place(): PurchaseOrder {
        if (this.lines.length === 0) {
            throw new Error('Cannot place an empty purchase order');
        }
        return this.with({ status: 'placed' });
    }

    get totalSoles(): number {
        return this.lines.reduce((sum, line) => sum + line.subtotalSoles, 0);
    }

    equals(other: PurchaseOrder): boolean {
        return this.id.equals(other.id);
    }

    // Internal helper to rebuild an immutable instance with some fields changed.
    private with(changes: Partial<PurchaseOrderData>): PurchaseOrder {
        return new PurchaseOrder({
            id: this.id,
            supplierId: this.supplierId,
            status: this.status,
            lines: this.lines,
            createdAt: this.createdAt,
            ...changes,
        });
    }
}
```

> El constructor recibe el `*Data` interface y asigna campo a campo (igual que `PurchaseOrderLine` en §4 y `AuthUser` en `core-conventions.md`). Los comentarios `// Nivel N:` van sobre las declaraciones de campos, que es donde viven las propiedades del aggregate.

---

## 6. Repository — abstract contract + concrete implementation

**Por qué:** a Repository is **pure data access**: it behaves like an in-memory collection of aggregates and generates new identities (`nextIdentity`). The **abstract class** lives in `domain/repositories/`; the implementation lives in `infrastructure/` with a transport prefix (`Http*`) and uses the mapper to translate. The interface is in the domain, the implementation is hidden — Dependency Inversion / Ports & Adapters.

```typescript
// domain/repositories/purchase-order.repository.ts
import { PurchaseOrder } from '../entities/purchase-order';
import { PurchaseOrderId } from '../value-objects/purchase-order-id';

export abstract class PurchaseOrderRepository {
    abstract nextIdentity(): PurchaseOrderId;
    abstract byId(id: PurchaseOrderId): Promise<PurchaseOrder | null>;
    abstract save(order: PurchaseOrder): Promise<void>;
}
```

```typescript
// infrastructure/http-purchase-order.repository.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PurchaseOrderRepository } from '../domain/repositories/purchase-order.repository';
import { PurchaseOrder } from '../domain/entities/purchase-order';
import { PurchaseOrderId } from '../domain/value-objects/purchase-order-id';
import { PurchaseOrderMapper } from './purchase-order.mapper';
import { PurchaseOrderResponse } from './purchase-order-response';

@Injectable()
export class HttpPurchaseOrderRepository extends PurchaseOrderRepository {
    private readonly http = inject(HttpClient);

    nextIdentity(): PurchaseOrderId {
        return new PurchaseOrderId(crypto.randomUUID());
    }

    async byId(id: PurchaseOrderId): Promise<PurchaseOrder | null> {
        const dto = await firstValueFrom(
            this.http.get<PurchaseOrderResponse | null>(`/api/purchase-orders/${id.value}`),
        );
        return dto ? PurchaseOrderMapper.toDomain(dto) : null;
    }

    async save(order: PurchaseOrder): Promise<void> {
        await firstValueFrom(
            this.http.put(`/api/purchase-orders/${order.id.value}`, PurchaseOrderMapper.toDto(order)),
        );
    }
}
```

---

## 7. Domain Service — abstract contract + types + implementation

**Por qué:** a Service is **behavior/coordination**, not data access. `ExchangeRateService` fetches a rate and applies a conversion — logic, so it is a Service, not a Repository. The contract lives in `domain/services/`, its input/output types live beside it in `*.service.types.ts`, and the implementation is named `<Transport><DomainServiceName>` = `HttpExchangeRateService`.

```typescript
// domain/services/exchange-rate.service.types.ts
export interface CurrencyConversion {
    amountSoles: number;
    toCurrency: string; // ISO currency, e.g. 'USD'
}
```

```typescript
// domain/services/exchange-rate.service.ts
import { CurrencyConversion } from './exchange-rate.service.types';

export abstract class ExchangeRateService {
    // Fetches the current rate for the target currency and returns the converted amount.
    abstract convert(conversion: CurrencyConversion): Promise<number>;
}
```

```typescript
// infrastructure/http-exchange-rate.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ExchangeRateService } from '../domain/services/exchange-rate.service';
import { CurrencyConversion } from '../domain/services/exchange-rate.service.types';

@Injectable()
export class HttpExchangeRateService extends ExchangeRateService {
    private readonly http = inject(HttpClient);

    async convert({ amountSoles, toCurrency }: CurrencyConversion): Promise<number> {
        const res = await firstValueFrom(
            this.http.get<{ rate: number }>(`/api/fx?from=PEN&to=${toCurrency}`),
        );
        return amountSoles * res.rate; // fetch + compute = coordination, hence a Service
    }
}
```

---

## 8. Use Case — `PlacePurchaseOrder`

**Por qué:** one class per user intention, named after the intention. It `extends UseCase<I, O>` (the base class), uses `inject()`, and **orchestrates**: load the aggregate from the repository, call the domain method, persist. It contains **no business rules** — the "needs at least one line" invariant lives in `PurchaseOrder.place()`, not here. The request is a small interface declared in the use-case file; no separate `*.dto.ts` is created because the input is not transformed before reaching the domain. (If a matching service-contract type already existed in `domain/services/*.service.types.ts`, the use case would reuse it instead of redeclaring it.)

```typescript
// application/use-cases/place-purchase-order.use-case.ts
import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { PurchaseOrderId } from '../../domain/value-objects/purchase-order-id';

export interface PlacePurchaseOrderRequest {
    orderId: string;
}

@Injectable({ providedIn: 'root' })
export class PlacePurchaseOrder extends UseCase<PlacePurchaseOrderRequest, { id: string }> {
    private readonly orders = inject(PurchaseOrderRepository);

    async execute({ orderId }: PlacePurchaseOrderRequest): Promise<{ id: string }> {
        const order = await this.orders.byId(new PurchaseOrderId(orderId));
        if (!order) {
            throw new Error('Purchase order not found');
        }
        const placed = order.place(); // ← the rule lives in the domain, not here
        await this.orders.save(placed);
        return { id: placed.id.value };
    }
}
```

> A command DTO in `application/use-cases/*.dto.ts` would only be justified if `execute` had to transform/aggregate the input before calling the domain. Here the input is 1:1, so no DTO is created (see `core-conventions.md` §Service Contract Types).

### A use case that orchestrates a domain service

**Por qué:** a use case may orchestrate **more than one** collaborator. `GetPurchaseOrderTotalInCurrency` injects both the repository (to load the aggregate) and the `ExchangeRateService` (the domain behavior that fetches the rate and converts). Note the split of responsibilities: the **aggregate** computes its own total (`order.totalSoles` — domain decides), the **service** performs the conversion (behavior + coordination), and the **use case** only wires them together. The use case declares its own input (`OrderTotalQuery`) because it **aggregates** two pieces — the order's total and a target currency — into the service's `CurrencyConversion` contract; the shapes differ, so reuse would be wrong here.

```typescript
// application/use-cases/get-purchase-order-total-in-currency.use-case.ts
import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { ExchangeRateService } from '../../domain/services/exchange-rate.service';
import { PurchaseOrderId } from '../../domain/value-objects/purchase-order-id';

export interface OrderTotalQuery {
    orderId: string;
    currency: string; // ISO currency to convert the total into, e.g. 'USD'
}

@Injectable({ providedIn: 'root' })
export class GetPurchaseOrderTotalInCurrency extends UseCase<OrderTotalQuery, { amount: number; currency: string }> {
    private readonly orders = inject(PurchaseOrderRepository);
    private readonly exchangeRate = inject(ExchangeRateService);

    async execute({ orderId, currency }: OrderTotalQuery): Promise<{ amount: number; currency: string }> {
        const order = await this.orders.byId(new PurchaseOrderId(orderId));
        if (!order) {
            throw new Error('Purchase order not found');
        }
        const amount = await this.exchangeRate.convert({
            amountSoles: order.totalSoles, // ← the aggregate computed its own total
            toCurrency: currency,
        });
        return { amount, currency };
    }
}
```

---

## 9. Mapper + API DTO

**Por qué:** API response shapes are **infrastructure contracts**, never domain models — they live in `infrastructure/` as `*-response.ts`. The mapper is the **Anticorruption Layer**: it translates the upstream DTO into clean domain entities and back, so the upstream shape never leaks into the domain or features (`main-process-conventions.md` §ACL).

```typescript
// infrastructure/purchase-order-response.ts
export interface PurchaseOrderLineResponse {
    id: string;
    supply_id: string;       // upstream uses snake_case — its own language
    qty: number;
    qty_unit: string;
    unit_price_soles: number;
}

export interface PurchaseOrderResponse {
    id: string;
    supplier_id: string;
    status: string;
    lines: PurchaseOrderLineResponse[];
    created_at: string;
}
```

```typescript
// infrastructure/purchase-order.mapper.ts
import { PurchaseOrder, PurchaseOrderStatus } from '../domain/entities/purchase-order';
import { PurchaseOrderId } from '../domain/value-objects/purchase-order-id';
import { MeasureUnit, Quantity } from '../domain/value-objects/quantity';
import { PurchaseOrderResponse } from './purchase-order-response';

export const PurchaseOrderMapper = {
    toDomain(dto: PurchaseOrderResponse): PurchaseOrder {
        // Rebuild the aggregate from primitives. Each line goes through the root via addLine().
        let order = PurchaseOrder.open(
            new PurchaseOrderId(dto.id),
            dto.supplier_id,
            dto.created_at,
        );
        for (const line of dto.lines) {
            order = order.addLine({
                id: line.id,
                supplyId: line.supply_id,
                quantity: new Quantity(line.qty, line.qty_unit as MeasureUnit),
                unitPriceSoles: line.unit_price_soles,
            });
        }
        return dto.status === 'placed' ? order.place() : order;
    },

    toDto(order: PurchaseOrder): PurchaseOrderResponse {
        return {
            id: order.id.value,
            supplier_id: order.supplierId,
            status: order.status,
            created_at: order.createdAt,
            lines: order.lines.map(line => ({
                id: line.id,
                supply_id: line.supplyId,
                qty: line.quantity.amount,
                qty_unit: line.quantity.unit,
                unit_price_soles: line.unitPriceSoles,
            })),
        };
    },
};
```

---

## 10. Providers — context-owned DI bindings

**Por qué:** each bounded context owns its DI. `providePurchasing()` returns `EnvironmentProviders` via `makeEnvironmentProviders` and binds each **abstract** domain contract to its **concrete** infrastructure implementation with `useClass`. `app.config.ts` only aggregates `providePurchasing()` — it never decides implementations.

```typescript
// purchasing.providers.ts
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { PurchaseOrderRepository } from './domain/repositories/purchase-order.repository';
import { ExchangeRateService } from './domain/services/exchange-rate.service';
import { HttpPurchaseOrderRepository } from './infrastructure/http-purchase-order.repository';
import { HttpExchangeRateService } from './infrastructure/http-exchange-rate.service';

export function providePurchasing(): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: PurchaseOrderRepository, useClass: HttpPurchaseOrderRepository },
        { provide: ExchangeRateService, useClass: HttpExchangeRateService },
    ]);
}
```

```typescript
// app.config.ts (aggregation only)
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(),
        providePurchasing(), // ← the context decides its own bindings
    ],
};
```

---

## 11. Feature — consuming the use case

**Por qué:** a feature is a route-level page. It injects **use cases only** (never domain services nor infrastructure), passes a **plain object literal** to `execute`, and imports the entity merely as a type. It knows nothing about repositories, mappers, or HTTP.

```typescript
// features/purchase-orders/place-order.ts
import { Component, inject, signal } from '@angular/core';
import { PlacePurchaseOrder } from '../../core/purchasing/application/use-cases/place-purchase-order.use-case';

@Component({
    selector: 'app-place-order',
    template: `
        <button type="button" [disabled]="placing()" (click)="place()">Place order</button>
        @if (placedId(); as id) {
            <p>Order {{ id }} placed.</p>
        }
    `,
})
export class PlaceOrder {
    private readonly placeOrder = inject(PlacePurchaseOrder); // ← a use case, never a domain service

    protected readonly placing = signal(false);
    protected readonly placedId = signal<string | null>(null);

    protected async place(): Promise<void> {
        this.placing.set(true);
        try {
            const result = await this.placeOrder.execute({ orderId: 'po-123' }); // ← object literal
            this.placedId.set(result.id);
        } finally {
            this.placing.set(false);
        }
    }
}
```

---

## 12. Rule coverage checklist

Every DDD rule and where this example demonstrates it:

| Rule | Source | Demonstrated in |
|---|---|---|
| Ubiquitous Language (business names, no jargon) | core §Ubiquitous Language | §1, verbs `place`/`open`/`receive`, `PlacePurchaseOrder` |
| Folder layout by pattern (deliberate) | core §Folder structure | §1 tree |
| VO — single primitive, `equals`/`toString` | core §Value Object | §2 `PurchaseOrderId` |
| VO — conceptual whole + side-effect-free behavior | core §Value Object | §3 `Quantity` |
| Entity — `*Data` interface, `readonly`, `equals` by id, VO-typed fields | core §Entity | §4 `PurchaseOrderLine` |
| Domain decides, use case orchestrates (anti-anemic) | core §"The domain decides…" | §5 `place()`/`addLine()` vs §8 |
| Aggregate Root — child only via root, by-id refs, small, returns new instance | core §Aggregates | §5 `PurchaseOrder` |
| Inline `// Nivel N:` property docs | (this request) | §5 constructor |
| Cross-context reference by `string` id | core §Cross-context type consistency | §4/§5 `supplyId`, `supplierId` |
| Repository — abstract in `domain/repositories/`, `Http*` impl, `nextIdentity` | core §Repository vs Service | §6 |
| Service — behavior, abstract contract + `*.service.types.ts` + `<Transport>` impl | core §Repository vs Service / §Infrastructure services | §7 `ExchangeRateService` (consumed in §8) |
| Use case — `extends UseCase`, `inject()`, thin orchestration, no `*.dto.ts` when input is 1:1 | core §DI / features §Use case injection | §8 `PlacePurchaseOrder` |
| Use case orchestrating multiple collaborators (repo + domain service) | core §"The domain decides…" | §8 `GetPurchaseOrderTotalInCurrency` |
| API DTO in infra (`*-response.ts`), mapper translation / ACL | core §API DTOs / main-process §ACL | §9 |
| Providers — context-owned, abstract→concrete `useClass`, app.config aggregates | providers-conventions | §10 |
| Feature — injects use cases only, object-literal input, no infra import | features-conventions | §11 |
