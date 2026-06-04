import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../../_common/application/event-bus';
import { EventBusToken } from '../../../_common/core.tokens';
import { DuplicateError } from '../../../_common/domain/errors';
import { DomainEvent } from '../../../_common/domain/domain-event';
import { CUSTOMER_REPOSITORY } from '../../domain/customer/customer-repository';
import { MemoryCustomerRepository } from '../../infrastructure/memory-repositories';
import { SaveCustomer } from './save-customer';

describe('SaveCustomer (use case)', () => {
  let customers: MemoryCustomerRepository;
  let bus: InMemoryEventBus;
  let useCase: SaveCustomer;
  let published: DomainEvent[];

  beforeEach(() => {
    customers = new MemoryCustomerRepository();
    bus = new InMemoryEventBus();
    published = [];
    bus.subscribe('CustomerCreated', e => void published.push(e));
    bus.subscribe('CustomerEdited', e => void published.push(e));

    TestBed.configureTestingModule({
      providers: [
        { provide: CUSTOMER_REPOSITORY, useValue: customers },
        { provide: EventBusToken, useValue: bus },
      ],
    });
    useCase = TestBed.inject(SaveCustomer);
  });

  it('create: generates CL-0001, persists and publishes CustomerCreated', async () => {
    const r = await useCase.execute({ name: 'Ana Torres', phone: '999000111' });
    expect(r.id).toBe('CL-0001');
    expect((await customers.all()).map(c => c.name)).toEqual(['Ana Torres']);
    expect(published.map(e => e.name)).toEqual(['CustomerCreated']);
  });

  it('rejects duplicate names (case-insensitive, the GAS rule)', async () => {
    await useCase.execute({ name: 'Ana Torres' });
    await expect(useCase.execute({ name: '  ana torres ' })).rejects.toThrow(DuplicateError);
  });

  it('edit: corrects data without duplicating and publishes CustomerEdited', async () => {
    const { id } = await useCase.execute({ name: 'Ana Torres' });
    await useCase.execute({ id, name: 'Ana Torres', phone: '999888777' });
    const saved = await customers.byName('Ana Torres');
    expect(saved?.phone).toBe('999888777');
    expect(published.map(e => e.name)).toEqual(['CustomerCreated', 'CustomerEdited']);
  });

  it('editing while keeping its own name is not a duplicate', async () => {
    const { id } = await useCase.execute({ name: 'Ana Torres' });
    await expect(useCase.execute({ id, name: 'Ana Torres' })).resolves.toEqual({ id });
  });
});
