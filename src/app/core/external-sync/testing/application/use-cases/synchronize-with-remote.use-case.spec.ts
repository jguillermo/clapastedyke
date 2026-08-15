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

    it('si la hoja se reemplaza mientras se lee, no se escribe en la abandonada y se repite contra la nueva', async () => {
      /*
       * La carrera es real y su desenlace era grave: al conectar la cuenta se dispara un ciclo y, en
       * paralelo, la pantalla descubre que la hoja estaba en la papelera y crea otra. Sin esta guarda, el
       * ciclo escribía en la hoja abandonada y dejaba la base describiendo filas que la hoja nueva no
       * tiene — con lo que el tope de borrado masivo abortaba todos los ciclos siguientes y la hoja nueva
       * se quedaba vacía para siempre.
       */
      source.rows = { ...source.rows, supplies: [insumo('ing-harina')] };
      vi.spyOn(reader, 'read').mockImplementationOnce(async () => {
        await targets.save('cuenta-1', SyncTarget.of('hoja-2', 'https://example.test/hoja-2'));
        return remote();
      });

      const result = await cycle.execute();

      // Quien pidió el ciclo recibe uno de verdad, ya contra la hoja nueva.
      expect(result.synced).toBe(true);
      expect(gateway.migrated.map((request) => request.target.id)).toEqual(['hoja-2']);
      expect(gateway.sent.map((request) => request.target.id)).toEqual(['hoja-2']);
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

    /**
     * El cerrojo del adaptador, y la razón por la que la base se escribe **fila a fila con lo que el
     * destino confirmó de CADA una**, no de una pasada sobre el lote: aquí una fila entra y la otra se
     * rechaza en el mismo envío.
     *
     * Si alguien "simplificara" el bucle recorriendo `plan.apply` en vez de `outcome.applied` y
     * `outcome.rejected` por separado, el fallo sería silencioso en las dos direcciones: la rechazada
     * quedaría apuntada como buena —y entonces no se reintentaría **nunca**, ni siquiera cuando el
     * humano corrigiera la celda—, o la buena quedaría en cuarentena y se reintentaría en cada ciclo,
     * para siempre. Las dos se recuerdan, pero no igual.
     */
    it('en un lote mixto apunta cada fila según lo que confirmó el destino, no el lote entero', async () => {
      reader.snapshot = remote([
        cellsOf(insumo('ing-bueno')),
        cellsOf(insumo('ing-malo', 'Manteca')),
      ]);
      sink.rejectIds = ['ing-malo'];

      const result = await cycle.execute();

      expect(result).toMatchObject({ applied: 1, rejected: 1 });

      const base = [...(await shadow.all())].sort((x, y) => x.rowId.localeCompare(y.rowId));
      expect(base).toMatchObject([
        { table: 'supplies', rowId: 'ing-bueno', deleted: false },
        { table: 'supplies', rowId: 'ing-malo', rejected: expect.any(String) },
      ]);
      // La que entró se apunta limpia: sin marca de cuarentena.
      expect(base[0]?.rejected).toBeUndefined();
      // Y la rechazada guarda la huella con la que falló, que es lo único que la sacará de ahí.
      expect(base[1]?.fingerprint).toEqual(expect.any(String));
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

  /**
   * Las dos correcciones que el ciclo hace **sobre** el destino, y que no son ni subir ni bajar: darle
   * identidad a una fila que alguien escribió a mano, y devolverle la suya a una a la que se la cambiaron.
   * Las dos escriben celdas concretas, nunca la fila entera — el contenido es del usuario.
   */
  describe('las correcciones del destino', () => {
    it('una fila añadida a mano se trae, se le escribe el id y queda en la base', async () => {
      // Sin escribirle el id, el ciclo siguiente le inventaría otra identidad: un agregado nuevo cada
      // dos minutos, para siempre.
      reader.snapshot = remote([cellsOf({ ...insumo(''), name: 'Manteca' })]);

      const result = await cycle.execute();

      expect(result.applied).toBe(1);

      // Se trajo con una identidad ya puesta…
      const assigned = String(
        (sink.changes[0]?.tables['supplies']?.[0] as Record<string, unknown>)['id'],
      );
      expect(assigned).not.toBe('');

      // …y esa misma identidad se escribió en SU fila del destino, con su huella y su versión.
      expect(gateway.stamped).toHaveLength(1);
      expect(gateway.stamped[0].rows).toMatchObject([
        { table: 'supplies', index: 2, cells: { id: assigned, origen: 'dev00001', borrado: '' } },
      ]);
      expect(gateway.stamped[0].rows[0].cells['huella']).not.toBe('');

      // Y queda apuntada, así que el ciclo siguiente la ve como una fila normal.
      expect(await shadow.all()).toMatchObject([{ table: 'supplies', rowId: assigned }]);
    });

    it('un id cambiado a mano se devuelve a su fila, y nada más se toca', async () => {
      const fila = insumo('ing-1');
      reader.snapshot = remote([cellsOf({ ...fila, id: 'ing-inventado' })]);
      source.rows = { ...source.rows, supplies: [fila] };
      await shadow.put({
        table: 'supplies',
        rowId: 'ing-1',
        fingerprint: 'huella-vieja',
        version: '0000000000000-0-otro',
        deleted: false,
      });

      const result = await cycle.execute();

      expect(gateway.stamped[0].rows).toEqual([
        { table: 'supplies', index: 2, cells: { id: 'ing-1' } },
      ]);
      // Ni se da por borrada la fila que «desapareció», ni se escribe el bloque: solo la celda del id.
      expect(result.removed).toBe(0);
      expect(gateway.sent).toEqual([]);
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
