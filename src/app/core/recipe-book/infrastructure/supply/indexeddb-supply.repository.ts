import { inject, Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { IndexedDbStore } from '../../../_common/infrastructure/indexeddb/store';
import { Logger } from '../../../_common/logger/logger';
import { Supply } from '../../domain/entities/supply';
import { SupplyRepository } from '../../domain/repositories/supply.repository';
import { SupplyMapper } from './supply.mapper';
import { SupplyRecord } from '../records';

/**
 * Implementación IndexedDB de `SupplyRepository` sobre `IndexedDbStore` (store `ingredients`, nombre
 * físico legacy conservado por retrocompatibilidad); traduce con `SupplyMapper`. Se enlaza en
 * `recipe-book.providers.ts`. Omite (nunca mapea) los documentos legacy sin precio vía `isPriced`.
 */
@Injectable()
export class IndexedDbSupplyRepository extends SupplyRepository {
  private readonly store = new IndexedDbStore<SupplyRecord>('ingredients');
  private readonly log = inject(Logger).scoped('recipe-book/supply-repo');

  nextIdentity(): EntityId {
    return new EntityId(crypto.randomUUID());
  }

  async byId(id: EntityId): Promise<Supply | null> {
    const record = await this.store.get(id.value);
    return record && isPriced(record) ? SupplyMapper.toDomain(record) : null;
  }

  async byName(name: string): Promise<Supply | null> {
    const target = name.trim().toLowerCase();
    const record = (await this.store.all()).find(
      (r) => isPriced(r) && r.name.toLowerCase() === target,
    );
    return record ? SupplyMapper.toDomain(record) : null;
  }

  async save(supply: Supply): Promise<void> {
    await this.store.put(SupplyMapper.toRecord(supply));
    this.log.debug('insumo guardado', { id: supply.id.value });
  }

  async all(): Promise<Supply[]> {
    const records = await this.store.all();
    const priced = records.filter(isPriced);
    // Degradación silenciosa: hay insumos guardados que la app no puede mostrar. No rompe nada
    // —se recrean con precio al reutilizarlos— pero el usuario ve menos de lo que hay, así que
    // deja rastro.
    if (priced.length !== records.length) {
      this.log.warn('insumos legacy sin precio, se omiten del catálogo', undefined, {
        omitidos: records.length - priced.length,
        total: records.length,
      });
    }
    this.log.debug('insumos leídos', { count: priced.length });
    return priced.map(SupplyMapper.toDomain);
  }
}

/**
 * Omite los documentos de insumo legacy guardados antes de que existieran los precios (sin
 * `purchasePrice`). Se ignoran —nunca se mapean— para que la app no se rompa con datos obsoletos;
 * reutilizar un insumo así simplemente lo vuelve a crear con precio.
 */
function isPriced(record: SupplyRecord): boolean {
  return !!record.purchasePrice && typeof record.purchasePrice.amount === 'number';
}
