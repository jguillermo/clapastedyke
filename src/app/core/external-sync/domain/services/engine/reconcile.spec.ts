import { reconcile } from './reconcile';

/**
 * El motor no depende de ninguna librería, ni hace red ni I/O: es una función pura, así que estos son
 * tests unitarios en el sentido más estricto — sin `TestBed`, sin dobles, sin async.
 *
 * El motor compara solo dos copias: `data` (aquí) contra `base` (el destino, la fuente de verdad).
 * No hay una tercera copia ancestral que persistir entre ciclos.
 *
 * Cada `it(...)` lleva un comentario con tres partes:
 * - **Caso**: la situación real que representa, en lenguaje llano, sin jerga del código.
 * - **Entrada**: qué hay en `base` (el destino) y en `data` (aquí), o su ausencia, que también es
 *   información.
 * - **Salida**: qué decide el motor y por qué esa es la decisión correcta para ese caso.
 *
 * No hay ningún helper de fixture: cada test construye su `EngineInput` completo, literal e inline,
 * incluidas las cadenas de versión ya resueltas a mano en el formato `millis(13)-contador(4)-origen`
 * que exige `LogicalVersion.parse` (`hybrid-clock.ts`).
 */
describe('reconcile engine', () => {
  describe('reconcile · alta local (creado aquí)', () => {
    /**
     * Caso: un dato completamente nuevo, creado aquí, que el destino nunca ha recibido.
     * Entrada: `base` trae la colección presente pero vacía; `data` tiene un registro para ella.
     * Salida: `push` con el contenido y una versión recién emitida por el reloj — es un alta, no hay
     * nada que comparar.
     */
    it('un dato nuevo aquí, que el destino nunca vio, se sube', () => {
      const plan = reconcile({
        base: [{ collection: 'a', present: true, items: [] }],
        data: { a: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }] },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toEqual([
        {
          collection: 'a',
          id: '1',
          value: 'contenido',
          fingerprint: 'fp',
          version: '1700000000000-0000-origina',
        },
      ]);
      expect(plan.apply).toEqual([]);
      expect(plan.tombstones).toEqual([]);
    });
  });

  describe('reconcile · borrado local (ausente aquí)', () => {
    /**
     * Caso: el usuario borró el dato aquí; hay que avisarle al destino sin borrar físicamente la fila,
     * para que el borrado "viaje" y otros dispositivos se enteren al reconectar.
     * Entrada: `base` trae el registro vivo; `data` no tiene nada para ese id.
     * Salida: `tombstones` con una versión nueva (marcar, no eliminar); `remove` queda vacío.
     */
    it('un registro vivo en el destino que ya no está aquí se marca como lápida, no se elimina', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: null,
                deleted: false,
                ref: 7,
              },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.tombstones).toEqual([
        { collection: 'a', id: '1', ref: 7, version: '1700000000000-0000-origina' },
      ]);
      expect(plan.remove).toEqual([]);
    });

    /**
     * Caso: un dato que ya se sabía borrado en el destino y tampoco existe aquí — no hay nada nuevo que
     * decidir, y repetir la lápida sería trabajo (y ruido) de más en cada ciclo.
     * Entrada: `base` trae el registro con `deleted: true`; `data` no tiene nada para ese id.
     * Salida: ni `tombstones` ni `remove` — el estado ya está convergido.
     */
    it('un registro ya borrado en el destino y ausente aquí no genera ninguna acción', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: '0000000000500-0000-origina',
                deleted: true,
                ref: 7,
              },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.tombstones).toEqual([]);
      expect(plan.remove).toEqual([]);
    });
  });

  describe('reconcile · el destino manda cuando ya está borrado', () => {
    /**
     * Caso: el dato se borró en el destino (otro dispositivo, o directamente ahí) mientras aquí
     * seguía presente — el destino es la fuente de verdad, así que gana sin comparar huellas.
     * Entrada: `base` marca `deleted: true` con su propia versión escrita; `data` todavía tiene el
     * registro, con contenido distinto.
     * Salida: `remove` con la versión del destino respetada tal cual; nada se sube.
     */
    it('un registro borrado en el destino se quita aquí también, aunque siga presente localmente', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: '0000000000500-0000-origina',
                deleted: true,
                ref: 7,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-local', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.remove).toEqual([
        { collection: 'a', id: '1', version: '0000000000500-0000-origina' },
      ]);
      expect(plan.push).toEqual([]);
      expect(plan.apply).toEqual([]);
    });

    /**
     * Caso: igual que arriba, pero el destino no trae ninguna versión escrita para el borrado — hay
     * que sintetizar una nueva para poder confirmarlo aquí.
     * Entrada: `base` con `deleted: true` y `version: null`; `data` todavía presente.
     * Salida: `remove` con una versión recién emitida por el reloj.
     */
    it('si el destino no trae versión al borrar, se sintetiza una nueva al confirmarlo aquí', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              { id: '1', value: 'x', fingerprint: 'fp', version: null, deleted: true, ref: 1 },
            ],
          },
        ],
        data: { a: [{ id: '1', value: 'y', fingerprint: 'fp2', changedAt: null }] },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.remove).toEqual([
        { collection: 'a', id: '1', version: '1700000000000-0000-origina' },
      ]);
    });

    /**
     * Caso: el destino manda incluso cuando el contenido de aquí es idéntico al que tenía el destino
     * antes de borrarse — no es la huella la que decide este caso, es el `deleted` de `base`.
     * Entrada: `base` con `deleted: true` y la MISMA huella y el MISMO contenido que `data`.
     * Salida: `remove` de todos modos; nada de `push`, `apply` ni `tombstones`.
     */
    it('un registro borrado en el destino se quita aquí también aunque la huella coincida', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: '0000000000500-0000-origina',
                deleted: true,
                ref: 7,
              },
            ],
          },
        ],
        data: { a: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }] },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.remove).toEqual([
        { collection: 'a', id: '1', version: '0000000000500-0000-origina' },
      ]);
      expect(plan.push).toEqual([]);
      expect(plan.apply).toEqual([]);
      expect(plan.tombstones).toEqual([]);
    });
  });

  describe('reconcile · sin cambios', () => {
    /**
     * Caso: nadie tocó el dato desde la última vez que se miró — ni aquí ni en el destino.
     * Entrada: `base` y `data` tienen la MISMA huella, y el destino no está borrado.
     * Salida: nada que subir, ni traer, ni conflicto — el plan queda vacío para este id.
     */
    it('misma huella en los dos lados no genera ninguna acción', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: '0000000000500-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: { a: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }] },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toEqual([]);
      expect(plan.apply).toEqual([]);
      expect(plan.remove).toEqual([]);
      expect(plan.tombstones).toEqual([]);
      expect(plan.conflicts).toEqual([]);
    });
  });

  describe('reconcile · conflicto: gana la fecha más reciente', () => {
    /**
     * Caso: el dato cambió en los dos lados desde la última vez y hay que desempatar por fecha; la
     * edición de aquí es más reciente que la del destino.
     * Entrada: `base` viva con versión 2000; `data` con huella distinta y `changedAt` = 3000.
     * Salida: conflicto a favor de lo local (`blind: false`); se sube el contenido de aquí.
     */
    it('huella distinta y local más reciente: gana lo local, se sube', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remote',
                version: '0000000002000-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [
            {
              id: '1',
              value: 'contenido-local',
              fingerprint: 'fp-local',
              changedAt: '0000000003000-0000-origina',
            },
          ],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'local', blind: false }]);
      expect(plan.push).toEqual([
        {
          collection: 'a',
          id: '1',
          value: 'contenido-local',
          fingerprint: 'fp-local',
          version: '1700000000000-0000-origina',
        },
      ]);
      expect(plan.apply).toEqual([]);
    });

    /**
     * Caso: mismo desacuerdo, pero esta vez la versión del destino es posterior a la edición de aquí.
     * Entrada: `base` viva con versión 9000; `data` con huella distinta y `changedAt` = 3000.
     * Salida: conflicto a favor del destino (`blind: false`); se aplica su contenido, con su propia
     * versión respetada tal cual.
     */
    it('huella distinta y remoto más reciente: gana el destino, se aplica', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remote',
                version: '0000000009000-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [
            {
              id: '1',
              value: 'contenido-local',
              fingerprint: 'fp-local',
              changedAt: '0000000003000-0000-origina',
            },
          ],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([
        { collection: 'a', id: '1', winner: 'remote', blind: false },
      ]);
      expect(plan.apply).toEqual([
        {
          collection: 'a',
          id: '1',
          value: 'contenido-remoto',
          fingerprint: 'fp-remote',
          version: '0000000009000-0000-origina',
        },
      ]);
      expect(plan.push).toEqual([]);
    });

    /**
     * Caso: no se sabe cuándo se editó aquí (por ejemplo, un dato guardado antes de que existiera el
     * campo que registra la fecha de cambio local) — el destino gana por precaución.
     * Entrada: `data.changedAt: null`, huella distinta a la de `base`.
     * Salida: conflicto a favor del destino, marcado `blind: true`.
     */
    it('sin fecha local conocida: gana el destino, marcado como a ciegas', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remote',
                version: '0000000002000-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-local', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'remote', blind: true }]);
      expect(plan.apply).toEqual([
        {
          collection: 'a',
          id: '1',
          value: 'contenido-remoto',
          fingerprint: 'fp-remote',
          version: '0000000002000-0000-origina',
        },
      ]);
      expect(plan.push).toEqual([]);
    });

    /**
     * Caso: el dato de "cuándo se cambió aquí" está corrupto o mal formado — debe tratarse igual que
     * si simplemente no se supiera, nunca provocar un error.
     * Entrada: `data.changedAt: 'esto no es una versión'`, huella distinta a la de `base`.
     * Salida: el conflicto se resuelve exactamente igual que con `changedAt: null`.
     */
    it('un `changedAt` local ilegible se trata como si no se supiera: el conflicto queda a ciegas', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remote',
                version: '0000000002000-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [
            {
              id: '1',
              value: 'contenido-local',
              fingerprint: 'fp-local',
              changedAt: 'esto no es una versión',
            },
          ],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'remote', blind: true }]);
    });

    /**
     * Caso: el destino no trae ninguna versión escrita — hay que sintetizar una para poder comparar,
     * y esa sintetizada es la que se aplica si gana.
     * Entrada: `base.version: null`, huella distinta, `data.changedAt: null` (a ciegas, gana el
     * destino).
     * Salida: conflicto a favor del destino, `blind: true`; se aplica con la versión recién emitida
     * por el reloj del ciclo.
     */
    it('si el destino no trae versión, se sintetiza una para poder comparar en el conflicto', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remote',
                version: null,
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-local', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'remote', blind: true }]);
      expect(plan.apply).toEqual([
        {
          collection: 'a',
          id: '1',
          value: 'contenido-remoto',
          fingerprint: 'fp-remote',
          version: '1700000000000-0000-origina',
        },
      ]);
    });

    /**
     * Caso: el destino no trae versión, pero aquí SÍ se sabe cuándo se cambió — y esa fecha conocida
     * es de hace tiempo. Al sintetizar la versión del destino en "ahora", el destino se vuelve más
     * reciente que cualquier edición local pasada, así que gana él — pero a diferencia del caso "a
     * ciegas", aquí SÍ se conocía la fecha local: no es que no se supiera, es que perdió limpiamente.
     * Entrada: `base.version: null`, huella distinta; `data.changedAt` = 500 (muy anterior a `now`).
     * Salida: conflicto a favor del destino, `blind: false` (la fecha local SÍ se conocía).
     */
    it('sin versión en el destino, una fecha local conocida pero antigua pierde de forma no ciega', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remote',
                version: null,
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [
            {
              id: '1',
              value: 'contenido-local',
              fingerprint: 'fp-local',
              changedAt: '0000000000500-0000-origina',
            },
          ],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'remote', blind: false }]);
      expect(plan.apply).toEqual([
        {
          collection: 'a',
          id: '1',
          value: 'contenido-remoto',
          fingerprint: 'fp-remote',
          version: '1700000000000-0000-origina',
        },
      ]);
      expect(plan.push).toEqual([]);
    });
  });

  describe('reconcile · reloj lógico híbrido (HLC)', () => {
    /**
     * Caso: dos altas locales, en dos colecciones distintas, decididas dentro del mismo ciclo — deben
     * quedar ordenadas de forma inequívoca aunque compartan el mismo milisegundo.
     * Entrada: colecciones 'a' y 'b', cada una con un alta local nueva.
     * Salida: la primera decidida lleva contador 0; la segunda, contador 1.
     */
    it('dos escrituras dentro del mismo ciclo se desempatan por contador', () => {
      const plan = reconcile({
        base: [
          { collection: 'a', present: true, items: [] },
          { collection: 'b', present: true, items: [] },
        ],
        data: {
          a: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }],
          b: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push[0]?.version).toBe('1700000000000-0000-origina');
      expect(plan.push[1]?.version).toBe('1700000000000-0001-origina');
    });

    /**
     * Caso: dos orígenes editaron exactamente en el mismo instante lógico (mismo milisegundo y mismo
     * contador) — hace falta un criterio de desempate que dé SIEMPRE el mismo resultado.
     * Entrada: `base` version=(5000, 0, 'deviceb'); `data.changedAt`=(5000, 0, 'devicea').
     * Salida: gana 'deviceb' (mayor en orden alfabético) — el destino.
     */
    it('mismo instante y contador se desempatan por el origen, de forma determinista', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remote',
                version: '0000000005000-0000-deviceb',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [
            {
              id: '1',
              value: 'contenido-local',
              fingerprint: 'fp-local',
              changedAt: '0000000005000-0000-devicea',
            },
          ],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      // 'devicea' < 'deviceb': el destino gana el empate, en cualquier réplica que lo evalúe.
      expect(plan.conflicts).toEqual([
        { collection: 'a', id: '1', winner: 'remote', blind: false },
      ]);
    });

    /**
     * Caso: el reloj de este origen va "atrasado" respecto a lo que ya se ha visto escrito en el
     * destino (por ejemplo, por otro dispositivo) — no debe retroceder al emitir una versión nueva.
     * Entrada: colección 'semilla' con un registro convergido (misma huella en los dos lados) pero con
     * una versión observada más adelantada que `now`, dentro del margen de tolerancia; colección
     * 'empuje' con un alta local que necesita versión nueva.
     * Salida: la versión del alta nace POR DELANTE de lo observado (mismo milisegundo, contador
     * siguiente), nunca detrás de `now` a secas.
     */
    it('el reloj nunca emite una versión anterior a la última observada, aunque "ahora" sea menor', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'semilla',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: '1700000200000-0003-otroorigen',
                deleted: false,
                ref: 1,
              },
            ],
          },
          { collection: 'empuje', present: true, items: [] },
        ],
        data: {
          semilla: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }],
          empuje: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toHaveLength(1);
      expect(plan.push[0]?.version).toBe('1700000200000-0004-origina');
    });

    /**
     * Caso: alguien (o un error) dejó una fecha absurda en el destino — mucho más allá de lo que
     * cualquier reloj real justificaría — y no debe contaminar el resto del sistema.
     * Entrada: colección 'a' con un conflicto cuya versión de `base` está 10 minutos en el futuro (el
     * margen de tolerancia es de 5 min) y `data` a ciegas (gana el destino); colección 'b' con un
     * alta local que se decide después, en el mismo ciclo.
     * Salida: la versión aplicada para 'a' NO es la corrupta, sino una sintetizada en "ahora"; lo que
     * se sube DESPUÉS para 'b' nace en el mismo milisegundo (contador siguiente), no en el futuro.
     */
    it('una versión remota del futuro no adelanta el reloj y se re-estampa', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remoto',
                version: '1700000600000-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
          { collection: 'b', present: true, items: [] },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-local', changedAt: null }],
          b: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply[0]?.version).not.toBe('1700000600000-0000-origina');
      expect(plan.apply[0]?.version).toBe('1700000000000-0000-origina');
      expect(plan.push[0]?.version).toBe('1700000000000-0001-origina');
    });

    /**
     * Caso: el campo de versión del destino contiene basura — alguien escribió texto donde iba una
     * versión, o se corrompió.
     * Entrada: `base.version: 'no-es-una-version'`, en un conflicto real.
     * Salida: el ciclo sigue con normalidad (NO aborta), tratando la versión como si no existiera y
     * sintetizando una nueva.
     */
    it('una versión ilegible en el destino se trata como ausente, nunca aborta el ciclo', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remoto',
                version: 'no-es-una-version',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-local', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.aborted).toBeNull();
      expect(plan.apply).toHaveLength(1);
      expect(plan.apply[0]?.version).toBe('1700000000000-0000-origina');
    });
  });

  describe('reconcile · lápidas y purga', () => {
    /**
     * Caso: limpieza de una lápida vieja que ya cumplió su función — cualquier dispositivo ha tenido
     * tiempo de sobra (más de 90 días) para enterarse del borrado.
     * Entrada: `base` con `deleted: true` y una versión de hace más de 90 días.
     * Salida: `purge` incluye el registro — ya se puede tirar del destino sin riesgo.
     */
    it('una lápida con más de 90 días se purga', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: '1692223999999-0000-origina',
                deleted: true,
                ref: 9,
              },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.purge).toEqual([{ collection: 'a', id: '1', ref: 9 }]);
    });

    /**
     * Caso: una lápida todavía "joven" — un dispositivo desconectado podría no haberse enterado
     * todavía del borrado.
     * Entrada: `base` con `deleted: true` y versión de hace solo 10 días.
     * Salida: `purge` queda vacío — se conserva.
     */
    it('una lápida reciente no se purga', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: '1699136000000-0000-origina',
                deleted: true,
                ref: 1,
              },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.purge).toEqual([]);
    });

    /**
     * Caso: no se puede saber cuánto tiempo lleva una lápida — más vale conservarla de más que perder
     * un borrado que ningún dispositivo llegó a ver.
     * Entrada: `base` con `deleted: true`, `version: null` (ilegible o ausente).
     * Salida: `purge` queda vacío, sea cual sea `now`.
     */
    it('una lápida sin versión legible nunca se purga', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: null,
                deleted: true,
                ref: 1,
              },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.purge).toEqual([]);
    });

    /**
     * Caso: un despliegue quiere un plazo de retención de lápidas distinto al de 90 días por defecto.
     * Entrada: lápida de hace apenas 1 segundo, pero con `tombstoneTtlMs: 500` (medio segundo).
     * Salida: con ese plazo tan corto, ya se puede purgar — el TTL no está hardcodeado.
     */
    it('el TTL de las lápidas es configurable desde la entrada', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: '1699999999000-0000-origina',
                deleted: true,
                ref: '1',
              },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
        tombstoneTtlMs: 500,
      });

      expect(plan.purge).toEqual([{ collection: 'a', id: '1', ref: '1' }]);
    });
  });

  describe('reconcile · borde exacto de la tolerancia del reloj', () => {
    /**
     * Caso: comprobar el borde exacto del margen de tolerancia (5 minutos) — ¿justo en el límite
     * cuenta como "del futuro" o todavía se acepta? Se ejercita dentro de un conflicto a ciegas para
     * que el resultado dependa directamente de si la versión de `base` se respeta o se re-estampa.
     * Entrada: `base` con una versión exactamente 5 minutos por delante de `now`.
     * Salida: SÍ se respeta (no se considera del futuro) — el límite es estrictamente "más de 5
     * minutos", no "5 minutos o más".
     */
    it('una versión justo en el borde de la tolerancia NO se considera del futuro', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remoto',
                version: '1700000300000-0000-origina', // exactamente 5 minutos, el tope
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-local', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply[0]?.version).toBe('1700000300000-0000-origina');
    });

    /**
     * Caso: el mismo borde, un milisegundo más allá.
     * Entrada: `base` con versión a 5 minutos y 1 milisegundo de `now`.
     * Salida: ahora SÍ se considera del futuro y se re-estampa con una versión sintetizada.
     */
    it('un milisegundo más allá del borde SÍ se considera del futuro y se re-estampa', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remoto',
                version: '1700000300001-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-local', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply[0]?.version).not.toBe('1700000300001-0000-origina');
      expect(plan.apply[0]?.version).toBe('1700000000000-0000-origina');
    });
  });

  describe('reconcile · identidad duplicada', () => {
    /**
     * Caso: dos filas del destino reclaman el mismo id — un error de datos, o dos altas que
     * colisionaron. No se puede saber cuál es la de verdad, así que no se toca ninguna.
     * Entrada: `base` con dos entradas para el id '1' (contenidos distintos, refs 1 y 2); `data` con su
     * propio contenido para ese mismo id.
     * Salida: nada se aplica ni se sube para ese id — queda congelado hasta que alguien lo arregle a
     * mano en el destino.
     */
    it('un id repetido en el destino no se toca por ningún lado', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-uno',
                fingerprint: 'fp-uno',
                version: null,
                deleted: false,
                ref: 1,
              },
              {
                id: '1',
                value: 'contenido-dos',
                fingerprint: 'fp-dos',
                version: null,
                deleted: false,
                ref: 2,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-local', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply).toEqual([]);
      expect(plan.push).toEqual([]);
      expect(plan.remove).toEqual([]);
      expect(plan.tombstones).toEqual([]);
    });

    /**
     * Caso: quien reciba el plan necesita poder señalarle al usuario DÓNDE están las filas en
     * conflicto, no solo que existen.
     * Entrada: dos entradas del mismo id, con referencias distintas y reconocibles (1 y 2).
     * Salida: `duplicates` incluye ambas referencias juntas, no solo el id.
     */
    it('se reporta con todas sus referencias', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              { id: '1', value: 'x', fingerprint: 'fp', version: null, deleted: false, ref: 1 },
              { id: '1', value: 'y', fingerprint: 'fp', version: null, deleted: false, ref: 2 },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.duplicates).toEqual([{ collection: 'a', id: '1', refs: [1, 2] }]);
    });
  });

  describe('reconcile · barreras estructurales', () => {
    /**
     * Caso: la colección (tabla, recurso, lo que sea del destino) desapareció por completo — alguien
     * la borró, o se renombró, o el ciclo la lee mal.
     * Entrada: snapshot con `present: false`.
     * Salida: `aborted: { kind: 'missing-collection' }` — se niega a decidir nada para esa colección.
     */
    it('una colección ausente en el destino aborta el ciclo entero', () => {
      const plan = reconcile({
        base: [{ collection: 'a', present: false, items: [] }],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.aborted).toEqual({ kind: 'missing-collection', collection: 'a' });
    });

    /**
     * Caso: una colección legítimamente sin datos todavía (recién creada, o vaciada a propósito) no
     * es un error — es un estado normal.
     * Entrada: snapshot con `present: true`, `items: []`.
     * Salida: `aborted: null` — vacío y ausente no son lo mismo.
     */
    it('una colección presente pero vacía NO aborta: vacío y ausente no son lo mismo', () => {
      const plan = reconcile({
        base: [{ collection: 'a', present: true, items: [] }],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.aborted).toBeNull();
    });

    /**
     * Caso: si una colección falla la barrera, ni siquiera se procesan las demás — mejor no decidir
     * nada a medias que dejar el sistema en un estado parcialmente aplicado.
     * Entrada: 'a' está bien y tendría una subida pendiente (un alta local); 'b' está ausente.
     * Salida: `aborted` por 'b', y la subida de 'a' NUNCA llega a calcularse.
     */
    it('todas las colecciones se comprueban antes de decidir nada', () => {
      const plan = reconcile({
        base: [
          { collection: 'a', present: true, items: [] },
          { collection: 'b', present: false, items: [] },
        ],
        data: { a: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }] },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.aborted).toEqual({ kind: 'missing-collection', collection: 'b' });
      expect(plan.push).toEqual([]);
    });
  });

  describe('reconcile · varias colecciones', () => {
    /**
     * Caso: el mismo id puede significar cosas completamente distintas en dos colecciones sin que el
     * motor las confunda.
     * Entrada: colección 'a' con un alta local (id '1'); colección 'b' con un registro vivo en el
     * destino sin nada aquí (id '1' también).
     * Salida: cada una decide lo suyo de forma independiente — 'a' sube, 'b' marca lápida.
     */
    it('colecciones independientes no mezclan sus decisiones', () => {
      const plan = reconcile({
        base: [
          { collection: 'a', present: true, items: [] },
          {
            collection: 'b',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: null,
                deleted: false,
                ref: 9,
              },
            ],
          },
        ],
        data: { a: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }] },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toEqual([
        {
          collection: 'a',
          id: '1',
          value: 'contenido',
          fingerprint: 'fp',
          version: '1700000000000-0000-origina',
        },
      ]);
      expect(plan.tombstones).toEqual([
        { collection: 'b', id: '1', ref: 9, version: '1700000000000-0001-origina' },
      ]);
    });

    /**
     * Caso: el mismo id, en dos colecciones distintas, converge en una y colisiona en la otra — sin
     * que una decisión contamine a la otra.
     * Entrada: colección 'a' con la misma huella en los dos lados (converge); colección 'b' con huella
     * distinta y sin fecha local conocida (conflicto a ciegas, gana el destino).
     * Salida: 'a' no genera `apply`; 'b' sí.
     */
    it('el mismo id en dos colecciones distintas se decide de forma independiente', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp-a',
                version: null,
                deleted: false,
                ref: 1,
              },
            ],
          },
          {
            collection: 'b',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-b-remoto',
                version: '0000000002000-0000-origina',
                deleted: false,
                ref: 2,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido', fingerprint: 'fp-a', changedAt: null }],
          b: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-b-local', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply.find((item) => item.collection === 'a')).toBeUndefined();
      expect(plan.apply.find((item) => item.collection === 'b')).toBeDefined();
    });
  });

  describe('reconcile · pureza y determinismo', () => {
    /**
     * Caso: garantía básica de que el motor es una función pura — la propiedad que permite probarlo
     * exhaustivamente sin red ni base de datos real.
     * Entrada: la misma entrada, llamada dos veces.
     * Salida: el mismo plan, byte a byte, las dos veces.
     */
    it('la misma entrada produce siempre el mismo plan', () => {
      const request = {
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remoto',
                version: '0000000002000-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-otra', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      };

      expect(reconcile(request)).toEqual(reconcile(request));
    });

    /**
     * Caso: quien llama al motor tiene que poder reutilizar sus propios objetos de entrada después,
     * sin miedo a que el motor los haya modificado por dentro.
     * Entrada: una entrada cualquiera, comparada (por valor, vía JSON) antes y después de llamar al
     * motor.
     * Salida: exactamente igual antes y después — el motor no muta nada que reciba.
     */
    it('el motor no muta ninguno de los objetos de entrada', () => {
      const request = {
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido-remoto',
                fingerprint: 'fp-remoto',
                version: '0000000002000-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido-local', fingerprint: 'fp-otra', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      };
      const before = JSON.parse(JSON.stringify(request)) as unknown;

      reconcile(request);

      expect(JSON.parse(JSON.stringify(request)) as unknown).toEqual(before);
    });

    /**
     * Caso: si un adaptador lee los registros del destino en un orden distinto en cada ciclo (algo
     * habitual en muchas APIs), eso no puede cambiar qué se decide. Se usan dos conflictos a ciegas
     * (el destino gana respetando su propia versión, sin consumir ningún tick del reloj) para que el
     * resultado no dependa además del desempate de contador, que sí es legítimamente sensible al
     * orden — ver el describe de "reloj lógico híbrido".
     * Entrada: dos ids, cada uno con `base` y `data` de huella distinta, presentados en los dos
     * órdenes posibles.
     * Salida: el mismo conjunto de decisiones, comparado id a id.
     */
    it('el orden de llegada de los registros no afecta al resultado', () => {
      const itemA = {
        id: 'a',
        value: 'contenido-remoto-a',
        fingerprint: 'fp-remoto-a',
        version: '0000000000500-0000-origina',
        deleted: false,
        ref: 1,
      };
      const itemB = {
        id: 'b',
        value: 'contenido-remoto-b',
        fingerprint: 'fp-remoto-b',
        version: '0000000000600-0000-origina',
        deleted: false,
        ref: 2,
      };
      const data = {
        x: [
          { id: 'a', value: 'contenido-local-a', fingerprint: 'fp-local-a', changedAt: null },
          { id: 'b', value: 'contenido-local-b', fingerprint: 'fp-local-b', changedAt: null },
        ],
      };

      const first = reconcile({
        base: [{ collection: 'x', present: true, items: [itemA, itemB] }],
        data,
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      const second = reconcile({
        base: [{ collection: 'x', present: true, items: [itemB, itemA] }],
        data,
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const byId = (plan: typeof first) => [...plan.apply].sort((x, y) => x.id.localeCompare(y.id));
      expect(byId(first)).toEqual(byId(second));
    });

    /**
     * Caso: el motor tiene que poder llamarse desde cualquier contexto síncrono, sin `await` — es un
     * cálculo, no una operación de I/O.
     * Entrada: cualquier entrada válida.
     * Salida: el resultado NO es una `Promise`.
     */
    it('el motor no realiza ninguna operación asíncrona: su resultado no es una promesa', () => {
      const result = reconcile({ base: [], data: {}, now: 1_700_000_000_000, originId: 'origina' });
      expect(result).not.toBeInstanceOf(Promise);
    });
  });

  describe('reconcile · contrato de opacidad', () => {
    /**
     * Caso: el motor no necesita entender qué es "una fila" o "un documento" — solo reenvía, intacta,
     * la referencia que el adaptador le dio, para que ese mismo adaptador sepa después dónde escribir.
     * Entrada: un `ref` con forma de objeto arbitrario (`{ hoja, fila }`), en un registro que se borra
     * aquí y se marca como lápida.
     * Salida: `tombstones[0].ref` es EXACTAMENTE (`===`) el mismo objeto que se pasó, sin copiar ni
     * tocar.
     */
    it('la referencia de una lápida se devuelve intacta, sea cual sea su forma', () => {
      const ref = { hoja: 'Insumos', fila: 42 };
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: null,
                deleted: false,
                ref,
              },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.tombstones[0]?.ref).toBe(ref);
    });

    /**
     * Caso: lo mismo, pero para la referencia de una lápida que se purga.
     * Entrada: un `ref` con forma de string (`'doc/abc-123'`, como sería en un backend de documentos).
     * Salida: `purge[0].ref` es ese mismo string, sin transformar.
     */
    it('la referencia de una purga se devuelve intacta', () => {
      const ref = 'doc/abc-123';
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'x',
                fingerprint: 'fp',
                version: '0000000000000-0000-origina',
                deleted: true,
                ref,
              },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.purge[0]?.ref).toBe(ref);
    });

    /**
     * Caso: cualquier forma de contenido (un objeto anidado, lo que sea) tiene que poder viajar por el
     * motor sin que lo interprete ni lo transforme, tanto al subir como al traer.
     * Entrada: un `value` con un objeto anidado arbitrario, en un alta local y en un registro que se
     * aplica.
     * Salida: `push[0].value` y `apply[0].value` son EXACTAMENTE (`===`) esos mismos objetos.
     */
    it('el valor de un registro nunca se inspecciona, solo se transporta', () => {
      const pushed = { compuesto: true, anidado: { x: 1 } };
      const applied = { compuesto: false, anidado: { x: 2 } };

      const pushPlan = reconcile<{ compuesto: boolean; anidado: { x: number } }>({
        base: [{ collection: 'a', present: true, items: [] }],
        data: { a: [{ id: '1', value: pushed, fingerprint: 'fp', changedAt: null }] },
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      expect(pushPlan.push[0]?.value).toBe(pushed);

      const applyPlan = reconcile<{ compuesto: boolean; anidado: { x: number } }>({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: applied,
                fingerprint: 'fp-remoto',
                version: '0000000002000-0000-origina',
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [
            {
              id: '1',
              value: { compuesto: true, anidado: { x: 9 } },
              fingerprint: 'fp-local',
              changedAt: null,
            },
          ],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      expect(applyPlan.apply[0]?.value).toBe(applied);
    });
  });

  describe('reconcile · robustez de entrada', () => {
    /**
     * Caso: el caso más simple posible — nada en ningún lado.
     * Entrada: `base` y `data` vacíos.
     * Salida: el plan inicial, completamente vacío, sin lanzar ninguna excepción.
     */
    it('una entrada completamente vacía no hace nada y no falla', () => {
      const plan = reconcile({ base: [], data: {}, now: 1_700_000_000_000, originId: 'origina' });

      expect(plan).toEqual({
        aborted: null,
        apply: [],
        remove: [],
        push: [],
        tombstones: [],
        purge: [],
        duplicates: [],
        conflicts: [],
      });
    });

    /**
     * Caso: `data` trae una colección que el adaptador ni siquiera incluyó en la lista de colecciones
     * a mirar (`base` no la menciona) — por ejemplo, se retiró del esquema. No debe generar ningún
     * efecto, ni tampoco hacer que el motor falle.
     * Entrada: `base` solo trae 'a' (que converge sin acción); `data` trae 'a' y además 'fantasma',
     * que no aparece en `base`.
     * Salida: nada relacionado con 'fantasma' aparece en ninguna lista del plan; 'a' converge con
     * normalidad.
     */
    it('una colección que solo existe en `data`, sin entrada en `base`, se ignora por completo', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: '1',
                value: 'contenido',
                fingerprint: 'fp',
                version: null,
                deleted: false,
                ref: 1,
              },
            ],
          },
        ],
        data: {
          a: [{ id: '1', value: 'contenido', fingerprint: 'fp', changedAt: null }],
          fantasma: [{ id: '9', value: 'contenido', fingerprint: 'fp', changedAt: null }],
        },
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toEqual([]);
      expect(plan.apply).toEqual([]);
      expect(plan.remove).toEqual([]);
      expect(plan.tombstones).toEqual([]);
      expect(plan.aborted).toBeNull();
    });

    /**
     * Caso: un registro que llegó ya borrado y muy viejo, y que nunca existió aquí — el destino
     * conserva lápidas de antes de que este dispositivo empezara a sincronizar. Debe poder purgarse
     * sin generar ningún otro efecto.
     * Entrada: `base` con un registro `deleted: true`, versión de hace mucho; sin nada en `data`.
     * Salida: `purge` incluye el registro; ni `tombstones` ni `remove`; `aborted` sigue `null`.
     */
    it('un borrado ya viejo que nunca existió aquí se purga del destino sin ningún otro efecto', () => {
      const plan = reconcile({
        base: [
          {
            collection: 'a',
            present: true,
            items: [
              {
                id: 'fantasma',
                value: 'x',
                fingerprint: 'fp',
                version: '0000000000000-0000-origina', // muy anterior a `now`, sobra para el TTL de 90 días
                deleted: true,
                ref: 'fila-77',
              },
            ],
          },
        ],
        data: {},
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.purge).toEqual([{ collection: 'a', id: 'fantasma', ref: 'fila-77' }]);
      expect(plan.tombstones).toEqual([]);
      expect(plan.remove).toEqual([]);
      expect(plan.aborted).toBeNull();
    });
  });
});
