import { ARRAY_SUFFIX, Cells, flatten, rebuild } from '../../../infrastructure/sheets/row-shape';

/**
 * Este spec existe **a pesar** de la regla de que `infrastructure/` no lleva tests unitarios
 * ([unit-tests-conventions.md](../../../../../../../.claude/rules/unit-tests-conventions.md)), por la
 * misma razón por la que existen sus vecinos `sheet-canonical.spec.ts` y `sheet-hash.spec.ts`: lo que
 * comprueba **no se puede observar desde fuera**.
 *
 * Un fallo aquí no rompe nada visible. Produce una hoja que se reescribe sola cada dos minutos,
 * semanas después, en el dispositivo de otra persona. Desde un E2E se ve «todo al día» porque los dos
 * lados del test atraviesan este mismo código en el mismo proceso y coinciden por accidente. La única
 * forma de cazarlo es exigir aquí, explícitamente, que la ida y la vuelta den lo mismo.
 *
 * ## Qué se prueba
 *
 * **Ida y vuelta hasta el punto fijo**: `flatten` → `rebuild` → `flatten` tiene que dar exactamente las
 * mismas celdas. No basta con comparar el registro reconstruido contra el original —hay diferencias
 * legítimas, como un `null` que desaparece—; lo que tiene que ser estable es **lo que se escribe**,
 * porque es sobre eso sobre lo que se calcula la huella.
 *
 * Los registros de los tests son los de verdad: la forma exacta de los cinco stores que se replican
 * (`ingredients`, `recipes`, `recipe_categories`, `flavors`, `conversion_options`), con sus objetos
 * anidados y su lista de líneas, escritos literales para que se vea entero lo que se está probando.
 */
