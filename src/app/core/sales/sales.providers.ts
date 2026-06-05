import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { IdGeneratorToken } from '../_common/core.tokens';
import { QUOTE_REPOSITORY } from './domain/quote/quote-repository';
import { ORDER_REPOSITORY } from './domain/order/order-repository';
import { SALE_REPOSITORY } from './domain/sale/sale-repository';
import { BASIC_ORDER_REPOSITORY } from './domain/basic-order/basic-order-repository';
import {
  IndexedDbOrderRepository,
  IndexedDbQuoteRepository,
  IndexedDbSaleRepository,
} from './infrastructure/indexeddb-repositories';
import { IndexedDbBasicOrderRepository } from './infrastructure/indexeddb-basic-order-repository';

export function provideSales(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: QUOTE_REPOSITORY, useFactory: () => new IndexedDbQuoteRepository(inject(IdGeneratorToken)) },
    { provide: ORDER_REPOSITORY, useFactory: () => new IndexedDbOrderRepository(inject(IdGeneratorToken)) },
    { provide: SALE_REPOSITORY, useFactory: () => new IndexedDbSaleRepository(inject(IdGeneratorToken)) },
    { provide: BASIC_ORDER_REPOSITORY, useFactory: () => new IndexedDbBasicOrderRepository(inject(IdGeneratorToken)) },
  ]);
}
