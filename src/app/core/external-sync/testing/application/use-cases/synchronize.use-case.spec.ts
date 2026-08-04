import { TestBed } from '@angular/core/testing';
import {
  FakeCredentialsProvider,
  FakeExportableData,
  FakeSyncGateway,
  FakeSyncTargetRepository,
  FakeSyncOutbox,
  makeExternalSyncFakes,
} from '../../external-sync-test-doubles';
import { Synchronize } from '../../../application/use-cases/synchronize.use-case';
import { SyncError } from '../../../domain/services/sync.gateway.types';
import { SyncItem } from '../../../domain/value-objects/sync-item';
import { SyncTarget } from '../../../domain/value-objects/sync-target';
import { SyncStatus } from '../../../domain/services/sync-status';

describe('Synchronize', () => {
  let sync: Synchronize;
  let outbox: FakeSyncOutbox;
  let gateway: FakeSyncGateway;
  let credentials: FakeCredentialsProvider;
  let source: FakeExportableData;
  let targets: FakeSyncTargetRepository;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    sync = TestBed.inject(Synchronize);
    outbox = TestBed.inject(FakeSyncOutbox);
    gateway = TestBed.inject(FakeSyncGateway);
    credentials = TestBed.inject(FakeCredentialsProvider);
    source = TestBed.inject(FakeExportableData);
    targets = TestBed.inject(FakeSyncTargetRepository);

    // Sincronizar presupone una cuenta con su hoja ya preparada: el caso contrario tiene su propio
    // test, y sin esto todos los demás saldrían por la rama `no-target`.
    await targets.save('cuenta-1', SyncTarget.of('target-1', 'https://example.test/hoja'));
  });

  it('sin hoja preparada no se toca la cola: lo pendiente sigue esperando', async () => {
    await targets.remove('cuenta-1');
    await outbox.enqueue(SyncItem.of('recipe', 'R-1'));

    const result = await sync.execute({ scope: 'pending' });

    expect(result).toEqual({ synced: false, rows: 0, reason: 'no-target' });
    expect(outbox.stored()).toEqual(['recipe:R-1']);
    expect(outbox.pending()).toBe(1);
  });

  it('envía los cambios en orden de llegada y los retira de la cola', async () => {
    await outbox.enqueue(SyncItem.of('supply', 'S-1'));
    await outbox.enqueue(SyncItem.of('recipe', 'R-1'));

    const result = await sync.execute({ scope: 'pending' });

    expect(result).toEqual({ synced: true, rows: 2 });
    expect(source.queries[0].refs.map((ref) => ref.id)).toEqual(['S-1', 'R-1']);
    expect(outbox.stored()).toEqual([]);
    expect(outbox.pending()).toBe(0);
  });

  it('reeditar algo encolado no le hace perder su turno', async () => {
    await outbox.enqueue(SyncItem.of('supply', 'S-1'));
    await outbox.enqueue(SyncItem.of('recipe', 'R-1'));
    await outbox.enqueue(SyncItem.of('supply', 'S-1'));

    await sync.execute({ scope: 'pending' });

    expect(source.queries[0].refs.map((ref) => ref.id)).toEqual(['S-1', 'R-1']);
  });

  it('un fallo de red devuelve los cambios a la cola para el siguiente intento', async () => {
    await outbox.enqueue(SyncItem.of('recipe', 'R-1'));
    gateway.failWith = new SyncError('NETWORK', 'No hay conexión.');

    const result = await sync.execute({ scope: 'pending' });

    expect(result.reason).toBe('failed');
    expect(outbox.stored()).toEqual(['recipe:R-1']);
    expect(outbox.pending()).toBe(1);
    expect(TestBed.inject(SyncStatus).snapshot().phase).toBe('error');
  });

  it('un corte a mitad del envío no pierde el cambio: al arrancar vuelve a la cola', async () => {
    await outbox.enqueue(SyncItem.of('recipe', 'R-1'));
    // El envío se queda colgado: los cambios están tomados (en vuelo) y nadie los confirma.
    gateway.failWith = null;
    await outbox.take();
    expect(outbox.pending()).toBe(0);

    // Recarga de la página.
    outbox.restart();

    expect(outbox.pending()).toBe(1);
    const result = await sync.execute({ scope: 'pending' });
    expect(result).toEqual({ synced: true, rows: 1 });
    expect(outbox.stored()).toEqual([]);
  });

  it('sincronizar un agregado concreto deja los demás esperando su turno', async () => {
    await outbox.enqueue(SyncItem.of('supply', 'S-1'));
    await outbox.enqueue(SyncItem.of('recipe', 'R-1'));

    const result = await sync.execute({ scope: 'pending', aggregate: 'recipe' });

    expect(result).toEqual({ synced: true, rows: 1 });
    expect(outbox.stored()).toEqual(['supply:S-1']);
    expect(outbox.pending()).toBe(1);
  });

  it('sin cambios pendientes no sale ningún envío', async () => {
    const result = await sync.execute({ scope: 'pending' });

    expect(result).toEqual({ synced: false, rows: 0, reason: 'nothing-pending' });
    expect(gateway.sent).toHaveLength(0);
  });

  it('sin sesión no se sincroniza y el estado queda desconectado', async () => {
    credentials.credentials = null;

    const result = await sync.execute({ scope: 'all' });

    expect(result).toEqual({ synced: false, rows: 0, reason: 'disconnected' });
    expect(TestBed.inject(SyncStatus).snapshot().phase).toBe('disconnected');
  });

  it('si la sesión cambia durante el envío, el resultado se descarta y los cambios vuelven', async () => {
    await outbox.enqueue(SyncItem.of('recipe', 'R-1'));
    gateway.send = async (request) => {
      // Otra cuenta entra mientras la petición está en vuelo.
      credentials.credentials = {
        token: 't-2',
        epoch: 2,
        accountId: 'cuenta-2',
        accountEmail: 'otra@example.test',
      };
      gateway.sent.push(request);
      return { target: SyncTarget.of('target-1', ''), applied: {} };
    };

    const result = await sync.execute({ scope: 'pending' });

    expect(result.reason).toBe('stale-session');
    expect(outbox.stored()).toEqual(['recipe:R-1']);
  });

  it('un `all` no toca la cola: relee el origen completo', async () => {
    await outbox.enqueue(SyncItem.of('recipe', 'R-1'));

    const result = await sync.execute({ scope: 'all' });

    expect(result.synced).toBe(true);
    expect(source.queries[0].all).toBe(true);
    expect(outbox.stored()).toEqual(['recipe:R-1']);
  });

  it('si el origen no proyecta filas, los cambios quedan resueltos igualmente', async () => {
    await outbox.enqueue(SyncItem.of('recipe', 'R-1'));
    source.rows = {};

    const result = await sync.execute({ scope: 'pending' });

    expect(result).toEqual({ synced: true, rows: 0 });
    expect(outbox.stored()).toEqual([]);
  });
});
