import { ExportedRows } from '@core/_common/export/exportable-data';
import { RemoteSnapshot, RemoteTable } from '../../domain/services/sync-reader.types';
import { ShadowRow } from '../../domain/services/sync-shadow';
import { RowVersion } from '../../domain/value-objects/row-version';
import { MergePlan, reconcile } from '../../infrastructure/reconcile';
import { canonicalRow } from '../../infrastructure/sheet-canonical';
import { fingerprintOf } from '../../infrastructure/sheet-hash';
import { SHEET_TABLES, SheetTable } from '../../infrastructure/sheet-schema';

/**
 * `reconcile` es el corazón del motor, y estos son sus modos de fallo.
 *
 * Cada `it` es un desenlace que, sin la barrera o la regla que lo cubre, pierde datos del usuario en
 * silencio: una pestaña borrada que se lleva el catálogo por delante, una columna insertada que hace
 * leer el precio en la columna de la moneda, una versión con el año 3000 que gana para siempre. Todos se
 * prueban aquí porque aquí se pueden probar **sin red y sin hoja**.
 */

const AHORA = 1_700_000_000_000;
const DEVICE = 'dev00001';

const INSUMOS = tableOf('supplies');
const RECETAS = tableOf('recipes');
const LINEAS = tableOf('recipeLines');

function tableOf(name: string): SheetTable {
  const table = SHEET_TABLES.find((candidate) => candidate.name === name);
  if (!table) {
    throw new Error(`El esquema ya no tiene la tabla "${name}"; hay que actualizar este spec.`);
  }
  return table;
}

/** Un insumo, como lo entrega el origen. */
function insumo(id: string, name = 'Harina', priceAmount = 2.5): Record<string, unknown> {
  return {
    id,
    name,
    baseUnit: 'g',
    usage: 'recipe',
    priceAmount,
    pricePerValue: 1000,
    pricePerUnit: 'g',
    currency: 'PEN',
  };
}

/** Las celdas de una fila, en el orden del esquema, más las columnas de servicio que se le pasen. */
function cellsOf(
  table: SheetTable,
  row: Record<string, unknown>,
  service: { version?: string; huella?: string; borrado?: string } = {},
): unknown[] {
  const cells = table.fields.map((field) => row[field] ?? '');
  return [...cells, service.version ?? '', service.huella ?? '', service.borrado ?? ''];
}

/**
 * La huella que la app habría escrito para esa fila. Se calcula con las mismas funciones que el motor a
 * propósito: lo que se prueba aquí no es la huella (eso es `sheet-hash.spec.ts`) sino qué decide
 * `reconcile` cuando cuadra y cuando no.
 */
async function fingerprintFor(
  table: SheetTable,
  row: Record<string, unknown>,
  lineBlock?: string,
): Promise<string> {
  const canonical = canonicalRow(table.name, table.fields, (field) => row[field]);
  if ('unreadable' in canonical) {
    throw new Error(`La fila del test no es legible: ${canonical.unreadable.field}`);
  }
  const values = lineBlock === undefined ? canonical.values : [...canonical.values, lineBlock];
  return fingerprintOf(values);
}

/**
 * Las cabeceras por defecto llevan las tres columnas de servicio **detrás** de las del esquema, que es
 * exactamente cómo están en un destino ya migrado mientras el esquema todavía no las declara. Es lo que
 * permite que `reconcile` las localice por nombre.
 */
function remoteTable(table: SheetTable, rows: unknown[][], headers?: string[]): RemoteTable {
  return {
    name: table.name,
    present: true,
    headers: headers ?? [...table.headers, 'version', 'huella', 'borrado'],
    rows: rows.map((cells, offset) => ({ index: 2 + offset, cells })),
  };
}

/** Un destino con todas las tablas presentes y vacías, y las que se le pasen con contenido. */
function snapshotOf(...tables: RemoteTable[]): RemoteSnapshot {
  const given = new Map(tables.map((table) => [table.name, table]));
  return {
    schemaVersion: 4,
    tables: SHEET_TABLES.map((table) => given.get(table.name) ?? remoteTable(table, [])),
  };
}

