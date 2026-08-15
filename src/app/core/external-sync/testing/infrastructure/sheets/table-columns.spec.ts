import {
  canonicalCells,
  ID_COLUMN,
  SERVICE_COLUMNS,
  shapeOf,
} from '../../../infrastructure/sheets/table-columns';

/**
 * Misma excepción de ubicación y misma razón que `row-shape.spec.ts` (ver su cabecera): lo que se
 * comprueba aquí —que la misma columna se canonice siempre igual— no se puede observar desde un E2E,
 * porque los dos lados del test atraviesan este código en el mismo proceso y coinciden por accidente.
 *
 * Las dos reglas que este fichero fija, y lo que cuesta romperlas:
 *
 * 1. **El orden de columnas es estable.** Reordenarlo porque hoy se han leído las filas en otro orden
 *    reescribiría la hoja entera cada ciclo y movería de sitio columnas que alguien está mirando.
 * 2. **La clase de una columna se decide una vez por ciclo.** Decidirla por fila haría que la misma
 *    columna se canonizara de dos maneras dentro del mismo ciclo, que es exactamente cómo se fabrica
 *    una huella que no coincide consigo misma.
 */
describe('las columnas de una pestaña', () => {
  /**
   * De dónde sale cada columna y en qué orden queda. Los tres orígenes en el mismo caso:
   * - lo que ya está en la hoja manda y **conserva su posición**, aunque hoy ninguna fila lo traiga
   *   (`obsoleta`): borrar una columna de la hoja de alguien no es una decisión de este código;
   * - lo que aparece en las filas locales y no estaba se añade **al final**;
   * - lo que solo existe en la hoja (`solo-remota`) cuenta igual: es un campo que otro dispositivo ya
   *   escribe y este todavía no.
   *
   * Las nuevas van ordenadas alfabéticamente para que dos dispositivos que descubran los mismos campos
   * a la vez los pongan en el mismo sitio; si no, cada uno reordenaría la hoja del otro.
   */
  it('respeta las columnas que ya están y añade las nuevas al final, ordenadas', () => {
    const shape = shapeOf(
      ['id', 'name', 'obsoleta', ...SERVICE_COLUMNS],
      [{ id: 'x', name: 'Harina', zeta: 1, alfa: 2 }],
      [{ id: 'y', 'solo-remota': 'sí' }],
    );

    expect(shape.columns).toEqual(['id', 'name', 'obsoleta', 'alfa', 'solo-remota', 'zeta']);
    // Las de servicio van siempre al final, y nunca se cuelan entre las de datos.
    expect(shape.headers).toEqual([...shape.columns, ...SERVICE_COLUMNS]);
  });

  /**
   * En una pestaña que no existía todavía **todo** es nuevo, así que el orden lo decide entero esta
   * regla: el `id` primero y el resto alfabético. Sin la excepción del `id`, una tabla recién creada
   * abriría por `activo` y el identificador quedaría en medio — una pestaña que no se puede leer de un
   * vistazo. La excepción es solo para columnas nuevas: una hoja que ya tenga el `id` en medio se queda
   * como está (lo fija el caso anterior con `obsoleta`).
   */
  it('en una pestaña nueva el id va primero y el resto alfabético', () => {
    const shape = shapeOf([], [{ zeta: 1, id: 'x', activo: true, name: 'Harina' }], []);

    expect(shape.columns).toEqual(['id', 'activo', 'name', 'zeta']);
  });

  /**
   * La clase de cada columna, con las cuatro reglas a la vez:
   * - `id` es siempre `code`, se compare con lo que se compare: la identidad no distingue mayúsculas,
   *   porque quien teclea `ING-1` se está refiriendo a `ing-1`;
   * - un número local hace la columna `number`, y entonces `2.5` y `'2.5'` son el mismo valor —que es
   *   lo único que hace posible que una fila sobreviva a un viaje por una celda;
   * - un booleano la hace `flag`;
   * - una lista (`[]`) se compara como texto: su JSON ya viene con las claves ordenadas.
   *
   * Y la regla de dónde se mira: **primero lo local**, que es el dato con su tipo de verdad. Lo remoto
   * solo decide en una columna que aquí todavía no existe (`solo-remota`), donde lo único que hay es
   * lo que devolvió la hoja.
   */
  it('la clase la decide el primer valor local, y lo remoto solo donde no hay local', () => {
    const shape = shapeOf(
      [],
      [{ id: 'ING-1', precio: 4.5, activo: true, name: 'Harina', 'lines[]': '[]' }],
      [{ id: 'x', 'solo-remota': 1000 }],
    );

    expect(shape.kinds).toEqual({
      id: 'code',
      precio: 'number',
      activo: 'flag',
      name: 'text',
      'lines[]': 'text',
      'solo-remota': 'number',
    });
  });

  /**
   * Una columna cuyos primeros valores están vacíos no puede clasificarse por ellos: si el primer
   * registro no trae precio, mirar ese hueco daría `text` y el siguiente ciclo —con un registro que sí
   * lo trae— daría `number`. La misma columna canonizada de dos formas en dos ciclos es la hoja
   * reescribiéndose sola.
   *
   * Se salta lo vacío hasta encontrar un valor de verdad.
   */
  it('se salta los huecos para clasificar, en vez de dejarse engañar por el primero', () => {
    const shape = shapeOf(
      [],
      [{ id: 'a' }, { id: 'b', precio: null }, { id: 'c', precio: '' }, { id: 'd', precio: 4.5 }],
      [],
    );

    expect(shape.kinds['precio']).toBe('number');
  });

  /**
   * Lo canónico de una fila: el orden de las columnas, la equivalencia entre lo que manda la app y lo
   * que devuelve la hoja, y qué se hace con lo que falta.
   *
   * Las dos filas de este caso son **el mismo dato** visto desde los dos lados —la app manda un número
   * y un id en minúsculas; la hoja devuelve el texto que alguien tecleó, con su coma decimal y sus
   * mayúsculas— y tienen que dar exactamente los mismos valores canónicos. Si no, esa fila parecería
   * editada a mano en cada ciclo.
   */
  it('la fila local y la misma fila leída de la hoja dan los mismos valores canónicos', () => {
    const shape = shapeOf([], [{ id: 'ing-1', precio: 4.5, name: 'Harina', activo: true }], []);

    const desdeLaApp = canonicalCells(shape, {
      id: 'ing-1',
      precio: 4.5,
      name: 'Harina',
      activo: true,
    });
    const desdeLaHoja = canonicalCells(shape, {
      id: 'ING-1',
      precio: '4,50',
      name: '  Harina  ',
      activo: 'TRUE',
    });

    // El orden es el de `shape.columns`: id primero, luego alfabético.
    expect(shape.columns).toEqual(['id', 'activo', 'name', 'precio']);
    expect(desdeLaApp).toEqual({ values: ['ing-1', 'TRUE', 'Harina', '4.5'] });
    expect(desdeLaHoja).toEqual(desdeLaApp);
  });

  /**
   * Un campo ausente y una celda en blanco son lo mismo —cadena vacía— y no bloquean nada. Lo que sí
   * bloquea esa fila es una celda que **promete un número y no lo es**: se contesta cuál es la columna
   * culpable y quien pregunta la pone en cuarentena, en vez de lanzar y matar el ciclo entero por una
   * celda que alguien tecleó mal (que, como seguiría en la hoja, lo mataría para siempre).
   */
  it('un hueco vale cadena vacía; un número ilegible se reporta sin lanzar', () => {
    const shape = shapeOf([], [{ id: 'a', precio: 4.5, nota: 'x' }], []);

    expect(canonicalCells(shape, { id: 'a' })).toEqual({ values: ['a', '', ''] });

    expect(() => canonicalCells(shape, { id: 'a', precio: 'dos con cincuenta' })).not.toThrow();
    expect(canonicalCells(shape, { id: 'a', precio: 'dos con cincuenta' })).toEqual({
      unreadable: { column: 'precio', value: 'dos con cincuenta' },
    });
  });

  /**
   * Las columnas de servicio **no entran nunca** en lo canónico, ni aunque lleguen en la fila. Es la
   * condición para que la huella exista: si la huella incluyera la celda `huella`, escribirla la
   * cambiaría, y una fila cuya huella cambia al escribir su propia huella no converge jamás.
   */
  it('las columnas de servicio quedan fuera de las columnas y de lo canónico', () => {
    const shape = shapeOf(
      ['id', ...SERVICE_COLUMNS],
      [{ id: 'a', huella: 'abc', version: '1-0-x', borrado: 'TRUE', origen: 'dev' }],
      [],
    );

    expect(shape.columns).toEqual([ID_COLUMN]);
    expect(canonicalCells(shape, { id: 'a', huella: 'abc', borrado: 'TRUE' })).toEqual({
      values: ['a'],
    });
  });
});
