import {
  MAX_CELLS_PER_REQUEST,
  SheetWriteBatch,
} from '../../../infrastructure/sheets/sheet-write-batch';

/**
 * Misma excepción de ubicación que sus vecinos (ver `row-shape.spec.ts`): es una pieza pura, sin red y
 * sin inyección, y lo que garantiza no se ve desde fuera.
 *
 * Lo que se prueba son los **tres problemas** que justifican que el lote sea una pieza con nombre en
 * vez de un array de rangos:
 *
 * 1. **Ningún par de rangos toca la misma celda.** Dos rangos solapados en la misma petición dependen
 *    del orden en que Google los aplique: a veces gana uno, a veces el otro.
 * 2. **Lo que no cabe se trocea sin partir una fila.** Media fila escrita es una fila corrupta.
 * 3. **Una fila se estampa sin moverla de sitio.** La puso ahí una persona.
 */
describe('el lote de escritura de la hoja', () => {
  const HEADERS = ['id', 'name', 'precio', 'version', 'origen', 'huella', 'borrado'];

  /**
   * El caso normal: una pestaña entera en **un solo rango**, cabecera incluida.
   *
   * Va la cabecera en la misma escritura que los datos a propósito: si se escribieran por separado y
   * el proceso muriera en medio, quedarían columnas nuevas sin rotular o rótulos sobre datos que aún no
   * están.
   */
  it('una pestaña entera sale en un rango, con su cabecera', () => {
    const batch = new SheetWriteBatch();
    batch.block('Insumos', HEADERS, [
      ['ing-1', 'Harina', '4.5', '1-0-dev', 'dev', 'abc', ''],
      ['ing-2', 'Azúcar', '3', '2-0-dev', 'dev', 'def', ''],
    ]);

    expect(batch.requests().values).toEqual([
      [
        {
          range: "'Insumos'!A1:G3",
          values: [
            HEADERS,
            ['ing-1', 'Harina', '4.5', '1-0-dev', 'dev', 'abc', ''],
            ['ing-2', 'Azúcar', '3', '2-0-dev', 'dev', 'def', ''],
          ],
        },
      ],
    ]);
  });

  /**
   * **El solapamiento**, que es la razón de ser de esta pieza.
   *
   * Estampar el id de una fila que además está dentro de un bloque que se reescribe son dos escrituras
   * sobre la misma celda. El lote aplica el estampado **sobre el bloque en memoria** y emite un solo
   * rango: no queda ninguna carrera contra el orden de aplicación de Google.
   *
   * La fila 3 del ejemplo es la que alguien tecleó a mano sin id: se le pone el id, la huella y la
   * versión, y sale ya dentro del bloque.
   */
  it('un estampado dentro del bloque se funde con él, no se manda aparte', () => {
    const batch = new SheetWriteBatch();
    batch.block('Insumos', HEADERS, [
      ['ing-1', 'Harina', '4.5', '1-0-dev', 'dev', 'abc', ''],
      ['', 'Manteca', '9', '', '', '', ''],
    ]);
    batch.cells('Insumos', HEADERS, 3, { id: 'ing-nuevo', huella: 'zzz', version: '9-0-dev' });

    const [peticion] = batch.requests().values;
    expect(peticion).toHaveLength(1);
    expect(peticion[0].values[2]).toEqual(['ing-nuevo', 'Manteca', '9', '9-0-dev', '', 'zzz', '']);
  });

  /**
   * Un estampado **fuera** del bloque —o en una pestaña que este ciclo no reescribe— sí sale por su
   * cuenta, y cada celda en su propio rango.
   *
   * Cada una en su rango y no un tramo continuo porque las columnas que se estampan no tienen por qué
   * ser contiguas: un rango que las abarcara todas escribiría también las de en medio, que son del
   * usuario y nadie ha pedido tocar.
   */
  it('un estampado sin bloque sale celda a celda, sin pisar las columnas de en medio', () => {
    const batch = new SheetWriteBatch();
    batch.cells('Insumos', HEADERS, 7, { id: 'ing-9', huella: 'zzz' });

    expect(batch.requests().values).toEqual([
      [
        { range: "'Insumos'!A7", values: [['ing-9']] },
        { range: "'Insumos'!F7", values: [['zzz']] },
      ],
    ]);
  });

  /**
   * Una columna que la pestaña no tiene no se escribe en ningún sitio. La alternativa —inventarle una
   * posición— escribiría encima de la columna de al lado, que sí es de alguien.
   *
   * Y no queda una petición vacía: si al final no hay ningún rango, no hay nada que mandar. Una
   * petición que no escribe nada cuesta lo mismo en la cuota que una que sí.
   */
  it('estampar una columna que no existe no escribe nada, ni una petición vacía', () => {
    const batch = new SheetWriteBatch();
    batch.cells('Insumos', HEADERS, 7, { inventada: 'x' });

    expect(batch.requests().values).toEqual([]);
  });

  /**
   * **El troceo**: lo que no cabe en una petición se parte, y se parte **por filas**. Cada trozo es un
   * rango contiguo que se puede escribir por su cuenta, y ninguna fila queda a medias.
   *
   * Los rangos que salen tienen que encadenar sin huecos ni solapes: la última fila de un trozo y la
   * primera del siguiente son consecutivas. Un hueco dejaría filas sin escribir; un solape, dos
   * escrituras sobre la misma fila.
   */
  it('un bloque que no cabe se parte por filas, sin huecos ni solapes', () => {
    const columnas = 10;
    const headers = Array.from({ length: columnas }, (_, i) => `c${i}`);
    const filasPorPeticion = Math.floor(MAX_CELLS_PER_REQUEST / columnas);
    const total = filasPorPeticion + 5;

    const batch = new SheetWriteBatch();
    batch.block(
      'Grande',
      headers,
      Array.from({ length: total }, (_, fila) => headers.map((_c, i) => `${fila}-${i}`)),
    );

    const peticiones = batch.requests().values;
    expect(peticiones.length).toBeGreaterThan(1);

    const filasEscritas = peticiones.flat().reduce((suma, rango) => suma + rango.values.length, 0);
    // +1 por la cabecera, que va dentro del bloque.
    expect(filasEscritas).toBe(total + 1);
    expect(peticiones.flat()[0].range).toBe(`'Grande'!A1:J${filasPorPeticion}`);
    expect(peticiones.flat()[1].range).toBe(`'Grande'!A${filasPorPeticion + 1}:J${total + 1}`);
  });

  /**
   * Borrar filas se ordena **descendente**, y no es un detalle de estilo: borrar una fila desplaza
   * hacia arriba a todas las de abajo. De arriba abajo, el segundo borrado caería una fila más allá de
   * donde se creía — y borraría la de un vecino.
   */
  it('las filas se borran de abajo arriba', () => {
    const batch = new SheetWriteBatch();
    batch.dropRows(42, [5, 9, 7]);

    expect(batch.requests().structural).toEqual([
      {
        deleteDimension: { range: { sheetId: 42, dimension: 'ROWS', startIndex: 8, endIndex: 9 } },
      },
      {
        deleteDimension: { range: { sheetId: 42, dimension: 'ROWS', startIndex: 6, endIndex: 7 } },
      },
      {
        deleteDimension: { range: { sheetId: 42, dimension: 'ROWS', startIndex: 4, endIndex: 5 } },
      },
    ]);
  });

  /**
   * Cuando la pestaña encoge, las filas que sobran hay que **limpiarlas**: escribir un bloque más corto
   * deja intacto lo que había debajo, y esas filas fantasma volverían a leerse el ciclo siguiente como
   * si fueran datos.
   *
   * Se limpia desde la fila 2 como mínimo: la 1 es la cabecera y borrarla dejaría la pestaña ilegible.
   */
  it('la cola que sobra se limpia, y nunca la cabecera', () => {
    const batch = new SheetWriteBatch();
    batch.block('Insumos', HEADERS, [['ing-1', 'Harina', '4.5', '', '', '', '']]);
    batch.clearFrom('Insumos', HEADERS, 3);

    expect(batch.requests().clears).toEqual(["'Insumos'!A3:G"]);

    const alRas = new SheetWriteBatch();
    alRas.clearFrom('Insumos', HEADERS, 1);
    expect(alRas.requests().clears).toEqual(["'Insumos'!A2:G"]);
  });

  /** Un lote vacío no manda nada: pedirle a Google que no haga nada cuesta una petición igual. */
  it('un lote sin nada que escribir no produce ninguna petición', () => {
    const batch = new SheetWriteBatch();

    expect(batch.isEmpty).toBe(true);
    expect(batch.requests()).toEqual({ structural: [], values: [], clears: [] });
  });
});