describe('la forma de una fila en la hoja', () => {
  /** Los cinco stores que se replican, con la forma real de sus documentos. */
  const REGISTROS: Readonly<Record<string, Record<string, unknown>>> = {
    ingredients: {
      id: 'ing-harina',
      name: 'Harina sin preparar',
      baseUnit: 'g',
      usage: 'recipe',
      purchasePrice: {
        amount: 4.5,
        per: { value: 1000, unit: 'g' },
        currency: 'PEN',
      },
      updatedAt: '2026-08-14T10:00:00.000Z',
    },
    recipes: {
      id: 'rec-bizcocho-vainilla',
      categoryId: 'sys-queques',
      name: 'Bizcocho de vainilla',
      flavorId: 'flv-vainilla',
      portionsCapacityId: 'co-portions-10',
      lines: [
        { ingredientId: 'ing-harina', quantity: { value: 250, unit: 'g' } },
        { ingredientId: 'ing-azucar', quantity: { value: 180, unit: 'g' } },
      ],
      updatedAt: '2026-08-14T10:00:00.000Z',
    },
    recipe_categories: { id: 'sys-queques', name: 'Queques' },
    flavors: { id: 'flv-vainilla', label: 'Vainilla' },
    conversion_options: { id: 'co-portions-10', group: 'portions', label: '10', factor: 10 },
  };

  /**
   * El invariante que sostiene toda la sincronización: **lo que se escribe no puede cambiar solo**.
   *
   * Se llega hasta el punto fijo (bajar, armar, volver a bajar) en los cinco stores a la vez. Si
   * alguna forma no fuera reversible —el precio anidado, la lista de líneas, un número— las celdas de
   * la segunda pasada saldrían distintas de las de la primera, y eso en producción es la hoja
   * reescribiéndose sola para siempre.
   */
  it('bajar, volver a armar y bajar otra vez da exactamente las mismas celdas', () => {
    for (const [tabla, registro] of Object.entries(REGISTROS)) {
      const primera = flatten(registro);
      const armado = rebuild(primera);

      expect(armado, `${tabla}: no se pudo armar`).toEqual({
        values: expect.anything() as unknown,
      });
      if (!('values' in armado)) {
        continue;
      }
      expect(flatten(armado.values), `${tabla}: la segunda bajada no coincide`).toEqual(primera);
    }
  });

  /**
   * Las tres formas, con la forma completa de las celdas — que es lo que de verdad fija el contrato de
   * la hoja: un objeto se despliega en una columna por hoja del árbol, un array cabe entero en una
   * celda marcada con `[]`, y un primitivo es una celda con el nombre de su campo.
   */
  it('un objeto se despliega en columnas con ruta y un array cabe en una celda marcada', () => {
    expect(flatten(REGISTROS['ingredients'])).toEqual({
      id: 'ing-harina',
      name: 'Harina sin preparar',
      baseUnit: 'g',
      usage: 'recipe',
      'purchasePrice.amount': 4.5,
      'purchasePrice.per.value': 1000,
      'purchasePrice.per.unit': 'g',
      'purchasePrice.currency': 'PEN',
      updatedAt: '2026-08-14T10:00:00.000Z',
    });

    const receta = flatten(REGISTROS['recipes']);
    expect(receta[`lines${ARRAY_SUFFIX}`]).toBe(
      '[{"ingredientId":"ing-harina","quantity":{"unit":"g","value":250}},' +
        '{"ingredientId":"ing-azucar","quantity":{"unit":"g","value":180}}]',
    );
    // La lista va en UNA celda: ninguna columna se llama `lines.0.…`.
    expect(Object.keys(receta).filter((column) => column.startsWith('lines.'))).toEqual([]);
  });

  /**
   * El orden de las claves dentro del JSON de una lista **se normaliza**, y no es cosmética.
   *
   * Un objeto reconstruido al leer la hoja no conserva el orden de inserción del original. Sin
   * ordenar, la misma lista daría dos cadenas distintas —y por tanto dos huellas distintas— según de
   * dónde viniera: la receta parecería editada a mano en cada ciclo. Aquí se comprueba con dos
   * registros que solo difieren en el orden en que se escribieron sus claves.
   */
  it('dos listas iguales escritas en distinto orden de claves dan la misma celda', () => {
    const unaForma = flatten({
      id: 'r1',
      lines: [{ ingredientId: 'ing-1', quantity: { value: 1, unit: 'g' } }],
    });
    const laOtra = flatten({
      id: 'r1',
      lines: [{ quantity: { unit: 'g', value: 1 }, ingredientId: 'ing-1' }],
    });

    expect(unaForma).toEqual(laOtra);
  });

  /**
   * Los valores que rompen una huella en silencio, todos en el mismo ida y vuelta:
   * - un número con la cola binaria de siempre (`0.1 + 0.2`) no se redondea «para que quede bonito»;
   * - `1e21` conserva su notación;
   * - `-0` y `0` son el mismo número y tienen que dar la misma celda;
   * - un texto con acentos pasa **tal cual**: esta capa no normaliza nada (de eso se encarga la
   *   canonización, que es quien compara), y lo que no toca no lo puede estropear;
   * - `false` es un valor, no un hueco;
   * - una lista vacía es una lista, no un campo ausente.
   */
  it('números, unicode, booleanos y listas vacías sobreviven al viaje', () => {
    const registro = {
      id: 'raro',
      suma: 0.1 + 0.2,
      enorme: 1e21,
      cero: -0,
      // «á» compuesta (NFD): la misma letra que la de una sola unidad, escrita con dos.
      nombre: 'Aźucar',
      activo: false,
      lines: [] as unknown[],
    };

    const celdas = flatten(registro);
    expect(celdas['suma']).toBe(0.30000000000000004);
    expect(celdas['enorme']).toBe(1e21);
    expect(Object.is(celdas['cero'], -0) || celdas['cero'] === 0).toBe(true);
    expect(celdas['activo']).toBe(false);
    expect(celdas[`lines${ARRAY_SUFFIX}`]).toBe('[]');

    const armado = rebuild(celdas);
    expect('values' in armado).toBe(true);
    if ('values' in armado) {
      expect(flatten(armado.values)).toEqual(celdas);
    }
  });

  /**
   * Lo que NO produce columna, y la contrapartida aceptada.
   *
   * Una hoja no sabe distinguir «la celda está vacía» de «este campo no existe»: son la misma celda en
   * blanco. Así que se elige la interpretación que no inventa datos —ausente— y se acepta que un campo
   * cuyo valor es la cadena vacía vuelva como ausente. Ningún campo del modelo distingue hoy esas dos
   * cosas, y fingir que sí obligaría a un centinela en la celda que alguien acabaría tecleando.
   */
  it('los campos vacíos no producen columna, ni al bajar ni al subir', () => {
    expect(flatten({ id: 'x', nada: null, tampoco: undefined, si: 'valor' })).toEqual({
      id: 'x',
      si: 'valor',
    });

    const armado = rebuild({ id: 'x', vacia: '', espacios: '   ', si: 'valor' });
    expect(armado).toEqual({ values: { id: 'x', si: 'valor' } });
  });

  /**
   * Una celda de lista que no contiene una lista **no lanza**: se contesta cuál es la columna culpable
   * y quien pregunta pone esa fila en cuarentena. Si lanzara, el ciclo entero moriría por una celda que
   * alguien estropeó — y como la celda seguiría en la hoja, moriría igual para siempre y la
   * convergencia se detendría del todo.
   *
   * Un JSON válido que no sea una lista tampoco vale: la columna promete una lista.
   */
  it('una celda de lista rota se reporta en vez de romper el ciclo', () => {
    expect(() => rebuild({ id: 'x', [`lines${ARRAY_SUFFIX}`]: 'esto no es json' })).not.toThrow();

    expect(rebuild({ id: 'x', [`lines${ARRAY_SUFFIX}`]: 'esto no es json' })).toEqual({
      unreadable: { column: `lines${ARRAY_SUFFIX}`, value: 'esto no es json' },
    });
    expect(rebuild({ id: 'x', [`lines${ARRAY_SUFFIX}`]: '{"no":"es una lista"}' })).toEqual({
      unreadable: { column: `lines${ARRAY_SUFFIX}`, value: '{"no":"es una lista"}' },
    });
  });

  /**
   * Lo que llega de Sheets no siempre es lo que se escribió: con `RAW`, un `'250'` vuelve como el
   * número `250` y un `'TRUE'` como el booleano `true`. La reconstrucción se limita a colocar el valor
   * en su sitio **sin interpretarlo** — quien decide si dos valores son el mismo es la canonización,
   * que ya sabe que `2.5` y `'2.5'` son iguales. Aquí solo se comprueba que la estructura se rehace
   * bien venga como venga.
   */
  it('arma la estructura con los tipos tal y como los devuelve la hoja', () => {
    const celdas: Cells = {
      id: 'ing-1',
      'purchasePrice.amount': 4.5,
      'purchasePrice.per.value': 1000,
      'purchasePrice.per.unit': 'g',
      [`lines${ARRAY_SUFFIX}`]: '[{"ingredientId":"ing-2"}]',
    };

    expect(rebuild(celdas)).toEqual({
      values: {
        id: 'ing-1',
        purchasePrice: { amount: 4.5, per: { value: 1000, unit: 'g' } },
        lines: [{ ingredientId: 'ing-2' }],
      },
    });
  });
});
