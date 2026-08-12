import { reconcile } from './reconcile';
import { Registro } from './engine.types';

/**
 * El motor no depende de ninguna librería, ni hace red ni I/O: es una función pura, así que estos son
 * tests unitarios en el sentido más estricto — sin `TestBed`, sin dobles, sin async.
 *
 * El motor compara solo dos copias: `data` (aquí) contra `base` (el destino, la fuente de verdad).
 * No hay una tercera copia ancestral que persistir entre ciclos, y siempre es UNA sola colección:
 * `base`/`data` son arrays planos de `Registro` (`{ values, auditoria }`), no colecciones anidadas.
 *
 * `auditoria.id` no es el valor del identificador: es el NOMBRE del campo de `values` donde vive
 * (por defecto `'id'`). Estos tests usan siempre `values.id` y omiten `auditoria.id` para dejar el
 * default en juego, salvo el caso que ejercita explícitamente un nombre de campo distinto.
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
     * Entrada: `base` vacío; `data` tiene un registro.
     * Salida: `push` con el registro completo y una versión nueva emitida por el reloj — es un alta,
     * no hay nada que comparar.
     */
    it('un dato nuevo aquí, que el destino nunca vio, se sube', () => {
      const plan = reconcile({
        base: [],
        data: [
          {
            values: { id: '1', contenido: 'x' },
            auditoria: { keyfinder: 'fp', deleted: false, createdAt: '0000000000100-0000-origina' },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toEqual([
        {
          values: { id: '1', contenido: 'x' },
          auditoria: {
            id: undefined,
            keyfinder: 'fp',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
      expect(plan.apply).toEqual([]);
    });
  });

  describe('reconcile · aquí no se tiene todavía (ausente en `data`)', () => {
    /**
     * Caso: primera sincronización, o simplemente un registro que este dispositivo nunca ha visto —
     * el destino ya lo tiene y aquí no aparece en el snapshot local completo.
     * Entrada: `base` trae el registro vivo; `data` no tiene nada para ese id.
     * Salida: `apply` — se trae. No hay ninguna acción de "borrado por ausencia": eso ya no existe.
     */
    it('un registro que el destino tiene y aquí no aparece en el snapshot local se trae', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        data: [],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply).toEqual([
        {
          values: { id: '1', contenido: 'remoto' },
          auditoria: {
            id: undefined,
            keyfinder: 'fp',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '0000000000500-0000-origina',
          },
        },
      ]);
      expect(plan.push).toEqual([]);
      expect(plan.conflicts).toEqual([]);
    });

    /**
     * Caso: lo mismo, pero el destino no trae ninguna versión escrita en absoluto (ni `createdAt` ni
     * `updatedAt` legibles) — hay que sintetizar una para poder traerlo con una versión válida.
     * Entrada: `base` sin `updatedAt` y con `createdAt` ilegible; `data` vacío.
     * Salida: `apply` con una versión recién emitida por el reloj del ciclo.
     */
    it('si el destino no trae ninguna fecha legible, se sintetiza una versión al traerlo', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: { keyfinder: 'fp', deleted: false, createdAt: 'no-es-una-version' },
          },
        ],
        data: [],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply[0]?.auditoria.updatedAt).toBe('1700000000000-0000-origina');
    });
  });

  describe('reconcile · el destino manda cuando ya está borrado (incondicional)', () => {
    /**
     * Caso: el dato se borró en el destino (otro dispositivo, o directamente ahí) mientras aquí
     * seguía presente — el destino es la fuente de verdad, así que gana sin comparar nada: ni
     * huella, ni fecha.
     * Entrada: `base` con `deleted: true`; `data` todavía activo, con contenido y huella distintos.
     * Salida: `apply` con el registro borrado; nada se sube, no hay conflicto.
     */
    it('un registro borrado en el destino se trae aquí también, aunque siga presente localmente', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'x' },
            auditoria: {
              keyfinder: 'fp',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'x-local' },
            auditoria: {
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '1699999999999-0000-origina', // más reciente que el borrado del destino
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply).toEqual([
        {
          values: { id: '1', contenido: 'x' },
          auditoria: {
            id: undefined,
            keyfinder: 'fp',
            deleted: true,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '0000000000500-0000-origina',
          },
        },
      ]);
      expect(plan.push).toEqual([]);
      expect(plan.conflicts).toEqual([]);
    });

    /**
     * Caso: igual que arriba, pero el destino no trae ninguna versión escrita para el borrado — hay
     * que sintetizar una nueva para poder confirmarlo aquí.
     * Entrada: `base` con `deleted: true` y sin `updatedAt`/`createdAt` legibles; `data` activo.
     * Salida: `apply` con una versión recién emitida por el reloj.
     */
    it('si el destino no trae versión al borrar, se sintetiza una nueva al confirmarlo aquí', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'x' },
            auditoria: { keyfinder: 'fp', deleted: true, createdAt: 'no-es-una-version' },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'y' },
            auditoria: {
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply[0]?.auditoria.updatedAt).toBe('1700000000000-0000-origina');
    });

    /**
     * Caso: el destino manda incluso cuando el contenido de aquí es idéntico al que tenía el destino
     * antes de borrarse — no es la huella la que decide este caso, es el `deleted` de `base`.
     * Entrada: `base` con `deleted: true` y la MISMA huella que `data`.
     * Salida: `apply` de todos modos; nada de `push` ni conflicto.
     */
    it('un registro borrado en el destino se trae aquí también aunque la huella coincida', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'x' },
            auditoria: {
              keyfinder: 'fp',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'x' },
            auditoria: {
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply).toHaveLength(1);
      expect(plan.apply[0]?.auditoria.deleted).toBe(true);
      expect(plan.push).toEqual([]);
      expect(plan.conflicts).toEqual([]);
    });
  });

  describe('reconcile · borrado local: compite por fecha, sin privilegio', () => {
    /**
     * Caso: aquí se borró el dato mientras el destino seguía con el registro activo. A diferencia del
     * borrado del destino (incondicional), el borrado local es un cambio como cualquier otro: gana
     * quien tenga la fecha más reciente.
     * Entrada: `base` activo con versión 2000; `data` con `deleted: true` y `updatedAt` = 3000 (más
     * reciente).
     * Salida: conflicto a favor de lo local; se sube el borrado (`push` con `deleted: true`).
     */
    it('borrado aquí más reciente que el destino: gana lo local, se sube el borrado', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'local', blind: false }]);
      expect(plan.push).toEqual([
        {
          values: { id: '1', contenido: 'remoto' },
          auditoria: {
            id: undefined,
            keyfinder: 'fp-remoto',
            deleted: true,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
      expect(plan.apply).toEqual([]);
    });

    /**
     * Caso: mismo desacuerdo, pero el destino cambió después del borrado local (alguien lo revivió, o
     * lo editó, más tarde) — el destino gana y el registro vuelve a estar activo aquí.
     * Entrada: `base` activo con versión 9000; `data` con `deleted: true` y `updatedAt` = 3000.
     * Salida: conflicto a favor del destino; se aplica su contenido (activo).
     */
    it('destino más reciente que el borrado local: gana el destino, revive aquí', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto-revivido' },
            auditoria: {
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000009000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'remoto-revivido' },
            auditoria: {
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'remote', blind: false }]);
      expect(plan.apply).toEqual([
        {
          values: { id: '1', contenido: 'remoto-revivido' },
          auditoria: {
            id: undefined,
            keyfinder: 'fp-remoto',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '0000000009000-0000-origina',
          },
        },
      ]);
      expect(plan.push).toEqual([]);
    });
  });

  describe('reconcile · sin cambios', () => {
    /**
     * Caso: nadie tocó el dato desde la última vez que se miró — ni aquí ni en el destino.
     * Entrada: `base` y `data` tienen la MISMA huella, y ninguno está borrado.
     * Salida: nada que subir, ni traer, ni conflicto — el plan queda vacío para este id.
     */
    it('misma huella en los dos lados, ninguno borrado, no genera ninguna acción', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'x' },
            auditoria: {
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'x' },
            auditoria: { keyfinder: 'fp', deleted: false, createdAt: '0000000000100-0000-origina' },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toEqual([]);
      expect(plan.apply).toEqual([]);
      expect(plan.conflicts).toEqual([]);
    });
  });

  describe('reconcile · conflicto de contenido: gana la fecha más reciente', () => {
    /**
     * Caso: el dato cambió en los dos lados desde la última vez y hay que desempatar por fecha; la
     * edición de aquí es más reciente que la del destino.
     * Entrada: `base` viva con versión 2000; `data` con huella distinta y `updatedAt` = 3000.
     * Salida: conflicto a favor de lo local; se sube el registro de aquí.
     */
    it('huella distinta y local más reciente: gana lo local, se sube', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'local' },
            auditoria: {
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'local', blind: false }]);
      expect(plan.push).toEqual([
        {
          values: { id: '1', contenido: 'local' },
          auditoria: {
            id: undefined,
            keyfinder: 'fp-local',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
      expect(plan.apply).toEqual([]);
    });

    /**
     * Caso: mismo desacuerdo, pero esta vez la versión del destino es posterior a la edición de aquí.
     * Entrada: `base` viva con versión 9000; `data` con huella distinta y `updatedAt` = 3000.
     * Salida: conflicto a favor del destino; se aplica su contenido, con su propia versión respetada
     * tal cual.
     */
    it('huella distinta y remoto más reciente: gana el destino, se aplica', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000009000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'local' },
            auditoria: {
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'remote', blind: false }]);
      expect(plan.apply).toEqual([
        {
          values: { id: '1', contenido: 'remoto' },
          auditoria: {
            id: undefined,
            keyfinder: 'fp-remote',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '0000000009000-0000-origina',
          },
        },
      ]);
      expect(plan.push).toEqual([]);
    });

    /**
     * Caso: no se sabe cuándo se editó aquí (ni `updatedAt` ni `createdAt` legibles) — el destino
     * gana por precaución.
     * Entrada: `data` sin fecha legible, huella distinta a la de `base`.
     * Salida: conflicto a favor del destino, marcado `blind: true`.
     */
    it('sin fecha local legible: gana el destino, marcado como a ciegas', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'local' },
            auditoria: { keyfinder: 'fp-local', deleted: false, createdAt: 'no-es-una-version' },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'remote', blind: true }]);
      expect(plan.apply).toHaveLength(1);
      expect(plan.apply[0]?.values).toEqual({ id: '1', contenido: 'remoto' });
      expect(plan.push).toEqual([]);
    });

    /**
     * Caso: el destino no trae ninguna versión legible — hay que sintetizar una para poder comparar,
     * y esa sintetizada es la que se aplica si gana.
     * Entrada: `base` sin fecha legible, huella distinta; `data` sin fecha legible tampoco (a ciegas,
     * gana el destino).
     * Salida: conflicto a favor del destino, `blind: true`; se aplica con la versión recién emitida
     * por el reloj del ciclo.
     */
    it('si el destino no trae versión, se sintetiza una para poder comparar en el conflicto', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: { keyfinder: 'fp-remote', deleted: false, createdAt: 'no-es-una-version' },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'local' },
            auditoria: { keyfinder: 'fp-local', deleted: false, createdAt: 'no-es-una-version' },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'remote', blind: true }]);
      expect(plan.apply[0]?.auditoria.updatedAt).toBe('1700000000000-0000-origina');
    });
  });

  describe('reconcile · reloj lógico híbrido (HLC)', () => {
    /**
     * Caso: dos altas locales decididas dentro del mismo ciclo — deben quedar ordenadas de forma
     * inequívoca aunque compartan el mismo milisegundo.
     * Entrada: dos registros nuevos en `data`, ninguno en `base`.
     * Salida: el primero decidido lleva contador 0; el segundo, contador 1.
     */
    it('dos escrituras dentro del mismo ciclo se desempatan por contador', () => {
      const plan = reconcile({
        base: [],
        data: [
          {
            values: { id: '1', contenido: 'x' },
            auditoria: { keyfinder: 'fp', deleted: false, createdAt: '0000000000100-0000-origina' },
          },
          {
            values: { id: '2', contenido: 'y' },
            auditoria: {
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const byId = (id: string) => plan.push.find((registro) => registro.values['id'] === id);
      expect(byId('1')?.auditoria.updatedAt).toBe('1700000000000-0000-origina');
      expect(byId('2')?.auditoria.updatedAt).toBe('1700000000000-0001-origina');
    });

    /**
     * Caso: dos orígenes editaron exactamente en el mismo instante lógico (mismo milisegundo y mismo
     * contador) — hace falta un criterio de desempate que dé SIEMPRE el mismo resultado.
     * Entrada: `base` version=(5000, 0, 'deviceb'); `data.updatedAt`=(5000, 0, 'devicea').
     * Salida: gana 'deviceb' (mayor en orden alfabético) — el destino.
     */
    it('mismo instante y contador se desempatan por el origen, de forma determinista', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000005000-0000-deviceb',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'local' },
            auditoria: {
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000005000-0000-devicea',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      // 'devicea' < 'deviceb': el destino gana el empate, en cualquier réplica que lo evalúe.
      expect(plan.conflicts).toEqual([{ id: '1', winner: 'remote', blind: false }]);
    });

    /**
     * Caso: el reloj de este origen va "atrasado" respecto a lo que ya se ha visto escrito en el
     * destino (por ejemplo, por otro dispositivo) — no debe retroceder al emitir una versión nueva.
     * Entrada: un registro convergido (misma huella, ninguno borrado) con una versión observada más
     * adelantada que `now`, dentro del margen de tolerancia; y un alta local que necesita versión
     * nueva.
     * Salida: la versión del alta nace POR DELANTE de lo observado (mismo milisegundo, contador
     * siguiente), nunca detrás de `now` a secas.
     */
    it('el reloj nunca emite una versión anterior a la última observada, aunque "ahora" sea menor', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: 'semilla', contenido: 'x' },
            auditoria: {
              keyfinder: 'fp',
              deleted: false,
              createdAt: '1700000200000-0003-otroorigen',
            },
          },
        ],
        data: [
          {
            values: { id: 'semilla', contenido: 'x' },
            auditoria: { keyfinder: 'fp', deleted: false, createdAt: '0000000000100-0000-origina' },
          },
          {
            values: { id: 'empuje', contenido: 'y' },
            auditoria: {
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toHaveLength(1);
      expect(plan.push[0]?.auditoria.updatedAt).toBe('1700000200000-0004-origina');
    });

    /**
     * Caso: alguien (o un error) dejó una fecha absurda en el destino — mucho más allá de lo que
     * cualquier reloj real justificaría — y no debe contaminar el resto del sistema.
     * Entrada: un conflicto cuya versión de `base` está 10 minutos en el futuro (el margen de
     * tolerancia es de 5 min) y `data` a ciegas (gana el destino); y un alta local que se decide
     * después, en el mismo ciclo.
     * Salida: la versión aplicada NO es la corrupta, sino una sintetizada en "ahora"; lo que se sube
     * DESPUÉS nace en el mismo milisegundo (contador siguiente), no en el futuro.
     */
    it('una versión remota del futuro no adelanta el reloj y se re-estampa', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '1700000600000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'local' },
            auditoria: { keyfinder: 'fp-local', deleted: false, createdAt: 'no-es-una-version' },
          },
          {
            values: { id: '2', contenido: 'x' },
            auditoria: {
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const applied = plan.apply.find((registro) => registro.values['id'] === '1');
      const pushed = plan.push.find((registro) => registro.values['id'] === '2');
      expect(applied?.auditoria.updatedAt).not.toBe('1700000600000-0000-origina');
      expect(applied?.auditoria.updatedAt).toBe('1700000000000-0000-origina');
      expect(pushed?.auditoria.updatedAt).toBe('1700000000000-0001-origina');
    });
  });

  describe('reconcile · identidad duplicada', () => {
    /**
     * Caso: dos registros del destino reclaman el mismo id — un error de datos, o dos altas que
     * colisionaron. No se puede saber cuál es el de verdad, así que no se toca ninguno.
     * Entrada: `base` con dos entradas para el id '1' (contenidos distintos); `data` con su propio
     * contenido para ese mismo id.
     * Salida: nada se aplica ni se sube para ese id — queda congelado hasta que alguien lo arregle a
     * mano en el destino.
     */
    it('un id repetido en el destino no se toca por ningún lado', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'uno' },
            auditoria: { keyfinder: 'fp-uno', deleted: false, createdAt: 'no-es-una-version' },
          },
          {
            values: { id: '1', contenido: 'dos' },
            auditoria: { keyfinder: 'fp-dos', deleted: false, createdAt: 'no-es-una-version' },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'local' },
            auditoria: { keyfinder: 'fp-local', deleted: false, createdAt: 'no-es-una-version' },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply).toEqual([]);
      expect(plan.push).toEqual([]);
    });

    /**
     * Caso: quien reciba el plan necesita poder ver los registros en conflicto, no solo que existen.
     * Entrada: dos entradas del mismo id, con contenidos distintos y reconocibles.
     * Salida: `duplicates` incluye los dos registros completos, no solo el id.
     */
    it('se reporta con todos sus registros', () => {
      const uno: Registro<{ id: string; contenido: string }> = {
        values: { id: '1', contenido: 'x' },
        auditoria: { keyfinder: 'fp', deleted: false, createdAt: 'no-es-una-version' },
      };
      const dos: Registro<{ id: string; contenido: string }> = {
        values: { id: '1', contenido: 'y' },
        auditoria: { keyfinder: 'fp', deleted: false, createdAt: 'no-es-una-version' },
      };

      const plan = reconcile({ base: [uno, dos], data: [], now: 1_700_000_000_000, originId: 'a' });

      expect(plan.duplicates).toEqual([{ id: '1', registros: [uno, dos] }]);
    });
  });

  describe('reconcile · varios registros', () => {
    /**
     * Caso: dos ids independientes en la misma colección no se contaminan entre sí.
     * Entrada: id '1' con un alta local; id '2' con un registro vivo en el destino sin nada aquí.
     * Salida: cada uno decide lo suyo de forma independiente — '1' sube, '2' se trae.
     */
    it('ids independientes no mezclan sus decisiones', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '2', contenido: 'x' },
            auditoria: { keyfinder: 'fp', deleted: false, createdAt: '0000000000100-0000-origina' },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'y' },
            auditoria: {
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toHaveLength(1);
      expect(plan.push[0]?.values['id']).toBe('1');
      expect(plan.apply).toHaveLength(1);
      expect(plan.apply[0]?.values['id']).toBe('2');
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
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'local' },
            auditoria: {
              keyfinder: 'fp-otra',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
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
            values: { id: '1', contenido: 'remoto' },
            auditoria: {
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', contenido: 'local' },
            auditoria: {
              keyfinder: 'fp-otra',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
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
      const registroA = {
        values: { id: 'a', contenido: 'remoto-a' },
        auditoria: {
          keyfinder: 'fp-remoto-a',
          deleted: false,
          createdAt: '0000000000500-0000-origina',
        },
      };
      const registroB = {
        values: { id: 'b', contenido: 'remoto-b' },
        auditoria: {
          keyfinder: 'fp-remoto-b',
          deleted: false,
          createdAt: '0000000000600-0000-origina',
        },
      };
      const data = [
        {
          values: { id: 'a', contenido: 'local-a' },
          auditoria: { keyfinder: 'fp-local-a', deleted: false, createdAt: 'no-es-una-version' },
        },
        {
          values: { id: 'b', contenido: 'local-b' },
          auditoria: { keyfinder: 'fp-local-b', deleted: false, createdAt: 'no-es-una-version' },
        },
      ];

      const first = reconcile({
        base: [registroA, registroB],
        data,
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      const second = reconcile({
        base: [registroB, registroA],
        data,
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const byId = (plan: typeof first) =>
        [...plan.apply].sort((x, y) =>
          String(x.values['id']).localeCompare(String(y.values['id'])),
        );
      expect(byId(first)).toEqual(byId(second));
    });

    /**
     * Caso: el motor tiene que poder llamarse desde cualquier contexto síncrono, sin `await` — es un
     * cálculo, no una operación de I/O.
     * Entrada: cualquier entrada válida.
     * Salida: el resultado NO es una `Promise`.
     */
    it('el motor no realiza ninguna operación asíncrona: su resultado no es una promesa', () => {
      const result = reconcile({ base: [], data: [], now: 1_700_000_000_000, originId: 'origina' });
      expect(result).not.toBeInstanceOf(Promise);
    });
  });

  describe('reconcile · contrato de opacidad', () => {
    /**
     * Caso: cualquier forma de contenido (un objeto anidado, lo que sea) tiene que poder viajar por el
     * motor sin que lo interprete ni lo transforme. El motor nunca inspecciona `values` más allá de
     * leer el campo identificador — por eso `push[0].values` y `apply[0].values` son EXACTAMENTE
     * (`===`) los mismos objetos que llegaron en `data`/`base`.
     * Entrada: un objeto local con un campo anidado arbitrario, en un alta local; y un objeto remoto
     * anidado, en un registro que se aplica.
     * Salida: `push[0].values` y `apply[0].values` son el mismo objeto, sin copiar ni transformar.
     */
    it('el contenido de un registro nunca se inspecciona, solo se transporta', () => {
      interface Contenido {
        id: string;
        compuesto: boolean;
        anidado: { x: number };
      }
      const pushedValues: Contenido = { id: '1', compuesto: true, anidado: { x: 1 } };
      const appliedValues: Contenido = { id: '1', compuesto: false, anidado: { x: 2 } };

      const pushPlan = reconcile<Contenido>({
        base: [],
        data: [
          {
            values: pushedValues,
            auditoria: { keyfinder: 'fp', deleted: false, createdAt: '0000000000100-0000-origina' },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      expect(pushPlan.push[0]?.values).toBe(pushedValues);

      const applyPlan = reconcile<Contenido>({
        base: [
          {
            values: appliedValues,
            auditoria: {
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { id: '1', compuesto: true, anidado: { x: 9 } },
            auditoria: { keyfinder: 'fp-local', deleted: false, createdAt: 'no-es-una-version' },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      expect(applyPlan.apply[0]?.values).toBe(appliedValues);
    });
  });

  describe('reconcile · robustez de entrada', () => {
    /**
     * Caso: el caso más simple posible — nada en ningún lado.
     * Entrada: `base` y `data` vacíos.
     * Salida: el plan inicial, completamente vacío, sin lanzar ninguna excepción.
     */
    it('una entrada completamente vacía no hace nada y no falla', () => {
      const plan = reconcile({ base: [], data: [], now: 1_700_000_000_000, originId: 'origina' });

      expect(plan).toEqual({ push: [], apply: [], duplicates: [], conflicts: [] });
    });

    /**
     * Caso: un registro de `data` no tiene un id legible (falta el campo, o `values` no es ni
     * siquiera un objeto) — un registro corrupto. No puede indexarse ni compararse contra nada, así
     * que se ignora: ni sube, ni provoca que el resto de la colección falle.
     * Entrada: `base` trae el id '1' vivo; `data` trae un objeto sin campo `id`.
     * Salida: el objeto sin id no genera ningún efecto — el id '1' de `base` se trata como "aquí no
     * se tiene todavía" (el objeto inválido no cuenta como su reemplazo) y se trae con `apply`.
     */
    it('un registro de `data` sin id legible se ignora, sin hacer fallar al resto', () => {
      const plan = reconcile({
        base: [
          {
            values: { id: '1', contenido: 'x' },
            auditoria: { keyfinder: 'fp', deleted: false, createdAt: '0000000000100-0000-origina' },
          },
        ],
        data: [
          {
            values: { contenido: 'huerfano' },
            auditoria: { keyfinder: 'fp-huerfano', deleted: false, createdAt: 'no-es-una-version' },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.apply).toHaveLength(1);
      expect(plan.apply[0]?.values).toEqual({ id: '1', contenido: 'x' });
      expect(plan.push).toEqual([]);
    });

    /**
     * Caso: se usa un `auditoria.id` distinto al predeterminado — por ejemplo, un registro cuyo
     * identificador vive en `values.sku`, no en `values.id`.
     * Entrada: `data` con `{ values: { sku: '1', ... }, auditoria: { id: 'sku', ... } }`, huella
     * distinta a la de un `base` que usa el mismo esquema.
     * Salida: el motor resuelve el id leyendo `values.sku`, exactamente igual que si se llamara
     * `values.id` — el conflicto se decide con normalidad, no a ciegas.
     */
    it('con `auditoria.id` distinto de `id`, el motor lee el identificador por ese nombre de campo', () => {
      const plan = reconcile({
        base: [
          {
            values: { sku: '1', contenido: 'remoto' },
            auditoria: {
              id: 'sku',
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            values: { sku: '1', contenido: 'local' },
            auditoria: {
              id: 'sku',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000003000-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'local', blind: false }]);
      expect(plan.push).toEqual([
        {
          values: { sku: '1', contenido: 'local' },
          auditoria: {
            id: 'sku',
            keyfinder: 'fp-local',
            deleted: false,
            createdAt: '0000000003000-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
    });
  });
});
