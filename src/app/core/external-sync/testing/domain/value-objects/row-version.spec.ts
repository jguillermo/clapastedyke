import { RowClock, RowVersion, SKEW_TOLERANCE_MS } from '../../../domain/value-objects/row-version';

/**
 * El reloj lógico que decide quién gana un conflicto.
 *
 * Lo que más se prueba aquí no es el camino feliz sino las dos cosas irreversibles: que el orden
 * lexicográfico de la cadena coincida con el orden real (si no, la hoja ordenada a mano y la app
 * discreparían), y que una versión venida del futuro **no contagie el reloj** — el único fallo del
 * diseño del que no se podría volver.
 */
describe('RowVersion', () => {
  const ahora = 1_700_000_000_000;

  describe('parse', () => {
    it('lee una versión bien formada', () => {
      const version = RowVersion.parse('0001700000000000-0007-abc');

      expect(version?.millis).toBe(1_700_000_000_000);
      expect(version?.counter).toBe(7);
      expect(version?.deviceId).toBe('abc');
    });

    it('tolera espacios alrededor: una hoja de cálculo los añade sola', () => {
      expect(RowVersion.parse('  0000000000001-0000-abc  ')?.millis).toBe(1);
    });

    it.each([
      ['vacía', ''],
      ['solo espacios', '   '],
      ['sin partes suficientes', '1700000000000-0001'],
      ['con partes de sobra', '17-1-abc-def'],
      ['con letras donde van números', 'ayer-0001-abc'],
      ['con un contador que no es número', '17-x-abc'],
      ['sin dispositivo', '17-1-'],
      ['negativa', '-17-1-abc'],
      ['con decimales', '17.5-1-abc'],
      ['fuera del entero seguro', '99999999999999999999-1-abc'],
    ])('devuelve null y NO lanza si viene %s', (_caso, raw) => {
      expect(RowVersion.parse(raw)).toBeNull();
    });
  });

  describe('orden', () => {
    it('ordena por instante, luego por contador, luego por dispositivo', () => {
      const antes = RowVersion.of(10, 0, 'a');
      const mismoInstante = RowVersion.of(10, 1, 'a');
      const despues = RowVersion.of(11, 0, 'a');

      expect(mismoInstante.isAfter(antes)).toBe(true);
      expect(despues.isAfter(mismoInstante)).toBe(true);
      expect(antes.isAfter(despues)).toBe(false);
    });

    it('desempata dos dispositivos igual en todas las máquinas', () => {
      const uno = RowVersion.of(10, 0, 'aaa');
      const otro = RowVersion.of(10, 0, 'bbb');

      // Lo que importa es que la respuesta sea la MISMA en los dos lados, no cuál gane.
      expect(otro.isAfter(uno)).toBe(true);
      expect(uno.isAfter(otro)).toBe(false);
      expect(uno.compareTo(otro)).toBe(-otro.compareTo(uno));
    });

    it('dos versiones idénticas son iguales y ninguna es posterior', () => {
      const uno = RowVersion.of(10, 2, 'abc');
      const otro = RowVersion.of(10, 2, 'abc');

      expect(uno.equals(otro)).toBe(true);
      expect(uno.isAfter(otro)).toBe(false);
    });

    it('comparar las CADENAS da el mismo orden que comparar las versiones', () => {
      // Es lo que permite ordenar la columna en la hoja sin que engañe, y comparar sin parsear.
      const versiones = [
        RowVersion.of(9, 0, 'a'),
        RowVersion.of(10, 0, 'a'),
        RowVersion.of(10, 1, 'a'),
        RowVersion.of(100, 0, 'a'),
        RowVersion.of(1_700_000_000_000, 9999, 'a'),
      ];

      const porVersion = [...versiones].sort((a, b) => a.compareTo(b)).map(String);
      const porCadena = versiones.map(String).sort();

      expect(porCadena).toEqual(porVersion);
    });

    it('la versión adoptada es anterior a cualquier otra', () => {
      expect(RowVersion.of(1, 0, 'a').isAfter(RowVersion.adopted())).toBe(true);
      expect(RowVersion.adopted().toString()).toBe('0000000000000-0000-0');
    });
  });

  describe('futuro', () => {
    it('un desfase pequeño de reloj es normal y se acepta', () => {
      expect(RowVersion.of(ahora + 30_000, 0, 'a').isFromTheFuture(ahora)).toBe(false);
    });

    it('justo en el límite todavía se acepta', () => {
      expect(RowVersion.of(ahora + SKEW_TOLERANCE_MS, 0, 'a').isFromTheFuture(ahora)).toBe(false);
    });

    it('más allá del límite es sospechosa', () => {
      expect(RowVersion.of(ahora + SKEW_TOLERANCE_MS + 1, 0, 'a').isFromTheFuture(ahora)).toBe(
        true,
      );
    });
  });
});

describe('RowClock', () => {
  const ahora = 1_700_000_000_000;

  it('emite versiones estrictamente crecientes dentro del mismo milisegundo', () => {
    const clock = new RowClock('abc');

    const primera = clock.next(ahora);
    const segunda = clock.next(ahora);
    const tercera = clock.next(ahora);

    expect(segunda.isAfter(primera)).toBe(true);
    expect(tercera.isAfter(segunda)).toBe(true);
    expect([primera.counter, segunda.counter, tercera.counter]).toEqual([0, 1, 2]);
  });

  it('reinicia el contador cuando el tiempo físico avanza', () => {
    const clock = new RowClock('abc');
    clock.next(ahora);
    clock.next(ahora);

    const despues = clock.next(ahora + 1);

    expect(despues.counter).toBe(0);
    expect(despues.millis).toBe(ahora + 1);
  });

  it('no va hacia atrás aunque el reloj del sistema se ajuste a una hora anterior', () => {
    const clock = new RowClock('abc');
    const antes = clock.next(ahora);

    const conRelojAtrasado = clock.next(ahora - 60_000);

    expect(conRelojAtrasado.isAfter(antes)).toBe(true);
    expect(conRelojAtrasado.millis).toBe(ahora);
  });

  it('se pone al día con lo que lee: un dispositivo atrasado deja de perder siempre', () => {
    // El caso real: este dispositivo va media hora atrasado y lee lo que escribió otro.
    const atrasado = new RowClock('lento');
    const ajeno = RowVersion.of(ahora, 3, 'rapido');

    atrasado.observe(ajeno, ahora);
    const propia = atrasado.next(ahora - 30 * 60 * 1000);

    expect(propia.isAfter(ajeno)).toBe(true);
  });

  it('observar algo más antiguo no retrasa el reloj', () => {
    const clock = new RowClock('abc');
    clock.observe(RowVersion.of(ahora, 5, 'otro'), ahora);

    clock.observe(RowVersion.of(ahora - 10_000, 0, 'otro'), ahora);
    const siguiente = clock.next(ahora - 10_000);

    expect(siguiente.millis).toBe(ahora);
    expect(siguiente.counter).toBe(6);
  });

  it('una versión del futuro NO contagia el reloj', () => {
    // El fallo irreversible: sin esto, una celda con el año 3000 haría que todo lo que escribiera
    // este dispositivo naciera en el año 3000, y lo contagiaría a los demás al leer.
    const clock = new RowClock('abc');
    const envenenada = RowVersion.of(ahora + 365 * 24 * 60 * 60 * 1000, 0, 'mano');

    clock.observe(envenenada, ahora);
    const propia = clock.next(ahora);

    expect(propia.millis).toBe(ahora);
    expect(propia.isAfter(envenenada)).toBe(false);
  });
});
