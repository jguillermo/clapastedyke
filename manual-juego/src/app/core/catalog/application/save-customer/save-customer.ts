import { EventBus } from '../../../_common/application/event-bus';
import { UseCase } from '../../../_common/application/use-case';
import { DuplicateError, NotFoundError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { Customer } from '../../domain/customer/customer';
import { CustomerRepository } from '../../domain/customer/customer-repository';

export interface SaveCustomerRequest {
  /** Empty = create; with id = edit. */
  id?: string;
  name: string;
  phone?: string;
  notes?: string;
}

export interface SaveCustomerResponse {
  id: string;
}

/** Create or edit a customer with name uniqueness (src/Clientes.js). */
export class SaveCustomer implements UseCase<SaveCustomerRequest, SaveCustomerResponse> {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly bus: EventBus,
  ) {}

  async execute(request: SaveCustomerRequest): Promise<SaveCustomerResponse> {
    const existing = await this.customers.byName(request.name);

    if (request.id) {
      const id = EntityId.of(request.id);
      const customer = await this.customers.byId(id);
      if (!customer) throw new NotFoundError('Customer', request.id);
      if (existing && !existing.id.equals(id)) {
        throw new DuplicateError('A customer with that name already exists.');
      }
      customer.edit(request);
      await this.customers.save(customer);
      await this.bus.publish(customer.pullEvents());
      return { id: customer.id.value };
    }

    if (existing) throw new DuplicateError('A customer with that name already exists.');
    const customer = Customer.create(await this.customers.nextId(), request);
    await this.customers.save(customer);
    await this.bus.publish(customer.pullEvents());
    return { id: customer.id.value };
  }
}
