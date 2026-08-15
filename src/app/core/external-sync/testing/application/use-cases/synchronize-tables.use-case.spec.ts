import { TestBed } from '@angular/core/testing';
import {
  SYNCED_TABLES,
  SynchronizeTables,
} from '../../../application/use-cases/synchronize-tables.use-case';
import {
  RemoteSnapshot,
  RemoteTable,
  RemoteWrite,
} from '../../../domain/repositories/remote.repository';
import { SyncStatus } from '../../../domain/services/sync-status';
import { SyncTarget } from '../../../domain/value-objects/sync-target';
import { SHEET_HEADERS } from '../../../infrastructure/sheet-schema';
import { canonicalJson, parsePayload } from '../../../infrastructure/sheets/record-json';
import {
  FakeCredentialsProvider,
  FakeLocalRepository,
  FakeRemoteRepository,
  FakeSyncShadow,
  FakeSyncTargetRepository,
  makeExternalSyncFakes,
} from '../../external-sync-test-doubles';

/**
 * El ciclo entero, contra dobles: es el **único** consumidor del motor, así que aquí se comprueba que
 * lo orquesta bien — no lo que el motor decide, que tiene su propio spec, ni cómo se escribe una hoja,
 * que lo cubren el adaptador y los E2E.
 *
 * Lo que se fija aquí son las garantías que no se ven desde ninguno de los dos lados por separado:
 * que la puerta distingue «no hay cuenta» de «caducó», que una barrera **no toca nada**, que se baja
 * antes de subir, que el shadow se apunta al final, y que la simulación no escribe.
 */