/** Un origen con todas las tablas vacías salvo las que se le pasen. */
function localOf(tables: Record<string, Record<string, unknown>[]>): ExportedRows {
  const rows: Record<string, Record<string, unknown>[]> = {};
  for (const table of SHEET_TABLES) {
    rows[table.name] = tables[table.name] ?? [];
  }
  return rows;
}

function shadowOf(rows: Partial<ShadowRow>[]): ShadowRow[] {
  return rows.map((row) => ({
    table: row.table ?? 'supplies',
    rowId: row.rowId ?? '',
    fingerprint: row.fingerprint ?? '',
    version: row.version ?? RowVersion.of(AHORA - 1000, 0, 'otro').toString(),
    deleted: row.deleted ?? false,
    ...(row.rejected === undefined ? {} : { rejected: row.rejected }),
  }));
}

function run(input: {
  snapshot: RemoteSnapshot;
  local?: ExportedRows;
  shadow?: ShadowRow[];
  localVersionOf?: (table: string, rowId: string) => string | null;
}): Promise<MergePlan> {
  return reconcile({
    snapshot: input.snapshot,
    shadow: input.shadow ?? [],
    local: input.local ?? localOf({}),
    tables: SHEET_TABLES,
    now: AHORA,
    deviceId: DEVICE,
    ...(input.localVersionOf ? { localVersionOf: input.localVersionOf } : {}),
  });
}

describe('reconcile · barreras', () => {
  it('una pestaña que falta aborta el ciclo entero, no borra su tabla', async () => {
    // Sin esto, un clic derecho en «Eliminar hoja» sobre Sabores borraría todos los sabores en TODOS
    // los dispositivos: la regla «estaba en la base y ya no está» los tomaría por borrados.
    const snapshot: RemoteSnapshot = {
      schemaVersion: 4,
      tables: SHEET_TABLES.map((table) =>
        table.name === 'flavors'
          ? { name: table.name, present: false, headers: [], rows: [] }
          : remoteTable(table, []),
      ),
    };
    const shadow = shadowOf([
      { table: 'flavors', rowId: 'flv-1', fingerprint: 'a' },
      { table: 'flavors', rowId: 'flv-2', fingerprint: 'b' },
    ]);

    const plan = await run({ snapshot, shadow });

    expect(plan.aborted).toEqual({ kind: 'missing-table', table: 'flavors' });
    expect(plan.remove).toEqual([]);
    expect(plan.apply).toEqual([]);
    expect(plan.push).toEqual([]);
  });

  it('una columna insertada a mano aborta: las demás estarían corridas un sitio', async () => {
    const corridas = ['Insertada', ...INSUMOS.headers];

    const plan = await run({ snapshot: snapshotOf(remoteTable(INSUMOS, [], corridas)) });

    expect(plan.aborted).toMatchObject({ kind: 'headers', table: 'supplies' });
  });

  it('una columna de servicio de más al final NO aborta: es la que el destino aún no conoce', async () => {
    const conExtra = [...INSUMOS.headers, 'version', 'huella', 'borrado'];

    const plan = await run({ snapshot: snapshotOf(remoteTable(INSUMOS, [], conExtra)) });

    expect(plan.aborted).toBeNull();
  });

  it('un borrado masivo aborta en vez de aplicarse', async () => {
    // Una lectura que vuelve a medias es indistinguible de «lo borró todo una persona». Un tope no
    // distingue el accidente, pero convierte la pérdida total en una pregunta.
    const shadow = shadowOf(
      Array.from({ length: 30 }, (_unused, index) => ({
        table: 'supplies',
        rowId: `ing-${index}`,
        fingerprint: `f-${index}`,
      })),
    );

    const plan = await run({ snapshot: snapshotOf(remoteTable(INSUMOS, [])), shadow });

    expect(plan.aborted).toMatchObject({ kind: 'mass-delete', table: 'supplies', rows: 30 });
    expect(plan.remove).toEqual([]);
  });

  it('borrar una fila de una tabla pequeña NO dispara el tope', async () => {
    const filas = [insumo('ing-1'), insumo('ing-2'), insumo('ing-3')];
    const shadow = shadowOf(
      await Promise.all(
        filas.map(async (fila) => ({
          table: 'supplies',
          rowId: String(fila['id']),
          fingerprint: await fingerprintFor(INSUMOS, fila),
        })),
      ),
    );
    const quedan = filas.slice(0, 2);

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(
          INSUMOS,
          await Promise.all(
            quedan.map(async (fila) =>
              cellsOf(INSUMOS, fila, { huella: await fingerprintFor(INSUMOS, fila) }),
            ),
          ),
        ),
      ),
      shadow,
      local: localOf({ supplies: filas }),
    });

    expect(plan.aborted).toBeNull();
    expect(plan.remove).toEqual([
      { table: 'supplies', rowId: 'ing-3', version: expect.any(String), byHand: true },
    ]);
  });
});

