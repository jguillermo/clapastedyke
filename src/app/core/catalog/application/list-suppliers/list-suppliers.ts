import { Injectable, inject } from '@angular/core';
import { UseCase } from '../../../_common/application/use-case';
import { SupplierPrimitives } from '../../domain/supplier/supplier';
import { SUPPLIER_REPOSITORY } from '../../domain/supplier/supplier-repository';

@Injectable({ providedIn: 'root' })
export class ListSuppliers implements UseCase<void, SupplierPrimitives[]> {
  private readonly suppliers = inject(SUPPLIER_REPOSITORY);

  async execute(): Promise<SupplierPrimitives[]> {
    const all = await this.suppliers.all();
    return all
      .map(p => p.toPrimitives())
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
