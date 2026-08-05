import { TestBed } from '@angular/core/testing';
import { SynchronizeWithRemote } from '../../../application/use-cases/synchronize-with-remote.use-case';
import { SyncShadow } from '../../../domain/services/sync-shadow';
import { SyncTarget } from '../../../domain/value-objects/sync-target';
import { SHEET_TABLES } from '../../../infrastructure/sheet-schema';
import {
  FakeCredentialsProvider,
  FakeExportableData,
  FakeImportableData,
  FakeSyncGateway,
  FakeSyncReader,
  FakeSyncTargetRepository,
  makeExternalSyncFakes,
} from '../../external-sync-test-doubles';

/**
 * El ciclo completo.
 *
 * Lo que este spec vigila, por encima de las cuentas: **el orden**. Subir antes de leer pisa el trabajo
 * de otro dispositivo; escribir antes de poner al día la forma de la hoja deja columnas sin nombre; y
 * apuntar la base antes de que el destino confirme hace que un envío fallido no se reintente nunca.
 */
describe('SynchronizeWithRemote', () => {
  let cycle: SynchronizeWithRemote;
  let credentials: FakeCredentialsProvider;
  let targets: FakeSyncTargetRepository;
  let reader: FakeSyncReader;
  let gateway: FakeSyncGateway;
  let shadow: SyncShadow;
  let source: FakeExportableData;
  let sink: FakeImportableData;

  const insumo = (id: string, name = 'Harina') => ({
    id,
    name,
    baseUnit: 'g',
    usage: 'recipe',
    priceAmount: 2.5,
    pricePerValue: 1000,
    pricePerUnit: 'g',
    currency: 'PEN',
    updatedAt: '2026-08-04T10:00:00.000Z',
  });

  /** Un destino con todas las pestañas presentes y al día, y las filas que se le pasen en Insumos. */
  function remote(supplies: unknown[][] = []) {
    return {
      schemaVersion: 4,
      tables: SHEET_TABLES.map((table) => ({
        name: table.name,
        present: true,
        headers: [...table.headers],
        rows:
          table.name === 'supplies' ? supplies.map((cells, i) => ({ index: 2 + i, cells })) : [],
      })),
    };
  }

  function cellsOf(row: Record<string, unknown>): unknown[] {
    const table = SHEET_TABLES.find((candidate) => candidate.name === 'supplies');
    return (table?.fields ?? []).map((field) => row[field] ?? '');
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    cycle = TestBed.inject(SynchronizeWithRemote);
    credentials = TestBed.inject(FakeCredentialsProvider);
    targets = TestBed.inject(FakeSyncTargetRepository);
    reader = TestBed.inject(FakeSyncReader);
    gateway = TestBed.inject(FakeSyncGateway);
    shadow = TestBed.inject(SyncShadow);
    source = TestBed.inject(FakeExportableData);
    sink = TestBed.inject(FakeImportableData);

    await targets.save('cuenta-1', SyncTarget.of('hoja-1', 'https://example.test/hoja-1'));
    reader.snapshot = remote();
    source.rows = Object.fromEntries(SHEET_TABLES.map((table) => [table.name, []]));
  });

  describe('la puerta', () => {
    it('sin cuenta conectada no lee ni escribe nada', async () => {
      credentials.credentials = null;

      const result = await cycle.execute();

      expect(result).toMatchObject({ synced: false, reason: 'disconnected' });
      expect(reader.reads).toBe(0);
      expect(gateway.sent).toEqual([]);
    });

    it('sin destino no lee ni escribe nada', async () => {
      await targets.remove('cuenta-1');

      const result = await cycle.execute();

      expect(result).toMatchObject({ synced: false, reason: 'no-target' });
      expect(reader.reads).toBe(0);
    });
  });

  describe('el orden', () => {
    it('lee ANTES de escribir: nunca se sube a ciegas', async () => {
      source.rows = { ...source.rows, supplies: [insumo('ing-1')] };

      await cycle.execute();

      expect(reader.reads).toBe(1);
      expect(gateway.sent).toHaveLength(1);
    });

    it('pone al día la forma del destino antes de escribir', async () => {
      source.rows = { ...source.rows, supplies: [insumo('ing-1')] };

      await cycle.execute();

      // Sin esto, las columnas nuevas caerían debajo de celdas en blanco.
      expect(gateway.migrated).toHaveLength(1);
      expect(gateway.migrated[0]?.snapshot.schemaVersion).toBe(4);
    });

    it('un fallo al escribir NO deja la base apuntada: el ciclo siguiente lo reintenta', async () => {
      source.rows = { ...source.rows, supplies: [insumo('ing-1')] };
      gateway.failWith = new Error('la red no está');

      const result = await cycle.execute();

      expect(result).toMatchObject({ synced: false, reason: 'failed' });
      expect(await shadow.all()).toEqual([]);
    });
  });

  describe('subir lo que ganó aquí', () => {
    it('sube la fila local que el destino no tiene, con su huella y su versión', async () => {
      source.rows = { ...source.rows, supplies: [insumo('ing-1')] };

      const result = await cycle.execute();

      expect(result.pushed).toBeGreaterThan(0);
      const enviado = gateway.sent[0]?.batch.payload()['supplies']?.[0] as
        Record<string, unknown> | undefined;
      expect(enviado?.['id']).toBe('ing-1');
      expect(enviado?.['huella']).toEqual(expect.any(String));
      expect(enviado?.['version']).toEqual(expect.any(String));
      expect(enviado?.['origen']).toBe('dev00001');
    });

    it('apunta la base de lo subido, para no volver a subirlo', async () => {
      source.rows = { ...source.rows, supplies: [insumo('ing-1')] };

      await cycle.execute();

      const base = await shadow.all();
      expect(base).toMatchObject([{ table: 'supplies', rowId: 'ing-1', deleted: false }]);
    });

    it('lo que ya está igual a los dos lados no se sube', async () => {
      // Segundo ciclo sin cambios: la base ya cuadra, así que no hay nada que hacer.
      source.rows = { ...source.rows, supplies: [insumo('ing-1')] };
      await cycle.execute();
      const enviosPrimerCiclo = gateway.sent.length;

      // El destino ahora refleja lo que se subió.
      const enviado = gateway.sent[0]?.batch.payload()['supplies']?.[0] as Record<string, unknown>;
      reader.snapshot = remote([cellsOf(enviado)]);

      const result = await cycle.execute();

      expect(gateway.sent).toHaveLength(enviosPrimerCiclo);
      expect(result.pushed).toBe(0);
      expect(result.applied).toBe(0);
    });
  });

  describe('traer lo que ganó allí', () => {
    it('trae una fila del destino que aquí no está', async () => {
      reader.snapshot = remote([cellsOf(insumo('ing-remoto'))]);

      const result = await cycle.execute();

      expect(result.applied).toBe(1);
      expect(sink.changes[0]?.tables['supplies']).toHaveLength(1);
    });

    it('una fila rechazada se recuerda en la base para no reintentarla en cada ciclo', async () => {
      reader.snapshot = remote([cellsOf(insumo('ing-malo'))]);
      sink.rejectIds = ['ing-malo'];

      const result = await cycle.execute();

      expect(result.rejected).toBe(1);
      expect(await shadow.all()).toMatchObject([
        { table: 'supplies', rowId: 'ing-malo', rejected: expect.any(String) },
      ]);
    });
  });

  describe('las barreras', () => {
    it('una pestaña que falta para el ciclo y no toca nada', async () => {
      reader.snapshot = {
        schemaVersion: 4,
        tables: SHEET_TABLES.map((table) => ({
          name: table.name,
          present: table.name !== 'flavors',
          headers: table.name === 'flavors' ? [] : [...table.headers],
          rows: [],
        })),
      };
      source.rows = { ...source.rows, supplies: [insumo('ing-1')] };

      const result = await cycle.execute();

      expect(result).toMatchObject({ synced: false, reason: 'blocked' });
      expect(gateway.sent).toEqual([]);
      expect(sink.changes).toEqual([]);
      expect(await shadow.all()).toEqual([]);
    });
  });

  it('dos ciclos a la vez comparten uno: no se pisan escribiendo', async () => {
    source.rows = { ...source.rows, supplies: [insumo('ing-1')] };

    const [uno, dos] = await Promise.all([cycle.execute(), cycle.execute()]);

    expect(reader.reads).toBe(1);
    expect(uno).toEqual(dos);
  });

  it('si la sesión cambia mientras corre, el resultado se descarta', async () => {
    source.rows = { ...source.rows, supplies: [insumo('ing-1')] };
    reader.snapshot = remote();
    // La cuenta cambia justo después de leer.
    const original = reader.read.bind(reader);
    reader.read = async () => {
      credentials.credentials = { ...credentials.credentials!, epoch: 99 };
      return original();
    };

    const result = await cycle.execute();

    expect(result).toMatchObject({ synced: false, reason: 'stale-session' });
  });
});
