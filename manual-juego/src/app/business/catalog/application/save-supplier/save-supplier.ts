import { EventBus } from '../../../shared/application/event-bus';
import { UseCase } from '../../../shared/application/use-case';
import { DuplicateError, NotFoundError } from '../../../shared/domain/errors';
import { EntityId } from '../../../shared/domain/entity-id';
import { Supplier } from '../../domain/supplier/supplier';
import { SupplierRepository } from '../../domain/supplier/supplier-repository';

export interface SaveSupplierRequest {
  id?: string;
  name: string;
  whatsapp: string;
  notes?: string;
}

export class SaveSupplier implements UseCase<SaveSupplierRequest, { id: string }> {
  constructor(
    private readonly suppliers: SupplierRepository,
    private readonly bus: EventBus,
  ) {}

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