describe('SynchronizeTables', () => {
  const TABLE = 'ingredients';
  let cycle: SynchronizeTables;
  let credentials: FakeCredentialsProvider;
  let targets: FakeSyncTargetRepository;
  let remote: FakeRemoteRepository;
  let local: FakeLocalRepository;
  let shadow: FakeSyncShadow;
  let status: SyncStatus;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: makeExternalSyncFakes().providers });
    cycle = TestBed.inject(SynchronizeTables);
    credentials = TestBed.inject(FakeCredentialsProvider);
    targets = TestBed.inject(FakeSyncTargetRepository);
    remote = TestBed.inject(FakeRemoteRepository);
    local = TestBed.inject(FakeLocalRepository);
    shadow = TestBed.inject(FakeSyncShadow);
    status = TestBed.inject(SyncStatus);

    await targets.save('cuenta-1', SyncTarget.of('hoja-1', 'https://example.test/hoja-1'));
    remote.snapshot = snapshotWith(emptyTable(TABLE));
  });

  /**
   * La puerta, con la distinción que importa: **«no hay cuenta» y «se caducó» no son lo mismo**.
   *
   * El token de Google dura una hora y en un navegador no hay refresh token, así que caducar es lo
   * normal, no un fallo. Si las dos situaciones dieran el mismo estado, a alguien que lleva meses
   * usando la app le diríamos «sin conectar» y pensaría que ha perdido sus datos.
   */
  it('sin credenciales distingue no haber conectado nunca de haber caducado', async () => {
    credentials.credentials = null;

    const primera = await cycle.execute({});
    expect(primera).toMatchObject({ synced: false, reason: 'disconnected' });
    expect(status.snapshot().phase).toBe('disconnected');

    // Ya hubo una sincronización en esta sesión: ahora la ausencia de token significa otra cosa.
    status.markSynced(
      SyncTarget.of('hoja-1', 'https://example.test/hoja-1'),
      new Date().toISOString(),
    );
    await cycle.execute({});
    expect(status.snapshot().phase).toBe('reconnect');
  });

  /** Sin hoja no hay dónde escribir, y no es un fallo: es que todavía no se ha preparado. */
  it('sin destino no hace nada y no marca error', async () => {
    await targets.remove('cuenta-1');

    expect(await cycle.execute({})).toMatchObject({ synced: false, reason: 'no-target' });
    expect(status.snapshot().phase).not.toBe('error');
  });

  /**
   * El ciclo completo contra una hoja vacía: lo local sube, y **en una sola escritura**.
   *
   * Se comprueba la escritura entera (`toEqual` de las celdas) porque es el contrato de la hoja: las
   * columnas deducidas de los datos, las de servicio al final, y la huella y la versión escritas
   * **junto al contenido** — que es lo único que hace cierta después la regla «la huella no cuadra ⇒
   * lo tocó una persona».
   */
  it('sube lo local a una hoja vacía, en una sola escritura, y apunta el shadow', async () => {
    local.tables.set(TABLE, [
      { id: 'ing-1', name: 'Harina', updatedAt: '2026-08-14T10:00:00.000Z' },
    ]);

    const result = await cycle.execute({});

    expect(result.synced).toBe(true);
    expect(result.movements).toMatchObject({ pushed: 1, applied: 0, removed: 0 });
    expect(remote.written).toHaveLength(1);

    const [upsert] = remote.writesOf('upsert');
    expect(upsert.table).toBe(TABLE);
    expect(upsert.columns).toEqual([...SHEET_HEADERS]);
    expect(upsert.rows).toHaveLength(1);
    const [id, datos, version, origen, huella, borrado] = upsert.rows[0];
    expect(id).toBe('ing-1');
    // El registro entero en una celda, **sin** su fecha de guardado: esa viaja en `version`.
    expect(parsePayload(datos)).toEqual({ id: 'ing-1', name: 'Harina' });
    expect(version.length).toBeGreaterThan(0);
    expect(origen).toBe('dev00001');
    expect(huella.length).toBeGreaterThan(0);
    expect(borrado).toBe('');

    // El shadow es el ancestro del ciclo siguiente: sin él no se puede fusionar campo a campo.
    const recordado = await shadow.all();
    expect(recordado).toHaveLength(1);
    expect(recordado[0]).toMatchObject({ table: TABLE, rowId: 'ing-1', deleted: false });
    expect(recordado[0].values).toEqual({ id: 'ing-1', name: 'Harina' });
  });

  /**
   * **Idempotencia**: el mismo ciclo dos veces deja la hoja igual y no mueve nada la segunda.
   *
   * Es la garantía que permite reintentar sin miedo — un fallo de red a mitad se resuelve volviendo a
   * llamar— y la que se rompería en silencio si la representación de una fila no fuera reversible: la
   * hoja se reescribiría sola en cada ciclo, para siempre.
   */
  it('el mismo ciclo repetido no vuelve a mover nada', async () => {
    local.tables.set(TABLE, [
      { id: 'ing-1', name: 'Harina', updatedAt: '2026-08-14T10:00:00.000Z' },
    ]);

    await cycle.execute({});
    remote.snapshot = snapshotWith(tableFromWrite(remote.writesOf('upsert')[0]));
    remote.written.length = 0;

    const segunda = await cycle.execute({});

    expect(segunda.synced).toBe(true);
    expect(segunda.movements).toEqual({ pushed: 0, applied: 0, removed: 0, merged: 0 });
    expect(remote.written).toEqual([]);
  });

  /**
   * Bajar lo que hay allí y no aquí, **en una sola transacción por tabla**.
   *
   * En bloque y no fila a fila porque una transacción por fila multiplica por N el coste de traerse
   * una tabla entera y, sobre todo, deja de ser atómico: una caída a la mitad guardaría unas filas sí
   * y otras no, y el shadow quedaría describiendo un estado que no existe en ningún lado.
   */
  it('baja lo que falta aquí en una sola transacción', async () => {
    remote.snapshot = snapshotWith(
      tableWith(TABLE, [
        {
          index: 2,
          values: { id: 'ing-remoto', name: 'Manteca' },
          version: '0000000000500-0000-otro',
        },
        {
          index: 3,
          values: { id: 'ing-otro', name: 'Azúcar' },
          version: '0000000000500-0000-otro',
        },
      ]),
    );

    const result = await cycle.execute({});

    expect(result.movements.applied).toBe(2);
    expect(local.writes).toBe(1);
    // La fecha de guardado no viaja: se sintetiza del instante que lleva dentro la versión, así que la
    // que queda aquí es **la del cambio** y el ciclo siguiente deriva de ella la misma versión que hay
    // en la hoja — que es lo que deja la fila convergida en vez de volver a competir.
    const guardadoAt = new Date(500).toISOString();
    expect(await local.all(TABLE)).toEqual([
      { id: 'ing-remoto', name: 'Manteca', updatedAt: guardadoAt },
      { id: 'ing-otro', name: 'Azúcar', updatedAt: guardadoAt },
    ]);
  });

  /**
   * **Lo que baja se guarda con su tipo.**
   *
   * Es el fallo que dejó el catálogo de insumos vacío: con una columna por campo, una hoja escrita con
   * `valueInputOption: RAW` devolvía los números como texto y se guardaban tal cual; con el precio como
   * `'7.25'` en vez de `7.25`, el repositorio del recetario lo descartaba como documento sin precio y
   * el insumo desaparecía de la lista — sin error, y con un aviso que nadie mira.
   *
   * Guardando el registro en JSON esto es cierto **por construcción**, y este caso es lo que lo
   * mantiene cierto de punta a punta: de la celda a la base de datos, pasando por el motor.
   */
  it('una fila que solo está en la hoja se guarda con sus tipos', async () => {
    local.tables.set(TABLE, [{ id: 'ing-1', precio: 4.5 }]);
    remote.snapshot = snapshotWith(
      tableWith(TABLE, [
        { index: 2, values: { id: 'ing-1', precio: 4.5 }, version: '0000000000100-0000-otro' },
        { index: 3, values: { id: 'ing-2', precio: 7.25 }, version: '0000000000500-0000-otro' },
      ]),
    );

    await cycle.execute({});

    const guardado = (await local.all(TABLE)).find((row) => row.id === 'ing-2');
    expect(guardado).toEqual({
      id: 'ing-2',
      precio: 7.25,
      updatedAt: new Date(500).toISOString(),
    });
    expect(typeof guardado?.['precio']).toBe('number');
  });

  /**
   * Una barrera **no toca nada**, ni aquí ni allí.
   *
   * Falta la pestaña: «no hay filas» combinado con «lo que estaba y ya no está, se borró» borraría la
   * tabla entera en todos los dispositivos. Un clic derecho en «Eliminar hoja» no puede costar eso, y
   * por eso el ciclo se niega **entero** en vez de aplicar lo que sí se pudo leer.
   */
  it('si falta una pestaña que se conocía, se niega a seguir sin escribir nada', async () => {
    local.tables.set(TABLE, [{ id: 'ing-1', name: 'Harina' }]);
    // El shadow la recuerda: por eso «no está» significa «la han borrado» y no «todavía no existe».
    await shadow.putAll([
      {
        table: TABLE,
        rowId: 'ing-1',
        fingerprint: 'da-igual',
        version: '0000000000500-0000-otro',
        deleted: false,
        values: { id: 'ing-1', name: 'Harina' },
      },
    ]);
    remote.snapshot = {
      tables: [{ table: TABLE, present: false, header: [], rows: [], unreadable: [], raw: [] }],
    };

    const result = await cycle.execute({});

    expect(result).toMatchObject({ synced: false, reason: 'blocked' });
    expect(result.problems.barrier).toContain(TABLE);
    expect(remote.written).toEqual([]);
    expect(local.writes).toBe(0);
    expect(status.snapshot().phase).toBe('error');
  });

  /**
   * El tope de borrado masivo: si de golpe faltan demasiadas filas que el shadow recordaba, es más
   * probable una lectura a medias que un borrado de verdad. El tope no distingue el accidente —no
   * puede— pero convierte una pérdida total en una pregunta.
   */
  it('si de golpe faltan demasiadas filas conocidas, se niega a seguir', async () => {
    const filas = Array.from({ length: 30 }, (_, i) => ({ id: `ing-${i}`, name: `Insumo ${i}` }));
    local.tables.set(TABLE, filas);
    await shadow.putAll(
      filas.map((row) => ({
        table: TABLE,
        rowId: row.id,
        fingerprint: 'da-igual',
        version: '0000000000500-0000-otro',
        deleted: false,
        values: row,
      })),
    );
    // La hoja vuelve vacía: para el shadow, alguien ha borrado las treinta.
    remote.snapshot = snapshotWith(emptyTable(TABLE));

    const result = await cycle.execute({});

    expect(result).toMatchObject({ synced: false, reason: 'blocked' });
    expect(result.problems.barrier).toContain('30');
    expect(remote.written).toEqual([]);
    expect(local.writes).toBe(0);
  });

  /**
   * La simulación **no escribe en ningún lado** y cuenta lo mismo que haría el ciclo de verdad.
   *
   * Es el mismo ciclo con la mitad de abajo cortada, y por eso es el mismo caso de uso: una simulación
   * escrita aparte acabaría divergiendo del ciclo real y diría que todo está bien justo cuando no lo
   * está.
   */
  it('la simulación cuenta lo que haría y no toca nada', async () => {
    local.tables.set(TABLE, [{ id: 'ing-1', name: 'Harina' }]);

    const simulado = await cycle.execute({ dryRun: true });

    expect(simulado.synced).toBe(false);
    expect(simulado.movements.pushed).toBe(1);
    expect(remote.written).toEqual([]);
    expect(local.writes).toBe(0);
    expect(await shadow.all()).toEqual([]);
    // Y no marca estados: comprobar no es sincronizar.
    expect(status.snapshot().phase).not.toBe('syncing');

    const real = await cycle.execute({});
    expect(real.movements.pushed).toBe(simulado.movements.pushed);
  });

  /**
   * Si la hoja de la cuenta cambia mientras se lee, lo leído no vale: se descarta el ciclo **y se
   * reintenta contra la hoja nueva**, porque quien lo pidió merece una respuesta de verdad.
   *
   * Pasa al conectar: la pantalla reemplaza una hoja que estaba en la papelera mientras el ciclo ya
   * estaba leyendo la vieja. Sin el reintento, quien pulsó se quedaría con el resultado del ciclo que
   * leyó la hoja abandonada y la nueva se quedaría vacía diciendo «listo».
   */
  it('si la hoja cambia a mitad, descarta el ciclo y reintenta contra la nueva', async () => {
    local.tables.set(TABLE, [{ id: 'ing-1', name: 'Harina' }]);
    let reemplazada = false;
    remote.beforeRead = async () => {
      if (!reemplazada) {
        reemplazada = true;
        await targets.save('cuenta-1', SyncTarget.of('hoja-2', 'https://example.test/hoja-2'));
      }
    };

    const result = await cycle.execute({});

    expect(result.synced).toBe(true);
    expect(remote.reads).toBe(2);
    expect(remote.written[0].target.id).toBe('hoja-2');
  });

  /** Dos ciclos a la vez se pisarían escribiendo: quien llegue mientras comparte el resultado. */
  it('solo corre un ciclo a la vez', async () => {
    local.tables.set(TABLE, [{ id: 'ing-1', name: 'Harina' }]);

    const [uno, dos] = await Promise.all([cycle.execute({}), cycle.execute({})]);

    expect(uno).toBe(dos);
    expect(remote.reads).toBe(1);
  });

  /**
   * El array es la única lista, y se lee **entero**: el destino recibe exactamente esos nombres.
   *
   * Se asserta el contenido del array a propósito. No es una tautología: es el sitio donde alguien
   * puede añadir o quitar una tabla sin querer, y una tabla de menos no rompe nada — simplemente deja
   * de replicarse, en silencio, hasta que alguien se da cuenta meses después.
   */
  it('solo toca las tablas del array, y se piden todas', async () => {
    expect(SYNCED_TABLES).toEqual([
      'ingredients',
      'recipes',
      'recipe_categories',
      'flavors',
      'conversion_options',
    ]);

    await cycle.execute({});

    expect(remote.requested.map((request) => request.tables)).toEqual([[...SYNCED_TABLES]]);
  });
});

