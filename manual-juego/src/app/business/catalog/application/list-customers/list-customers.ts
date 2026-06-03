import { UseCase } from '../../../shared/application/use-case';
import { CustomerPrimitives } from '../../domain/customer/customer';
import { CustomerRepository } from '../../domain/customer/customer-repository';

/** Customer list for the UI (flat DTOs, alphabetical order). */
export class ListCustomers implements UseCase<void, CustomerPrimitives[]> {
  constructor(private readonly customers: CustomerRepository) {}

  async execute(): Promise<CustomerPrimitives[]> {
    const all = await this.customers.all();
    return all
      .map(c => c.toPrimitives())
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
