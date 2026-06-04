import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { CustomerPrimitives } from '../../domain/customer/customer';
import { CUSTOMER_REPOSITORY } from '../../domain/customer/customer-repository';

/** Customer list for the UI (flat DTOs, alphabetical order). */
@Injectable({ providedIn: 'root' })
export class ListCustomers implements UseCase<void, CustomerPrimitives[]> {
  private readonly customers = inject(CUSTOMER_REPOSITORY);

  async execute(): Promise<CustomerPrimitives[]> {
    const all = await this.customers.all();
    return all
      .map(c => c.toPrimitives())
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
