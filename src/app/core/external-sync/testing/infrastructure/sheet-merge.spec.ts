import { mergeByKey, replaceByParent, toRow } from '../../infrastructure/sheet-merge';
import { SheetTable } from '../../infrastructure/sheet-schema';

/**
 * La fusión es lo único de la integración que puede **corromper datos en silencio**: una fila que
 * pisa a la que no era, una que desaparece, una que se queda huérfana. Antes vivía dentro de un Apps
 * Script que no se podía probar sin desplegarlo; ahora son funciones puras y se prueban aquí.
 */
const SUPPLIES: SheetTable = {
  name: 'supplies',
  title: 'Insumos',
  key: 'id',
  fields: ['id', 'name', 'price'],
  headers: ['id', 'Nombre', 'Precio'],
};

const LINES: SheetTable = {
  name: 'recipeLines',
  title: 'RecetaInsumos',
  parentKey: 'recipeId',
  fields: ['recipeId', 'supplyId', 'quantity'],
  headers: ['recetaId', 'insumoId', 'Cantidad'],
};

describe('toRow', () => {
  it('ordena los campos como las columnas de su tabla', () => {
    expect(toRow(SUPPLIES, { price: 4.5, id: 'S-1', name: 'Harina' })).toEqual([
      'S-1',
      'Harina',
      '4.5',
    ]);
  });

  it('un campo ausente o nulo deja la celda vacía, no la palabra «undefined»', () => {
    expect(toRow(SUPPLIES, { id: 'S-1', name: null })).toEqual(['S-1', '', '']);
  });
});

describe('mergeByKey', () => {
  it('lo que llega pisa a la fila con su mismo id, en su sitio', () => {
    const existing = [
      ['S-1', 'Harina', '4.5'],
      ['S-2', 'Azúcar', '3.0'],
    ];

    const merged = mergeByKey(SUPPLIES, existing, [['S-1', 'Harina de trigo', '5.0']]);

    expect(merged).toEqual([
      ['S-1', 'Harina de trigo', '5.0'],
      ['S-2', 'Azúcar', '3.0'],
    ]);
  });

  it('lo que no estaba se añade al final', () => {
    const merged = mergeByKey(SUPPLIES, [['S-1', 'Harina', '4.5']], [['S-9', 'Cacao', '9.0']]);

    expect(merged.map((row) => row[0])).toEqual(['S-1', 'S-9']);
  });

  it('un envío parcial NO borra lo que no venía en él', () => {
    const existing = [
      ['S-1', 'Harina', '4.5'],
      ['S-2', 'Azúcar', '3.0'],
    ];

    const merged = mergeByKey(SUPPLIES, existing, [['S-2', 'Azúcar rubia', '3.5']]);

    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual(['S-1', 'Harina', '4.5']);
  });

  it('repetir el mismo lote deja la hoja igual: es lo que la hace idempotente', () => {
    const incoming = [['S-1', 'Harina', '4.5']];

    const once = mergeByKey(SUPPLIES, [], incoming);
    const twice = mergeByKey(SUPPLIES, once, incoming);

    expect(twice).toEqual(once);
  });

  it('una fila sin id se conserva TAL CUAL y en su sitio: la escribió una persona', () => {
    /*
     * Antes se descartaba, y era una pérdida de datos silenciosa: una fila con contenido y sin id la
     * acaba de teclear alguien en su hoja, y el motor la adopta —le da id y la importa— en el ciclo en
     * que la ve. Pero cualquier envío a esa pestaña ocurrido entremedias se la llevaba por delante, sin
     * aviso y sin rastro.
     */
    const aMano = ['', 'Manteca a mano', '9.9'];
    const merged = mergeByKey(
      SUPPLIES,
      [aMano, ['S-1', 'Harina', '4']],
      [['S-1', 'Harina', '4.5']],
    );

    expect(merged).toEqual([aMano, ['S-1', 'Harina', '4.5']]);
  });

  it('un id que se llame como una propiedad de Object no confunde la búsqueda', () => {
    const merged = mergeByKey(SUPPLIES, [], [['constructor', 'Raro', '1']]);

    expect(merged).toEqual([['constructor', 'Raro', '1']]);
  });
});

describe('replaceByParent', () => {
  it('las líneas de la receta que llega se reemplazan enteras', () => {
    const existing = [
      ['R-1', 'S-1', '100'],
      ['R-1', 'S-2', '200'],
      ['R-2', 'S-3', '300'],
    ];

    const merged = replaceByParent(LINES, existing, [['R-1', 'S-9', '500']]);

    expect(merged).toEqual([
      ['R-2', 'S-3', '300'],
      ['R-1', 'S-9', '500'],
    ]);
  });

  it('quitar un insumo de una receta lo quita de la hoja', () => {
    const existing = [
      ['R-1', 'S-1', '100'],
      ['R-1', 'S-2', '200'],
    ];

    const merged = replaceByParent(LINES, existing, [['R-1', 'S-1', '100']]);

    expect(merged).toEqual([['R-1', 'S-1', '100']]);
  });

  it('no toca las líneas de las recetas que no vienen en el lote', () => {
    const existing = [['R-2', 'S-3', '300']];

    const merged = replaceByParent(LINES, existing, [['R-1', 'S-1', '100']]);

    expect(merged).toHaveLength(2);
  });

  it('repetir el mismo lote deja la hoja igual', () => {
    const incoming = [['R-1', 'S-1', '100']];

    const once = replaceByParent(LINES, [], incoming);
    const twice = replaceByParent(LINES, once, incoming);

    expect(twice).toEqual(once);
  });
});
