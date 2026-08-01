import { inject, Injectable } from '@angular/core';
import { UseCase } from '../../../_common/use-case';
import { EntityId } from '../../../_common/entity-id';
import { EventBus } from '../../../_common/eventbus/event-bus';
import { RecipeFlavor } from '../../domain/entities/recipe-flavor';
import { CapacityGroup, RecipeCapacity } from '../../domain/entities/recipe-capacity';
import { RecipeFlavorRepository } from '../../domain/repositories/recipe-flavor.repository';
import { RecipeCapacityRepository } from '../../domain/repositories/recipe-capacity.repository';

/**
 * Las características que puede llevar una receta: su sabor y sus dos dimensiones de tamaño
 * (porciones y molde, que coexisten). Se deriva de `CapacityGroup` para no desincronizarse.
 */
export type RecipePropertyKind = 'flavor' | CapacityGroup;

/** Entrada de {@link SaveRecipeProperty}: sobre qué identidad persistir (o el label) y los datos. */
export interface SaveRecipePropertyRequest {
  kind: RecipePropertyKind;
  /** Identidad sobre la que persistir; ausente, se resuelve por label. */
  id?: string;
  label: string;
  /** Factor de escalado; solo para `portions`/`mold`. Omitido, se conserva el que ya tenía. */
  factor?: number;
}

/**
 * **Persiste** una CARACTERÍSTICA de receta del catálogo: el sabor o una de las dos capacidades
 * (porciones/molde). Punto de entrada único del campo «Características» del formulario de receta.
 * Despacha por `kind` al catálogo que corresponde y en ambos casos hace lo mismo: resolver la
 * identidad, armar el agregado y persistirlo — no hay crear ni editar.
 *
 * La identidad sale del `id` recibido; si no llega, de la característica que ya tiene ese label (por
 * `(grupo, label)` en las capacidades), y si tampoco, de una nueva. Esa resolución por label es lo
 * que evita duplicar «Chocolate» cada vez que se escribe.
 *
 * El `factor` omitido **conserva el de la capacidad resuelta** (y solo es 1 en una nueva): el
 * formulario no siempre lo manda, y persistir 1 a ciegas borraría el factor real del catálogo.
 *
 * Las invariantes viven en `RecipeFlavor`/`RecipeCapacity`, que también **graban su propio evento**
 * (`FlavorSaved` / `RecipeCapacitySaved`); aquí solo se saca la cola con `pullEvents()` tras
 * persistir y se publica por el `EventBus`.
 */
@Injectable({ providedIn: 'root' })
export class SaveRecipeProperty extends UseCase<SaveRecipePropertyRequest, { id: string }> {
  private readonly flavors = inject(RecipeFlavorRepository);
  private readonly capacities = inject(RecipeCapacityRepository);
  private readonly bus = inject(EventBus);

  async execute({ kind, id, label, factor }: SaveRecipePropertyRequest): Promise<{ id: string }> {
    return kind === 'flavor'
      ? this.saveFlavor(id, label)
      : this.saveCapacity(kind, id, label, factor);
  }

  private async saveFlavor(id: string | undefined, label: string): Promise<{ id: string }> {
    const existing = id
      ? await this.flavors.byId(new EntityId(id))
      : this.byLabel(await this.flavors.all(), label);
    const flavor = RecipeFlavor.create(
      existing?.id ?? (id ? new EntityId(id) : this.flavors.nextIdentity()),
      label,
    );
    await this.flavors.save(flavor);
    await this.bus.publish(flavor.pullEvents());
    return { id: flavor.id.value };
  }

  private async saveCapacity(
    group: CapacityGroup,
    id: string | undefined,
    label: string,
    factor: number | undefined,
  ): Promise<{ id: string }> {
    const existing = id
      ? await this.capacities.byId(new EntityId(id))
      : this.byLabel(await this.capacities.byGroup(group), label);
    const capacity = RecipeCapacity.create(
      existing?.id ?? (id ? new EntityId(id) : this.capacities.nextIdentity()),
      group,
      label,
      factor ?? existing?.factor ?? 1,
    );
    await this.capacities.save(capacity);
    await this.bus.publish(capacity.pullEvents());
    return { id: capacity.id.value };
  }

  /** Busca por label (case-insensitive) dentro de un catálogo ya cargado. */
  private byLabel<T extends { label: string }>(catalog: readonly T[], label: string): T | null {
    const target = label.trim().toLowerCase();
    return catalog.find((item) => item.label.toLowerCase() === target) ?? null;
  }
}