describe('reconcile · adopción de un destino que ya existía', () => {
  it('una fila sin huella se adopta como base y no se toma por editada a mano', async () => {
    // Es la regla que evita que el primer ciclo contra una hoja ya existente colisione entera.
    const fila = insumo('ing-1');

    const plan = await run({
      snapshot: snapshotOf(remoteTable(INSUMOS, [cellsOf(INSUMOS, fila)])),
      local: localOf({ supplies: [fila] }),
    });

    expect(plan.adopt).toEqual([
      {
        table: 'supplies',
        rowId: 'ing-1',
        fingerprint: await fingerprintFor(INSUMOS, fila),
        version: RowVersion.adopted().toString(),
        deleted: false,
      },
    ]);
    expect(plan.apply).toEqual([]);
    expect(plan.push).toEqual([]);
    expect(plan.conflicts).toEqual([]);
  });

  it('al adoptar, si el contenido local difiere gana lo local: la app era la única fuente', async () => {
    const aqui = insumo('ing-1', 'Harina', 3);
    const alla = insumo('ing-1', 'Harina', 2.5);

    const plan = await run({
      snapshot: snapshotOf(remoteTable(INSUMOS, [cellsOf(INSUMOS, alla)])),
      local: localOf({ supplies: [aqui] }),
    });

    expect(plan.push).toEqual([{ table: 'supplies', rowId: 'ing-1', index: 2 }]);
    expect(plan.apply).toEqual([]);
  });

  it('una fila sin huella que aquí no existe se trae: es un alta de otro sitio', async () => {
    const fila = insumo('ing-9');

    const plan = await run({
      snapshot: snapshotOf(remoteTable(INSUMOS, [cellsOf(INSUMOS, fila)])),
    });

    expect(plan.apply).toMatchObject([{ table: 'supplies', rowId: 'ing-9' }]);
  });
});