// ── Utilidades para armar lo que devuelve el destino ────────────────────────────────────────────

function snapshotWith(...tables: RemoteTable[]): RemoteSnapshot {
  const rest = SYNCED_TABLES.filter((name) => !tables.some((table) => table.table === name)).map(
    emptyTable,
  );
  return { tables: [...tables, ...rest] };
}

function emptyTable(table: string): RemoteTable {
  return { table, present: true, header: [...SHEET_HEADERS], rows: [], unreadable: [], raw: [] };
}

function tableWith(
  table: string,
  rows: readonly { index: number; values: Record<string, unknown>; version: string }[],
): RemoteTable {
  return {
    table,
    present: true,
    header: [...SHEET_HEADERS],
    rows: rows.map((row) => ({
      index: row.index,
      values: row.values,
      meta: { version: row.version, origin: 'otro', fingerprint: '', deleted: false },
    })),
    unreadable: [],
    raw: rows.map((row) => ({
      id: String(row.values['id'] ?? ''),
      cells: {
        id: String(row.values['id'] ?? ''),
        datos: canonicalJson(row.values as never),
        version: row.version,
        origen: 'otro',
        huella: '',
        borrado: '',
      },
    })),
  };
}

/**
 * La hoja tal y como queda **después** de una escritura: es lo que el ciclo siguiente leería.
 *
 * Se reconstruye con las mismas piezas que usa el adaptador de verdad (`parsePayload`), porque probar
 * la idempotencia contra una hoja inventada a mano no probaría nada: lo que tiene que cerrar es el
 * círculo completo escribir → leer → decidir.
 */
function tableFromWrite(write: Extract<RemoteWrite, { kind: 'upsert' }>): RemoteTable {
  const rows = write.rows.map((cells, offset) => {
    const named = Object.fromEntries(write.columns.map((column, index) => [column, cells[index]]));
    return {
      index: 2 + offset,
      values: parsePayload(named['datos']) ?? { id: named['id'] ?? '' },
      meta: {
        version: named['version'] ?? '',
        origin: named['origen'] ?? '',
        fingerprint: named['huella'] ?? '',
        deleted: named['borrado'] === 'TRUE',
      },
      raw: { id: named['id'] ?? '', cells: named },
    };
  });

  return {
    table: write.table,
    present: true,
    header: [...write.columns],
    rows: rows.map(({ index, values, meta }) => ({ index, values, meta })),
    unreadable: [],
    raw: rows.map((row) => row.raw),
  };
}
