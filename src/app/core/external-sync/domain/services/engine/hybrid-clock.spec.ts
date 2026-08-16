import { HybridClock, LogicalVersion, SKEW_TOLERANCE_MS } from './hybrid-clock';

/**
 * MISMA EXCEPCIÓN DELIBERADA de ubicación que `reconcile.spec.ts` (ver su cabecera): el motor es un
 * módulo autocontenido y portable —función pura, sin `TestBed`, sin dobles, sin nada que inyectar—
 * que se documenta y se prueba como una sola pieza, así que su spec vive junto al fuente y no bajo
 * `testing/`.
 *
 * ## Por qué el reloj necesita su propio spec
 *
 * `reconcile.spec.ts` lo ejercita **de refilón**: se ven las versiones que salen en el plan, no las
 * reglas que las producen. Y el reloj es justo la pieza que decide **quién gana** cuando el mismo
 * dato cambió en dos sitios: si se equivoca, no se rompe nada — se pierde una edición, en silencio.
 *
 * Los tres invariantes que se prueban aquí, y que ningún test del motor puede cubrir por su cuenta:
 *
 * 1. **Round-trip.** Todo lo que `toString()` escribe, `parse()` lo tiene que poder volver a leer.
 *    Si se rompe, cada versión que emita ese origen nace ilegible, y una versión ilegible pierde
 *    SIEMPRE contra el destino (`blind`). Es el modo de fallo más caro y el más difícil de ver.
 * 2. **Orden de texto = orden real.** El formato es de ancho fijo precisamente para que comparar
 *    versiones sea comparar cadenas. En cuanto una parte se sale de su ancho, las dos cosas dejan de
 *    coincidir y el destino (una hoja que un humano ordena) empieza a mentir.
 * 3. **Monotonía.** El reloj nunca emite por detrás de lo que ya emitió ni de lo que observó, pase lo
 *    que pase con el reloj del sistema.
 */