describe('reconcile · lo que hace una persona en la hoja', () => {
  it('una edición a mano gana, aunque su versión sea vieja', async () => {
    // Quien corrige un precio no actualiza la columna de versión. Sin detectarlo por la huella, la
    // resolución por versión pisaría su corrección sin dejar rastro.
    const antes = insumo('ing-1', 'Harina', 2.5);
    const editado = insumo('ing-1', 'Harina', 9);
    const huellaVieja = await fingerprintFor(INSUMOS, antes);

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(INSUMOS, [
          cellsOf(INSUMOS, editado, {
            huella: huellaVieja,
            version: RowVersion.of(AHORA - 100_000, 0, 'otro').toString(),
          }),
        ]),
      ),
      local: localOf({ supplies: [antes] }),
      shadow: shadowOf([{ table: 'supplies', rowId: 'ing-1', fingerprint: huellaVieja }]),
    });

    expect(plan.apply).toMatchObject([{ table: 'supplies', rowId: 'ing-1' }]);
    expect(plan.push).toEqual([]);
  });

  it('una fila que desapareció de la hoja se borra aquí', async () => {
    const fila = insumo('ing-1');
    const huella = await fingerprintFor(INSUMOS, fila);
    const otras = [insumo('ing-2'), insumo('ing-3'), insumo('ing-4')];

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(
          INSUMOS,
          await Promise.all(
            otras.map(async (otra) =>
              cellsOf(INSUMOS, otra, { huella: await fingerprintFor(INSUMOS, otra) }),
            ),
          ),
        ),
      ),
      local: localOf({ supplies: [fila, ...otras] }),
      shadow: shadowOf([
        { table: 'supplies', rowId: 'ing-1', fingerprint: huella },
        ...(await Promise.all(
          otras.map(async (otra) => ({
            table: 'supplies',
            rowId: String(otra['id']),
            fingerprint: await fingerprintFor(INSUMOS, otra),
          })),
        )),
      ]),
    });

    expect(plan.remove).toEqual([
      { table: 'supplies', rowId: 'ing-1', version: expect.any(String), byHand: true },
    ]);
  });

  it('una fila con la lápida puesta se borra aquí', async () => {
    const fila = insumo('ing-1');
    const huella = await fingerprintFor(INSUMOS, fila);

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(INSUMOS, [cellsOf(INSUMOS, fila, { huella, borrado: 'TRUE' })]),
      ),
      local: localOf({ supplies: [fila] }),
      shadow: shadowOf([{ table: 'supplies', rowId: 'ing-1', fingerprint: huella }]),
    });

    expect(plan.remove).toEqual([
      { table: 'supplies', rowId: 'ing-1', version: expect.any(String), byHand: false },
    ]);
  });

  it('una fila escrita a mano sin id se adopta como alta', async () => {
    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(INSUMOS, [cellsOf(INSUMOS, { ...insumo('ing-x'), id: '' })]),
      ),
    });

    expect(plan.handAdds).toMatchObject([{ table: 'supplies', index: 2 }]);
    expect(plan.apply).toEqual([]);
  });

  it('una fila entera en blanco no es un alta: es el hueco de una tabla que se encogió', async () => {
    const plan = await run({
      snapshot: snapshotOf(remoteTable(INSUMOS, [[], ['', '', '']])),
    });

    expect(plan.handAdds).toEqual([]);
    expect(plan.quarantined).toEqual([]);
  });

  it('un id cambiado a mano se devuelve a su sitio en vez de tomarse por borrado y alta', async () => {
    // El desenlace más silencioso: el id viejo «desaparece» (se borraría el agregado local) y el nuevo
    // parece un alta, dejando colgando todo lo que citaba al viejo. La hoja parece perfecta.
    const fila = insumo('ing-1');
    const huella = await fingerprintFor(INSUMOS, fila);
    const conOtroId = { ...fila, id: 'ing-inventado' };

    const plan = await run({
      snapshot: snapshotOf(remoteTable(INSUMOS, [cellsOf(INSUMOS, conOtroId, { huella })])),
      local: localOf({ supplies: [fila] }),
      shadow: shadowOf([{ table: 'supplies', rowId: 'ing-1', fingerprint: huella }]),
    });

    expect(plan.reids).toEqual([
      { table: 'supplies', rowId: 'ing-inventado', previousRowId: 'ing-1', index: 2 },
    ]);
    expect(plan.remove).toEqual([]);
  });

  it('un id duplicado no se toca por ningún lado', async () => {
    const uno = insumo('ing-1', 'Harina');
    const otro = insumo('ing-1', 'Azúcar');

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(INSUMOS, [
          cellsOf(INSUMOS, uno, { huella: await fingerprintFor(INSUMOS, uno) }),
          cellsOf(INSUMOS, otro, { huella: await fingerprintFor(INSUMOS, otro) }),
        ]),
      ),
      local: localOf({ supplies: [uno] }),
    });

    expect(plan.duplicates).toEqual([{ table: 'supplies', rowId: 'ing-1', indexes: [2, 3] }]);
    expect(plan.apply).toEqual([]);
    expect(plan.push).toEqual([]);
    expect(plan.remove).toEqual([]);
  });

  it('una celda que no se puede leer deja la fila en cuarentena y no para el resto', async () => {
    const mala = { ...insumo('ing-1'), priceAmount: 'gratis' };
    const buena = insumo('ing-2');

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(INSUMOS, [
          cellsOf(INSUMOS, mala),
          cellsOf(INSUMOS, buena, { huella: await fingerprintFor(INSUMOS, buena) }),
        ]),
      ),
    });

    expect(plan.quarantined).toEqual([
      { table: 'supplies', rowId: 'ing-1', index: 2, field: 'priceAmount' },
    ]);
    expect(plan.apply).toMatchObject([{ rowId: 'ing-2' }]);
  });

  it('una versión con el año 3000 se re-estampa y no gana por su marca', async () => {
    const fila = insumo('ing-1');
    const huella = await fingerprintFor(INSUMOS, fila);
    const envenenada = RowVersion.of(AHORA + 365 * 24 * 60 * 60 * 1000, 0, 'mano').toString();

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(INSUMOS, [cellsOf(INSUMOS, fila, { huella, version: envenenada })]),
      ),
      local: localOf({ supplies: [fila] }),
      shadow: shadowOf([{ table: 'supplies', rowId: 'ing-1', fingerprint: huella }]),
    });

    // Nada cambió a ninguno de los dos lados, así que no hay nada que hacer — y sobre todo la versión
    // envenenada no se ha propagado a ningún plan.
    expect(plan.apply).toEqual([]);
    expect(plan.push).toEqual([]);
    expect(plan.aborted).toBeNull();
  });
});

