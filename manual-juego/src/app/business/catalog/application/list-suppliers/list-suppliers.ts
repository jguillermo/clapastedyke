import { UseCase } from '../../../shared/application/use-case';
import { SupplierPrimitives } from '../../domain/supplier/supplier';
import { SupplierRepository } from '../../domain/supplier/supplier-repository';

export class ListSuppliers implements UseCase<void, SupplierPrimitives[]> {
  constructor(private readonly suppliers: SupplierRepository) {}

  async execute(): Promise<SupplierPrimitives[]> {
    const all = await this.suppliers.all();
    return all
      .map(p => p.toPrimitives())
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
