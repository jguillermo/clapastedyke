import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { IdGeneratorToken } from '../_common/core.tokens';
import { PURCHASE_REPOSITORY } from './domain/purchase/purchase-repository';
import { STOCK_MOVEMENT_REPOSITORY } from './domain/stock-movement/stock-movement-repository';
import { IndexedDbPurchaseRepository, IndexedDbStockMovementRepository } from './infrastructure/indexeddb-repositories';

export function provideInventory(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PURCHASE_REPOSITORY, useFactory: () => new IndexedDbPurchaseRepository(inject(IdGeneratorToken)) },
    { provide: STOCK_MOVEMENT_REPOSITORY, useFactory: () => new IndexedDbStockMovementRepository(inject(IdGeneratorToken)) },
  ]);
}