describe('reconcile · las dos caras cambiaron', () => {
  const base = insumo('ing-1', 'Harina', 2.5);
  const aqui = insumo('ing-1', 'Harina', 3);
  const alla = insumo('ing-1', 'Harina', 4);

  async function conflicto(localVersionOf?: (table: string, rowId: string) => string | null) {
    const huellaBase = await fingerprintFor(INSUMOS, base);
    return run({
      snapshot: snapshotOf(
        remoteTable(INSUMOS, [
          cellsOf(INSUMOS, alla, {
            huella: await fingerprintFor(INSUMOS, alla),
            version: RowVersion.of(AHORA - 10_000, 0, 'otro').toString(),
          }),
        ]),
      ),
      local: localOf({ supplies: [aqui] }),
      shadow: shadowOf([{ table: 'supplies', rowId: 'ing-1', fingerprint: huellaBase }]),
      ...(localVersionOf ? { localVersionOf } : {}),
    });
  }

  it('sin saber cuándo se cambió aquí, gana el destino y queda anotado como a ciegas', async () => {
    const plan = await conflicto();

    expect(plan.conflicts).toEqual([
      { table: 'supplies', rowId: 'ing-1', winner: 'remote', blind: true },
    ]);
    expect(plan.apply).toMatchObject([{ rowId: 'ing-1' }]);
  });

  it('con una versión local más nueva, gana lo local', async () => {
    const plan = await conflicto(() => RowVersion.of(AHORA - 1, 0, DEVICE).toString());

    expect(plan.conflicts).toEqual([
      { table: 'supplies', rowId: 'ing-1', winner: 'local', blind: false },
    ]);
    expect(plan.push).toEqual([{ table: 'supplies', rowId: 'ing-1', index: 2 }]);
  });

  it('con una versión local más vieja, gana el destino', async () => {
    const plan = await conflicto(() => RowVersion.of(AHORA - 50_000, 0, DEVICE).toString());

    expect(plan.conflicts).toEqual([
      { table: 'supplies', rowId: 'ing-1', winner: 'remote', blind: false },
    ]);
    expect(plan.apply).toMatchObject([{ rowId: 'ing-1' }]);
  });
});

describe('reconcile · las líneas son parte de su receta', () => {
  const receta = {
    id: 'rec-1',
    name: 'Bizcocho',
    categoryId: 'cat-1',
    categoryName: 'Queques',
    flavorId: '',
    flavorLabel: '',
    portionsCapacityId: '',
    portionsCapacityLabel: '',
    moldCapacityId: '',
    moldCapacityLabel: '',
    lineCount: 1,
  };
  const linea = (quantity: number) => ({
    recipeId: 'rec-1',
    recipeName: 'Bizcocho',
    supplyId: 'ing-1',
    supplyName: 'Harina',
    quantity,
    unit: 'g',
  });

  /** El bloque de líneas tal como lo calcula el motor, para poder construir la huella esperada. */
  async function huellaCon(lineas: Record<string, unknown>[]): Promise<string> {
    const bloque = lineas
      .map((line) => {
        const canonical = canonicalRow(LINEAS.name, LINEAS.fields, (field) => line[field]);
        if ('unreadable' in canonical) {
          throw new Error('La línea del test no es legible.');
        }
        return canonical.values.join(String.fromCharCode(31));
      })
      .sort()
      .join(String.fromCharCode(30));
    return fingerprintFor(RECETAS, receta, bloque);
  }

  it('cambiar una línea a mano se detecta como edición de la RECETA', async () => {
    // Su tabla no tiene id, así que no hay base ni versión por línea. La unidad de fusión es la receta,
    // que es la granularidad con la que el dominio ya obliga a cambiarlas.
    const huellaVieja = await huellaCon([linea(200)]);

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(RECETAS, [cellsOf(RECETAS, receta, { huella: huellaVieja })]),
        remoteTable(LINEAS, [cellsOf(LINEAS, linea(500))]),
      ),
      local: localOf({ recipes: [receta], recipeLines: [linea(200)] }),
      shadow: shadowOf([{ table: 'recipes', rowId: 'rec-1', fingerprint: huellaVieja }]),
    });

    expect(plan.apply).toMatchObject([{ table: 'recipes', rowId: 'rec-1' }]);
  });

  it('las mismas líneas en otro orden NO son un cambio', async () => {
    const lineas = [linea(200), { ...linea(300), supplyId: 'ing-2', supplyName: 'Azúcar' }];
    const huella = await huellaCon(lineas);

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(RECETAS, [cellsOf(RECETAS, receta, { huella })]),
        remoteTable(
          LINEAS,
          [...lineas].reverse().map((line) => cellsOf(LINEAS, line)),
        ),
      ),
      local: localOf({ recipes: [receta], recipeLines: lineas }),
      shadow: shadowOf([{ table: 'recipes', rowId: 'rec-1', fingerprint: huella }]),
    });

    expect(plan.apply).toEqual([]);
    expect(plan.push).toEqual([]);
  });
});

