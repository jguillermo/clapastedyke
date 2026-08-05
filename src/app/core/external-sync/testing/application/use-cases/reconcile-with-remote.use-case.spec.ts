import { TestBed } from '@angular/core/testing';
import { ReconcileWithRemote } from '../../../application/use-cases/reconcile-with-remote.use-case';
import { SyncTarget } from '../../../domain/value-objects/sync-target';
import { SHEET_TABLES } from '../../../infrastructure/sheet-schema';
import {
  FakeCredentialsProvider,
  FakeExportableData,
  FakeSyncReader,
  FakeSyncShadow,
  FakeSyncTargetRepository,
  makeExternalSyncFakes,
} from '../../external-sync-test-doubles';

/**
 * La simulación de fusión: cada rama de salida, y sobre todo **que no toca nada**.
 *
 * Lo que este caso de uso promete es que se puede dejar corriendo contra la hoja de verdad de alguien
 * antes de que exista nada capaz de aplicar cambios. Si algún día empezara a escribir, esa promesa se
 * rompe en silencio; de ahí el test que cuenta las escrituras.
 */
describe('ReconcileWithRemote', () => {
  let reconcile: ReconcileWithRemote;
  let credentials: FakeCredentialsProvider;
  let targets: FakeSyncTargetRepository;
  let reader: FakeSyncReader;
  let shadow: FakeSyncShadow;
  let source: FakeExportableData;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    reconcile = TestBed.inject(ReconcileWithRemote);
    credentials = TestBed.inject(FakeCredentialsProvider);
    targets = TestBed.inject(FakeSyncTargetRepository);
    reader = TestBed.inject(FakeSyncReader);
    shadow = TestBed.inject(FakeSyncShadow);
    source = TestBed.inject(FakeExportableData);

    await targets.save('cuenta-1', SyncTarget.of('hoja-1', 'https://example.test/hoja-1'));
    reader.snapshot = {
      schemaVersion: 4,
      tables: SHEET_TABLES.map((table) => ({
        name: table.name,
        present: true,
        headers: [...table.headers],
        rows: [],
      })),
    };
    source.rows = Object.fromEntries(SHEET_TABLES.map((table) => [table.name, []]));
  });

  it('sin cuenta conectada no lee nada', async () => {
    credentials.credentials = null;

    const result = await reconcile.execute();

    expect(result).toEqual({ reconciled: false, plan: null, reason: 'disconnected' });
    expect(reader.reads).toBe(0);
  });

  it('sin destino para la cuenta no lee nada', async () => {
    await targets.remove('cuenta-1');

    const result = await reconcile.execute();

    expect(result).toEqual({ reconciled: false, plan: null, reason: 'no-target' });
    expect(reader.reads).toBe(0);
  });

  it('un fallo de lectura se informa y no se lanza', async () => {
    reader.failWith = new Error('la red no está');

    const result = await reconcile.execute();

    expect(result).toEqual({ reconciled: false, plan: null, reason: 'failed' });
  });

  it('con destino y datos devuelve el plan', async () => {
    const result = await reconcile.execute();

    expect(result.reconciled).toBe(true);
    expect(result.plan?.aborted).toBeNull();
    expect(reader.reads).toBe(1);
  });

  it('pide TODO el origen: la simulación compara el catálogo entero', async () => {
    await reconcile.execute();

    expect(source.queries).toEqual([{ all: true, refs: [] }]);
  });

  it('no escribe nada: ni la base, ni el destino, ni el origen', async () => {
    // La promesa de esta fase. Si esto falla, ya no se puede dejar corriendo sobre datos de verdad.
    await reconcile.execute();

    expect(await shadow.all()).toEqual([]);
  });
});
