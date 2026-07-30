import { Injectable } from '@angular/core';
import { EntityId } from '../../../_common/entity-id';
import { IndexedDbStore } from '../../../_common/infrastructure/indexeddb/store';
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
  }

  async all(): Promise<Supply[]> {
    return (await this.store.all()).filter(isPriced).map(SupplyMapper.toDomain);
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
