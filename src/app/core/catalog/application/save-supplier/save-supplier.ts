import { Injectable, inject } from '@angular/core';
import { EventBusToken } from '../../../_common/core.tokens';
import { UseCase } from '../../../_common/application/use-case';
import { DuplicateError, NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { Supplier } from '../../domain/supplier/supplier';
import { SUPPLIER_REPOSITORY } from '../../domain/supplier/supplier-repository';

export interface SaveSupplierRequest {
  id?: string;
  name: string;
  whatsapp: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class SaveSupplier implements UseCase<SaveSupplierRequest, { id: string }> {
  private readonly suppliers = inject(SUPPLIER_REPOSITORY);
  private readonly bus = inject(EventBusToken);

  async execute(request: SaveSupplierRequest): Promise<{ id: string }> {
    const existing = await this.suppliers.byName(request.name);

    if (request.id) {
      const id = EntityId.of(request.id);
      const supplier = await this.suppliers.byId(id);
      if (!supplier) throw new NotFoundError('Supplier', request.id);
      if (existing && !existing.id.equals(id)) {
        throw new DuplicateError('A supplier with that name already exists.');
      }
      supplier.edit(request);
      await this.suppliers.save(supplier);
      await this.bus.publish(supplier.pullEvents());
      return { id: supplier.id.value };
    }

    if (existing) throw new DuplicateError('A supplier with that name already exists.');
    const supplier = Supplier.create(await this.suppliers.nextId(), request);
    await this.suppliers.save(supplier);
    await this.bus.publish(supplier.pullEvents());
    return { id: supplier.id.value };
  }
}
