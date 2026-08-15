import {
  canonicalJson,
  parsePayload,
  payloadOf,
  recordFrom,
} from '../../../infrastructure/sheets/record-json';

/**
 * Misma excepción de ubicación que sus vecinos: es una pieza pura, sin red y sin inyección, y lo que
 * garantiza **no se ve desde fuera**.
 *
 * Este spec sustituye al que comprobaba los tipos columna a columna, y es el que sostiene todo el
 * formato. Lo que fija es el invariante entero:
 *
 * 1. **Ida y vuelta idéntica**, tipos incluidos. Es la razón de ser del cambio a JSON: antes un precio
 *    subía como número y volvía como texto, el repositorio lo descartaba como documento sin precio, y
 *    el insumo desaparecía del catálogo sin más rastro que un aviso en consola.
 * 2. **La misma entrada da la misma cadena**, venga como venga. De eso depende que la huella signifique
 *    «esto lo escribí yo»: si el mismo dato pudiera dar dos JSON distintos, cada fila parecería editada
 *    a mano en cada ciclo y la hoja se reescribiría sola para siempre.
 */
describe('el registro en una celda', () => {
  /** Un insumo tal cual vive en IndexedDB, con todo lo que puede llevar dentro. */
  const INSUMO = {
    id: 'ing-harina',
    name: 'Harina sin preparar',
    baseUnit: 'g',
    usage: 'recipe',
    activo: true,
    purchasePrice: { amount: 4.5, per: { value: 1000, unit: 'g' }, currency: 'PEN' },
    updatedAt: '2026-08-15T10:00:00.000Z',
  };

  /**
   * **El viaje entero, y con `toEqual` del documento completo**: no basta con mirar los valores, hay que
   * mirar sus tipos, y `toEqual` distingue `4.5` de `'4.5'`.
   *
   * Es el caso que costó los insumos del catálogo, y con JSON es cierto por construcción — este spec es
   * lo que lo mantiene cierto.
   */
  it('un registro vuelve idéntico, con sus tipos, tras pasar por una celda', () => {
    const celda = canonicalJson(payloadOf(INSUMO));
    const armado = parsePayload(celda);

    expect(armado).not.toBeNull();
    expect(recordFrom(armado!, '1786772542466-0000-dev00001', false, 0)).toEqual({
      ...INSUMO,
      // La fecha se sintetiza del instante que lleva la versión, no de «ahora»: ver `recordFrom`.
      updatedAt: new Date(1786772542466).toISOString(),
    });
  });

  /**
   * Los valores que rompen una huella en silencio, todos en el mismo viaje: números con cola binaria,
   * notación científica, el cero negativo, booleanos, listas de objetos y textos acentuados.
   */
  it('números, booleanos, listas y acentos sobreviven exactamente', () => {
    const receta = {
      id: 'rec-1',
      name: 'Almíbar',
      suma: 0.1 + 0.2,
      enorme: 1e21,
      cero: -0,
      activo: false,
      lines: [
        { ingredientId: 'ing-1', quantity: { value: 400, unit: 'g' } },
        { ingredientId: 'ing-2', quantity: { value: 80, unit: 'g' } },
      ],
    };

    const armado = parsePayload(canonicalJson(payloadOf(receta)));

    expect(armado).toEqual({ ...receta, cero: 0 });
    expect(typeof armado?.['suma']).toBe('number');
    expect(typeof armado?.['activo']).toBe('boolean');
    expect(Array.isArray(armado?.['lines'])).toBe(true);
  });

  /**
   * **La misma entrada da la misma cadena.** Un objeto que vuelve de un `JSON.parse` no conserva el
   * orden en que se escribió, así que sin ordenar las claves el mismo dato daría dos JSON distintos
   * según de dónde viniera — y la fila parecería editada a mano en cada ciclo.
   *
   * Se comprueba con el ida y vuelta completo, que es donde el orden se pierde de verdad.
   */
  it('el JSON es el mismo venga el objeto con las claves en el orden que venga', () => {
    const unaForma = canonicalJson(payloadOf(INSUMO));
    const laOtra = canonicalJson(
      payloadOf({
        purchasePrice: { currency: 'PEN', per: { unit: 'g', value: 1000 }, amount: 4.5 },
        usage: 'recipe',
        activo: true,
        baseUnit: 'g',
        name: 'Harina sin preparar',
        id: 'ing-harina',
        updatedAt: '2026-08-15T10:00:00.000Z',
      }),
    );

    expect(laOtra).toBe(unaForma);
    // Y sobrevive al viaje: lo que se relee y se vuelve a escribir es idéntico a lo que se escribió.
    expect(canonicalJson(parsePayload(unaForma)!)).toBe(unaForma);
  });

  /**
   * Un acento tiene dos codificaciones posibles y no siempre vuelve como se mandó. Sin normalizar a
   * NFC, cualquier nombre acentuado sería una edición manual permanente: la huella no cuadraría nunca.
   */
  it('las dos codificaciones de un acento dan el mismo JSON', () => {
    // La misma palabra con la «í» de una sola unidad y con la «i» seguida del acento combinante. Se
    // construye con el escape para que no dependa de cómo guarde este fichero el editor.
    const compuesta = 'Almíbar';
    const descompuesta = 'Almi\u0301bar';
    expect(descompuesta.length).toBe(compuesta.length + 1);

    expect(canonicalJson({ id: 'x', name: descompuesta })).toBe(
      canonicalJson({ id: 'x', name: compuesta }),
    );
  });

  /**
   * Un campo ausente y uno a `null` son lo mismo para el destino: una celda no distingue esas dos
   * cosas. Tenerlas como distintas haría divergir a dos dispositivos que guardan exactamente lo mismo.
   */
  it('un nulo y un campo ausente son la misma cosa', () => {
    expect(canonicalJson({ id: 'x', flavorId: null, name: 'Bizcocho' })).toBe(
      canonicalJson({ id: 'x', name: 'Bizcocho' }),
    );
  });

  /**
   * `updatedAt` y `deletedAt` **no viajan**, y se quitan en los dos lados. Si el registro local los
   * llevara y el payload remoto no, el motor los vería como campos que solo existen aquí y subiría esa
   * fila en cada ciclo, para siempre.
   */
  it('la fecha de guardado y la lápida no viajan', () => {
    const payload = payloadOf({ ...INSUMO, deletedAt: '2026-08-15T11:00:00.000Z' });

    expect(payload).not.toHaveProperty('updatedAt');
    expect(payload).not.toHaveProperty('deletedAt');
    expect(payload.id).toBe('ing-harina');
  });

  /** Una fila que baja borrada tiene que **llegar borrada**: aquí lo que marca eso es `deletedAt`. */
  it('una fila que baja borrada recupera su lápida', () => {
    const guardado = recordFrom({ id: 'x', name: 'Algo' }, '1786772542466-0000-dev00001', true, 0);

    expect(guardado['deletedAt']).toBe(new Date(1786772542466).toISOString());
  });

  /**
   * Una celda que no se puede leer **no lanza**: se contesta `null` y quien pregunta pone esa fila en
   * cuarentena. Si lanzara, el ciclo entero moriría por una celda que alguien estropeó — y como la
   * celda seguiría en la hoja, moriría igual para siempre.
   */
  it.each([
    ['vacía', ''],
    ['espacios', '   '],
    ['nada', null],
    ['JSON roto', '{"id":'],
    ['una lista', '[1,2,3]'],
    ['un número suelto', '42'],
    ['texto', 'esto no es json'],
  ])('una celda que no es un registro se reporta sin lanzar (%s)', (_caso, cell) => {
    expect(() => parsePayload(cell)).not.toThrow();
    expect(parsePayload(cell)).toBeNull();
  });
});