describe('reconcile · diagnóstico de diferencias', () => {
  it('señala el campo que difiere entre los dos lados', async () => {
    // Es el diagnóstico que justifica la fase en simulación: con la canonización mal, aquí saldría el
    // catálogo entero fallando por el mismo campo.
    const aqui = insumo('ing-1', 'Harina', 2.5);
    const alla = insumo('ing-1', 'Harina Blanca', 2.5);

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(INSUMOS, [
          cellsOf(INSUMOS, alla, { huella: await fingerprintFor(INSUMOS, alla) }),
        ]),
      ),
      local: localOf({ supplies: [aqui] }),
    });

    expect(plan.drift).toEqual([
      {
        table: 'supplies',
        rowId: 'ing-1',
        field: 'name',
        local: 'Harina',
        remote: 'Harina Blanca',
      },
    ]);
  });

  it('no señala nada cuando los dos lados coinciden pese a venir por caminos distintos', async () => {
    // Lo mismo entrando como número (el modelo) y como texto (una celda): si esto fallara, cada fila
    // parecería editada a mano en cada ciclo y dos dispositivos se pisarían para siempre.
    const local = insumo('ing-1', 'Harina', 2.5);
    const comoCelda = { ...local, priceAmount: '2.5', pricePerValue: '1000' };

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(INSUMOS, [
          cellsOf(INSUMOS, comoCelda, { huella: await fingerprintFor(INSUMOS, local) }),
        ]),
      ),
      local: localOf({ supplies: [local] }),
    });

    expect(plan.drift).toEqual([]);
    expect(plan.apply).toEqual([]);
    expect(plan.push).toEqual([]);
    // Y la base se pone al día, para que el ciclo siguiente ni se lo plantee.
    expect(plan.adopt).toMatchObject([{ table: 'supplies', rowId: 'ing-1' }]);
    expect(plan.conflicts).toEqual([]);
  });

  it('sin base, contenido idéntico NO es un conflicto: no se reescribe el catálogo entero', async () => {
    // El caso real: se borraron los datos del sitio, o un dispositivo se estrena contra un destino que
    // ya llevaba huellas. Sin la salida por contenido igual, cada fila sería «cambiaron los dos lados»
    // y el catálogo entero se reescribiría para dejarlo idéntico.
    const filas = [insumo('ing-1'), insumo('ing-2'), insumo('ing-3')];

    const plan = await run({
      snapshot: snapshotOf(
        remoteTable(
          INSUMOS,
          await Promise.all(
            filas.map(async (fila) =>
              cellsOf(INSUMOS, fila, {
                huella: await fingerprintFor(INSUMOS, fila),
                version: RowVersion.of(AHORA - 10_000, 0, 'otro').toString(),
              }),
            ),
          ),
        ),
      ),
      local: localOf({ supplies: filas }),
      shadow: [],
    });

    expect(plan.conflicts).toEqual([]);
    expect(plan.apply).toEqual([]);
    expect(plan.push).toEqual([]);
    expect(plan.adopt).toHaveLength(3);
  });
});
