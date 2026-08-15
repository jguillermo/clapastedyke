import { RemoteRow, RemoteTable } from '../../../domain/repositories/remote.repository';
import { reconcile } from '../../../domain/services/engine/reconcile';
import { ShadowRow } from '../../../domain/services/sync-shadow';
import { fingerprintOf } from '../../../infrastructure/sheet-hash';
import { translateTable } from '../../../infrastructure/sheets/remote-registros';
import { flatten } from '../../../infrastructure/sheets/row-shape';
import { canonicalCells, shapeOf } from '../../../infrastructure/sheets/table-columns';

/**
 * El adaptador: lo que convierte «una pestaña que una persona puede editar» en las dos listas que el
 * motor sabe reconciliar.
 *
 * Aquí viven, re-alojados, los casos que antes probaba el motor específico de Sheets — porque son
 * **suyos**, no del motor genérico: una edición a mano, una fila tecleada sin id, un id cambiado, una
 * fila borrada de la hoja. El motor no sabe qué es ninguna de esas cosas; solo ve registros con
 * huella, borrado y versión, y decide.
 *
 * Cada caso se comprueba de punta a punta —traducir y **decidir**— porque lo que importa no es qué
 * versión se le pone a un registro, sino quién acaba ganando.
 */
describe('la traducción de una pestaña', () => {
  const AHORA = 1_800_000_000_000;
  /** Las columnas que tiene la pestaña de insumos una vez escrita. */
  const COLUMNAS = [
    'id',
    'name',
    'baseUnit',
    'purchasePrice.amount',
    'purchasePrice.per.value',
    'purchasePrice.per.unit',
    'purchasePrice.currency',
    'updatedAt',
  ];
  const TABLE = 'ingredients';
  const DEVICE = 'dev00001';

  /** Un insumo tal cual vive en IndexedDB, con su precio anidado. */
  function insumo(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
    return {
      id: 'ing-harina',
      name: 'Harina',
      baseUnit: 'g',
      purchasePrice: { amount: 4.5, per: { value: 1000, unit: 'g' }, currency: 'PEN' },
      updatedAt: new Date(AHORA - 60_000).toISOString(),
      ...overrides,
    };
  }

  /** La huella que la app habría escrito para esa fila: lo que hace creíble «esto lo escribí yo». */
  async function huellaDe(
    rows: readonly Record<string, unknown>[],
    row: Record<string, unknown>,
  ): Promise<string> {
    const shape = shapeOf([], rows.map(flatten), []);
    const canonical = canonicalCells(shape, flatten(row));
    return 'values' in canonical ? fingerprintOf(canonical.values) : '';
  }

  function tabla(rows: readonly RemoteRow[], columns: readonly string[]): RemoteTable {
    return {
      table: TABLE,
      present: true,
      columns: [...columns],
      rows,
      unreadable: [],
      raw: rows.map((row) => ({
        id: String(row.values['id'] ?? ''),
        cells: Object.fromEntries(
          Object.entries(flatten(row.values)).map(([key, value]) => [key, String(value)]),
        ),
      })),
    };
  }

  function fila(values: Record<string, unknown>, meta: Partial<RemoteRow['meta']>): RemoteRow {
    return {
      index: 2,
      values,
      meta: { version: '', origin: 'otro', fingerprint: '', deleted: false, ...meta },
    };
  }

  function recordado(values: Record<string, unknown>, fingerprint: string): ShadowRow {
    return {
      table: TABLE,
      rowId: String(values['id']),
      fingerprint,
      version: '0000000000500-0000-otro',
      deleted: false,
      // El shadow guarda los valores **planos**: es la forma con la que el motor compara campo a campo.
      values: flatten(values),
    };
  }

  async function decidir(input: {
    remote: RemoteTable;
    local: readonly Record<string, unknown>[];
    shadow?: readonly ShadowRow[];
  }) {
    const translated = await translateTable({
      remote: input.remote,
      local: input.local as never,
      shadow: input.shadow ?? [],
      now: AHORA,
      deviceId: DEVICE,
      newIdentity: () => 'id-nuevo',
    });
    return {
      translated,
      plan: reconcile({
        base: translated.base,
        data: translated.data,
        now: AHORA,
        originId: DEVICE,
      }),
    };
  }

  /**
   * **La edición a mano gana**, y es lo que convierte la hoja en la fuente de la verdad.
   *
   * La app escribe siempre el contenido y su huella **juntos**, así que si al recalcularla no cuadra,
   * esa fila la tocó una persona. Y una persona que corrige un precio no actualiza la columna de
   * versión: sin esta detección, la resolución por versión pisaría su corrección sin dejar rastro.
   */
  it('una celda editada a mano gana, aunque su versión sea vieja', async () => {
    const local = insumo();
    const huella = await huellaDe([local], local);
    const editada = { ...local, name: 'Harina E2E' };

    const { plan } = await decidir({
      // La huella escrita es la del contenido ANTERIOR: es la discrepancia lo que delata la edición.
      remote: tabla(
        [fila(editada, { version: '0000000000500-0000-otro', fingerprint: huella })],
        COLUMNAS,
      ),
      local: [local],
    });

    expect(plan.push).toEqual([]);
    expect(plan.pull).toHaveLength(1);
    expect(plan.pull[0]['name']).toBe('Harina E2E');
  });

  /**
   * Una fila que la app escribió y **nadie ha tocado** no mueve nada: misma huella en los dos lados.
   *
   * Es el caso más frecuente con diferencia —todos los ciclos de una app que ya convergió— y el que
   * revienta más caro si falla: si la huella local y la remota no coincidieran, cada ciclo vería una
   * edición a mano donde no la hay y la hoja se reescribiría sola para siempre.
   */
  it('una fila intacta no mueve nada', async () => {
    const local = insumo();
    const huella = await huellaDe([local], local);

    const { plan } = await decidir({
      remote: tabla(
        [fila(local, { version: '0000000000500-0000-otro', fingerprint: huella })],
        COLUMNAS,
      ),
      local: [local],
    });

    expect(plan.push).toEqual([]);
    expect(plan.pull).toEqual([]);
    expect(plan.conflicts).toEqual([]);
  });

  /**
   * **Huella vacía = adoptar**, no «editada a mano».
   *
   * Una fila sin huella es una fila que este motor nunca escribió: o la hoja es de antes de que
   * existiera la columna, o la acaba de teclear alguien. Si contara como edición manual, el primer
   * ciclo contra una hoja que ya existía les pondría versión nueva a **todas** las filas a la vez y el
   * catálogo entero colisionaría, resolviéndose por desempate de dispositivo — o sea, al azar.
   */
  it('una fila sin huella se adopta en vez de contar como edición a mano', async () => {
    const local = insumo();

    const { plan } = await decidir({
      remote: tabla(
        [fila(local, { version: '0000000000500-0000-otro', fingerprint: '' })],
        COLUMNAS,
      ),
      local: [local],
    });

    // Mismo contenido en los dos lados: adoptarla no genera ni conflicto ni escritura.
    expect(plan.push).toEqual([]);
    expect(plan.pull).toEqual([]);
  });

  /**
   * Una fila que alguien tecleó **sin id** se adopta: se le da identidad, se importa, y se le estampan
   * el id, la huella y la versión **en su propia fila**.
   *
   * Sin ese estampado de vuelta, el ciclo siguiente volvería a verla sin id y le inventaría otra
   * identidad: un agregado nuevo cada dos minutos, para siempre.
   */
  it('una fila tecleada sin id recibe identidad y hay que estamparla', async () => {
    const aMano = { name: 'Cardamomo', baseUnit: 'g' };

    const { translated, plan } = await decidir({
      remote: tabla([fila(aMano, {})], ['id', 'name', 'baseUnit']),
      local: [],
    });

    expect(translated.handAdds).toEqual([
      {
        index: 2,
        id: 'id-nuevo',
        fingerprint: expect.any(String) as unknown as string,
        version: expect.any(String) as unknown as string,
      },
    ]);
    expect(translated.handAdds[0].fingerprint).not.toBe('');
    // Y entra como cualquier fila que solo está allí: se trae.
    expect(plan.pull).toHaveLength(1);
    expect(plan.pull[0]['id']).toBe('id-nuevo');
  });

  /**
   * Un id cambiado a mano **se devuelve a su sitio**.
   *
   * Es el desenlace más silencioso de todos si no se corrige: el id viejo desaparece (se daría por
   * borrado el agregado), el nuevo parece un alta, y todo lo que apuntaba al viejo queda colgando
   * mientras la hoja parece perfecta. Se reconoce comparando el contenido **sin su id**, que es lo
   * único que sobrevive al cambio.
   */
  it('un id cambiado a mano se reconoce por el resto de la fila y se devuelve', async () => {
    const local = insumo();
    const conOtroId = { ...local, id: 'id-cambiado-a-mano' };

    const { translated } = await decidir({
      remote: tabla([fila(conOtroId, { version: '0000000000500-0000-otro' })], COLUMNAS),
      local: [local],
    });

    expect(translated.reids).toEqual([
      { index: 2, id: 'ing-harina', previous: 'id-cambiado-a-mano' },
    ]);
  });

  /**
   * Una fila que **estaba y ya no está** es un borrado a mano, y el destino manda.
   *
   * El motor no deduce un borrado de una ausencia —y hace bien, porque «no está» también significa
   * «nunca llegó a este dispositivo»—, así que la lápida la sintetiza el adaptador, que es el único
   * que sabe lo que había antes. Sin esto, la fila se volvería a subir en el ciclo siguiente y el
   * borrado no se aplicaría nunca.
   */
  it('una fila que el shadow recordaba y ya no está en la hoja se borra aquí', async () => {
    const local = insumo();
    const huella = await huellaDe([local], local);

    const { translated, plan } = await decidir({
      remote: tabla([], COLUMNAS),
      local: [local],
      shadow: [recordado(local, huella)],
    });

    expect(translated.handDeletes).toBe(1);
    expect(plan.push).toEqual([]);
    expect(plan.pull).toHaveLength(1);
    expect(plan.pull[0].sync.deleted).toBe(true);
  });

  /**
   * El ancestro que guarda el shadow es lo que permite **fusionar campos no solapados**: el destino
   * cambió el precio, aquí se cambió el nombre, y sobreviven los dos.
   *
   * Es la capacidad que el motor anterior no tenía: allí ganaba un lado entero y el otro cambio se
   * perdía en silencio.
   */
  it('con ancestro, un cambio de cada lado en campos distintos se fusiona', async () => {
    const acordado = insumo();
    const huella = await huellaDe([acordado], acordado);

    const local = {
      ...acordado,
      name: 'Harina especial',
      updatedAt: new Date(AHORA - 1_000).toISOString(),
    };
    const enLaHoja = {
      ...acordado,
      purchasePrice: { ...(acordado['purchasePrice'] as object), amount: 5.25 },
    };

    const { plan } = await decidir({
      remote: tabla(
        [fila(enLaHoja, { version: '0000000000500-0000-otro', fingerprint: huella })],
        COLUMNAS,
      ),
      local: [local],
      shadow: [recordado(acordado, huella)],
    });

    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0].winner).toBe('merged');
    // Los registros que ve el motor llevan las celdas **planas**, así que `purchasePrice.amount` es un
    // campo por su cuenta: por eso dos dispositivos que tocan partes distintas del mismo precio se
    // pueden fusionar en vez de chocar. Al guardarlo aquí se vuelve a armar el objeto.
    const fusionado = plan.push[0];
    expect(fusionado['name']).toBe('Harina especial');
    expect(fusionado['purchasePrice.amount']).toBe(5.25);
  });
});