describe('reloj lógico híbrido (HLC)', () => {
  describe('LogicalVersion · leer una versión escrita', () => {
    /**
     * Un valor estropeado —tecleado a mano en el destino, arrastrado al ordenar, pegado sin querer—
     * no puede parar la sincronización de todo lo demás: se devuelve `null` y quien pregunta decide
     * (y decide re-estampar). Ninguna de estas entradas puede lanzar.
     */
    it('lo ilegible devuelve null y nunca lanza', () => {
      const ilegibles = [
        '',
        '   ',
        'cualquier-cosa',
        '0000000000100',
        '0000000000100-0000',
        '0000000000100-0000-origina-sobra',
        'x-0000-origina',
        '0000000000100-x-origina',
        '0000000000100-0000-',
        '-0000000000100-0000-origina',
        '0000000000100--origina',
        '1e3-0000-origina',
        '100.5-0000-origina',
      ];

      for (const raw of ilegibles) {
        expect(() => LogicalVersion.parse(raw)).not.toThrow();
        expect(LogicalVersion.parse(raw)).toBeNull();
      }
    });

    /**
     * El ancho fijo **es** el formato, no un adorno del acolchado: una parte que no cabe en su ancho
     * rompe el orden lexicográfico (ver el test de orden), así que no se lee — se trata como
     * ilegible y quien la reciba le pondrá una sana. Los ceros de más sí se aceptan: el valor
     * numérico sigue cabiendo, y `toString()` lo devuelve al ancho correcto.
     */
    it('el ancho fijo es parte del formato: lo que no cabe no se lee', () => {
      expect(LogicalVersion.parse('99999999999999-0000-origina')).toBeNull(); // 14 dígitos de instante
      expect(LogicalVersion.parse('0000000000100-10000-origina')).toBeNull(); // 5 dígitos de contador

      expect(LogicalVersion.parse('9999999999999-9999-origina')?.toString()).toBe(
        '9999999999999-9999-origina',
      );
      // Sin acolchar y con ceros de sobra: el valor cabe, así que se lee y se devuelve normalizado.
      expect(LogicalVersion.parse('100-0-origina')?.toString()).toBe('0000000000100-0000-origina');
      expect(LogicalVersion.parse('  0000000000100-0000-origina  ')?.toString()).toBe(
        '0000000000100-0000-origina',
      );
    });

    /**
     * El invariante que sostiene todo lo demás: lo que este módulo escribe, este módulo lo lee. Si
     * alguna vez deja de cumplirse, las versiones de ese origen se vuelven ilegibles para todos los
     * demás —incluido él mismo en el ciclo siguiente— y sus ediciones pierden siempre, sin que nada
     * lo avise.
     */
    it('lo que escribe toString siempre se puede volver a leer', () => {
      const versiones = [
        LogicalVersion.of(0, 0, 'a'),
        LogicalVersion.of(1_700_000_000_000, 0, 'origina'),
        LogicalVersion.of(1_700_000_000_000, 9999, 'dispositi'),
        LogicalVersion.of(9_999_999_999_999, 9999, 'Z'),
      ];

      for (const version of versiones) {
        const releida = LogicalVersion.parse(version.toString());
        expect(releida).not.toBeNull();
        expect(releida?.equals(version)).toBe(true);
        expect(releida?.toString()).toBe(version.toString());
      }
    });
  });

  describe('LogicalVersion · construir', () => {
    /**
     * Construir una versión que no se puede volver a leer es un **error de programación**, no un dato
     * del usuario: aquí sí se falla rápido y ruidosamente, al revés que en `parse`.
     *
     * El caso que motiva esto es real: la versión se lee partiendo por guiones, así que un origen que
     * lleve uno (un UUID entero, por ejemplo) rompe el formato entero. Hoy lo salva
     * `IndexedDbDeviceIdentity`, que recorta el UUID y quita los guiones — pero eso vive en OTRO
     * módulo, y este motor se documenta como reutilizable con cualquier destino. Tiene que
     * defenderse solo.
     */
    it('rechaza un origen que rompería el formato, y las partes fuera de rango', () => {
      expect(() => LogicalVersion.of(100, 0, '123e4567-e89b')).toThrow();
      expect(() => LogicalVersion.of(100, 0, '')).toThrow();

      expect(() => LogicalVersion.of(-1, 0, 'origina')).toThrow();
      expect(() => LogicalVersion.of(100, -1, 'origina')).toThrow();
      expect(() => LogicalVersion.of(10_000_000_000_000, 0, 'origina')).toThrow();
      expect(() => LogicalVersion.of(100, 10_000, 'origina')).toThrow();
      expect(() => LogicalVersion.of(1.5, 0, 'origina')).toThrow();

      expect(() => LogicalVersion.of(0, 0, 'origina')).not.toThrow();
      expect(() => LogicalVersion.of(9_999_999_999_999, 9999, 'origina')).not.toThrow();
    });
  });

  describe('LogicalVersion · orden', () => {
    /**
     * El orden total, y la razón de ser del acolchado: **comparar versiones tiene que ser comparar
     * cadenas**. Se prueban las dos comparaciones sobre la misma lista ordenada a mano, así que si
     * alguna vez divergen —una parte que se sale de su ancho es la forma de conseguirlo— este test
     * lo dice.
     *
     * El `originId` entra al final para que el desempate sea idéntico en todas las réplicas: si dos
     * orígenes se creyeran ganadores a la vez, no convergerían nunca.
     */
    it('ordena por instante, contador y origen, y el orden de texto coincide con el orden real', () => {
      const ascendente = [
        LogicalVersion.of(100, 0, 'aaa'),
        LogicalVersion.of(100, 0, 'bbb'),
        LogicalVersion.of(100, 1, 'aaa'),
        LogicalVersion.of(100, 9999, 'aaa'),
        LogicalVersion.of(101, 0, 'aaa'),
        LogicalVersion.of(1_700_000_000_000, 0, 'aaa'),
      ];

      for (let i = 0; i < ascendente.length - 1; i += 1) {
        const menor = ascendente[i];
        const mayor = ascendente[i + 1];

        expect(mayor.isAfter(menor)).toBe(true);
        expect(menor.isAfter(mayor)).toBe(false);
        expect(menor.compareTo(mayor)).toBeLessThan(0);
        expect(mayor.compareTo(menor)).toBeGreaterThan(0);
        expect(menor.equals(mayor)).toBe(false);
        // La misma comparación, como texto: es lo que hace un humano ordenando una columna.
        expect(menor.toString() < mayor.toString()).toBe(true);
      }

      const misma = LogicalVersion.of(100, 0, 'aaa');
      expect(misma.equals(ascendente[0])).toBe(true);
      expect(misma.compareTo(ascendente[0])).toBe(0);
      expect(misma.isAfter(ascendente[0])).toBe(false);
    });

    /** El límite exacto: el margen se tolera entero, y solo lo que lo pasa cuenta como futuro. */
    it('isFromTheFuture marca justo a partir del margen de tolerancia', () => {
      const ahora = 1_700_000_000_000;

      expect(LogicalVersion.of(ahora, 0, 'origina').isFromTheFuture(ahora)).toBe(false);
      expect(
        LogicalVersion.of(ahora + SKEW_TOLERANCE_MS, 0, 'origina').isFromTheFuture(ahora),
      ).toBe(false);
      expect(
        LogicalVersion.of(ahora + SKEW_TOLERANCE_MS + 1, 0, 'origina').isFromTheFuture(ahora),
      ).toBe(true);
    });
  });

  describe('HybridClock · emitir', () => {
    /**
     * Lo que un HLC promete: **nunca hacia atrás**. Se recorren las tres situaciones en una sola
     * secuencia, sobre el mismo reloj:
     * - el tiempo físico avanza ⇒ se adopta y el contador vuelve a cero;
     * - dos escrituras dentro del mismo milisegundo ⇒ desempata el contador;
     * - el reloj del sistema RETROCEDE a mitad de sesión (un ajuste de hora, un NTP) ⇒ el instante no
     *   se toca y sigue avanzando el contador. Sin esto, un simple ajuste de hora haría que todo lo
     *   escrito después naciera «viejo» y lo sobrescribiera cualquier otro origen.
     */
    it('emite siempre hacia delante, aunque el reloj del sistema retroceda', () => {
      const clock = new HybridClock('origina');

      const primera = clock.next(1_000);
      expect(primera.toString()).toBe('0000000001000-0000-origina');

      const mismoMilisegundo = clock.next(1_000);
      expect(mismoMilisegundo.toString()).toBe('0000000001000-0001-origina');
      expect(mismoMilisegundo.isAfter(primera)).toBe(true);

      const avanza = clock.next(2_000);
      expect(avanza.toString()).toBe('0000000002000-0000-origina');
      expect(avanza.isAfter(mismoMilisegundo)).toBe(true);

      const retrocede = clock.next(500);
      expect(retrocede.toString()).toBe('0000000002000-0001-origina');
      expect(retrocede.isAfter(avanza)).toBe(true);
    });

    /**
     * La otra mitad del HLC: ponerse al día con lo que ya está escrito. Un origen con la hora
     * atrasada perdería siempre si emitiera por su reloj físico; leyendo lo que hay se pone al día y
     * emite por delante.
     *
     * Y el tope: una versión del futuro **no** entra en el reloj. Si entrara, no solo ganaría su
     * fila para siempre — todo lo que este origen emitiera después nacería en el futuro, y
     * contagiaría a los demás en cuanto lo leyeran. No habría vuelta atrás.
     */
    it('se pone al día con lo observado, pero una versión del futuro no lo adelanta', () => {
      const ahora = 1_700_000_000_000;
      const clock = new HybridClock('origina');

      clock.observe(LogicalVersion.of(ahora - 1_000, 7, 'otro'), ahora);
      // Mismo instante, contador mayor: sube el contador, no el instante.
      clock.observe(LogicalVersion.of(ahora - 1_000, 9, 'otro'), ahora);
      // Anterior a lo ya observado: no cambia nada.
      clock.observe(LogicalVersion.of(ahora - 5_000, 3, 'otro'), ahora);

      const alDia = clock.next(ahora - 1_000);
      expect(alDia.toString()).toBe(LogicalVersion.of(ahora - 1_000, 10, 'origina').toString());

      const envenenada = LogicalVersion.of(ahora + SKEW_TOLERANCE_MS + 1, 0, 'corrupto');
      clock.observe(envenenada, ahora);

      const sana = clock.next(ahora);
      expect(sana.isFromTheFuture(ahora)).toBe(false);
      expect(sana.toString()).toBe(LogicalVersion.of(ahora, 0, 'origina').toString());
    });

    /**
     * El contador tiene un ancho fijo (4), y sin techo se desborda: la versión 10.000 se escribiría
     * con cinco dígitos y el orden lexicográfico dejaría de coincidir con el real — que es lo único
     * que el acolchado existe para garantizar.
     *
     * Al llegar al techo se avanza el instante en vez de ensanchar el contador: la versión sigue
     * siendo estrictamente posterior y sigue cabiendo en su formato.
     *
     * Se comprueba con 10.001 emisiones encadenadas **en el mismo milisegundo** (el caso peor: un
     * ciclo con más registros que el techo del contador), verificando las dos monotonías —la real y
     * la de texto— en cada paso.
     */
    it('el contador no desborda su ancho: al llegar al techo avanza el instante', () => {
      const clock = new HybridClock('origina');
      let anterior = clock.next(1_000);

      for (let i = 0; i < 10_001; i += 1) {
        const siguiente = clock.next(1_000);

        expect(siguiente.isAfter(anterior)).toBe(true);
        expect(siguiente.toString() > anterior.toString()).toBe(true);
        expect(LogicalVersion.parse(siguiente.toString())?.equals(siguiente)).toBe(true);

        anterior = siguiente;
      }
    });

    /** Misma defensa que en `LogicalVersion.of`, pero en la puerta de entrada: falla al construirlo. */
    it('rechaza un origen que rompería el formato', () => {
      expect(() => new HybridClock('123e4567-e89b')).toThrow();
      expect(() => new HybridClock('')).toThrow();
      expect(() => new HybridClock('origina')).not.toThrow();
    });
  });
});
