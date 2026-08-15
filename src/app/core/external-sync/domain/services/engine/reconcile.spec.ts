import { nextSyncedValues, reconcile } from './reconcile';
import { Registro } from './engine.types';

/**
 * EXCEPCIÓN DELIBERADA a la regla dura de `unit-tests-conventions.md` ("los specs viven en
 * `testing/`, nunca junto al fuente"): este spec vive aquí, junto a `reconcile.ts`, y no bajo
 * `testing/domain/services/engine/`. El motor es un módulo autocontenido y portable — una función
 * pura sin `TestBed`, sin dobles, sin nada que inyectar — que se documenta y se prueba como una
 * sola pieza (`reconcile.ts` + `engine.types.ts` + `hybrid-clock.ts` + este spec + `README.md`).
 * Separar el test a `testing/` rompería esa unidad sin ganar nada: no hay dobles que compartir con
 * el resto del contexto, ni un `TestBed` que aislar. Es la única excepción de todo `external-sync/`
 * — cualquier otro spec de `domain/`/`application/` de este contexto sigue yendo en `testing/`.
 *
 * El motor no depende de ninguna librería, ni hace red ni I/O: es una función pura, así que estos son
 * tests unitarios en el sentido más estricto — sin `TestBed`, sin dobles, sin async.
 *
 * El motor compara dos copias, `data` (aquí) contra `base` (el destino, la fuente de verdad), y no
 * necesita una tercera colección aparte que alguien mantenga sincronizada. Lo que SÍ puede llevar
 * cada registro de `data` es su propio ancestro embebido (`sync.syncedValues`): los campos de
 * negocio que ese registro sabía que coincidían con el destino la última vez que convergieron. Es
 * **opcional** (se omite del todo cuando no hay ancestro, que es el caso normal y más frecuente:
 * primera sincronización de un registro) — sin él, el motor cae en "gana un lado entero por
 * versión"; con él, y sin solapamiento de campos, el motor fusiona en vez de descartar un lado
 * completo (ver el describe "fusión de campos no solapados" más abajo). Siempre es UNA sola
 * colección: `base`/`data` son arrays de `Registro` — los campos de negocio **aplanados** al nivel
 * superior del objeto, junto con sus metadatos de sincronización en `sync` — no colecciones
 * anidadas.
 *
 * `sync.id` no es el valor del identificador: es el NOMBRE del campo de negocio donde vive, y es
 * **obligatorio, sin default** — quien construye el registro tiene que decirlo explícitamente, o
 * no hay forma de validar que se está leyendo el campo correcto. Estos tests usan siempre un campo
 * `id` propio y escriben `sync.id: 'id'` en cada registro, salvo el caso que ejercita
 * explícitamente un nombre de campo distinto (`sku`).
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
            id: '1',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toEqual([
        {
          id: '1',
          contenido: 'x',
          sync: {
            id: 'id',
            keyfinder: 'fp',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
      expect(plan.pull).toEqual([]);
    });
  });

  describe('reconcile · aquí no se tiene todavía (ausente en `data`)', () => {
    /**
     * Caso: primera sincronización, o simplemente un registro que este dispositivo nunca ha visto —
     * el destino ya lo tiene y aquí no aparece en el snapshot local completo.
     * Entrada: `base` trae el registro vivo; `data` no tiene nada para ese id.
     * Salida: `pull` — se trae. No hay ninguna acción de "borrado por ausencia": eso ya no existe.
     */
    it('un registro que el destino tiene y aquí no aparece en el snapshot local se trae', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
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

      expect(plan.pull).toEqual([
        {
          id: '1',
          contenido: 'remoto',
          sync: {
            id: 'id',
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
     * Salida: `pull` con una versión recién emitida por el reloj del ciclo.
     */
    it('si el destino no trae ninguna fecha legible, se sintetiza una versión al traerlo', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        data: [],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.pull[0]?.sync.updatedAt).toBe('1700000000000-0000-origina');
    });
  });

  describe('reconcile · el destino manda cuando ya está borrado (incondicional)', () => {
    /**
     * Caso: el dato se borró en el destino (otro dispositivo, o directamente ahí) mientras aquí
     * seguía presente — el destino es la fuente de verdad, así que gana sin comparar nada: ni
     * huella, ni fecha.
     * Entrada: `base` con `deleted: true`; `data` todavía activo, con contenido y huella distintos.
     * Salida: `pull` con el registro borrado; nada se sube, no hay conflicto.
     */
    it('un registro borrado en el destino se trae aquí también, aunque siga presente localmente', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'x-local',
            sync: {
              id: 'id',
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

      expect(plan.pull).toEqual([
        {
          id: '1',
          contenido: 'x',
          sync: {
            id: 'id',
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
     * Salida: `pull` con una versión recién emitida por el reloj.
     */
    it('si el destino no trae versión al borrar, se sintetiza una nueva al confirmarlo aquí', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: true,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.pull[0]?.sync.updatedAt).toBe('1700000000000-0000-origina');
    });

    /**
     * Caso: el destino manda incluso cuando el contenido de aquí es idéntico al que tenía el destino
     * antes de borrarse — no es la huella la que decide este caso, es el `deleted` de `base`.
     * Entrada: `base` con `deleted: true` y la MISMA huella que `data`.
     * Salida: `pull` de todos modos; nada de `push` ni conflicto.
     */
    it('un registro borrado en el destino se trae aquí también aunque la huella coincida', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'x',
            sync: {
              id: 'id',
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

      expect(plan.pull).toHaveLength(1);
      expect(plan.pull[0]?.sync.deleted).toBe(true);
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
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
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
          id: '1',
          contenido: 'remoto',
          sync: {
            id: 'id',
            keyfinder: 'fp-remoto',
            deleted: true,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
      expect(plan.pull).toEqual([]);
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
            id: '1',
            contenido: 'remoto-revivido',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000009000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'remoto-revivido',
            sync: {
              id: 'id',
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
      expect(plan.pull).toEqual([
        {
          id: '1',
          contenido: 'remoto-revivido',
          sync: {
            id: 'id',
            keyfinder: 'fp-remoto',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '0000000009000-0000-origina',
          },
        },
      ]);
      expect(plan.push).toEqual([]);
    });

    /**
     * Caso: aunque el registro local borrado traiga un ancestro embebido (`sync.syncedValues`), un
     * borrado NUNCA se fusiona campo a campo — es un evento de todo el registro. Debe seguir
     * compitiendo por fecha exactamente igual que sin ancestro.
     * Entrada: igual que "gana el destino, revive aquí", pero `data.sync.syncedValues` trae un
     * contenido que, de mirarse campo a campo, permitiría "fusionar" — el motor no debe ni
     * intentarlo.
     * Salida: conflicto a favor del destino (por fecha, como siempre); nunca `winner: 'merged'`.
     */
    it('un borrado local con ancestro embebido sigue compitiendo por fecha, nunca se fusiona', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            contenido: 'remoto-revivido',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000009000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'remoto-revivido',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
              syncedValues: { id: '1', contenido: 'orig' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'remote', blind: false }]);
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
            id: '1',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toEqual([]);
      expect(plan.pull).toEqual([]);
      expect(plan.conflicts).toEqual([]);
    });
  });

  describe('reconcile · conflicto de contenido: gana la fecha más reciente', () => {
    /**
     * Caso: el dato cambió en los dos lados desde la última vez y hay que desempatar por fecha; la
     * edición de aquí es más reciente que la del destino. Sin ancestro embebido, así que no hay
     * información para fusionar: gana un lado entero, como siempre.
     * Entrada: `base` viva con versión 2000; `data` con huella distinta y `updatedAt` = 3000, sin
     * `syncedValues`.
     * Salida: conflicto a favor de lo local; se sube el registro de aquí.
     */
    it('huella distinta y local más reciente, sin ancestro: gana lo local, se sube', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'local',
            sync: {
              id: 'id',
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
          id: '1',
          contenido: 'local',
          sync: {
            id: 'id',
            keyfinder: 'fp-local',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
      expect(plan.pull).toEqual([]);
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
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000009000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'local',
            sync: {
              id: 'id',
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
      expect(plan.pull).toEqual([
        {
          id: '1',
          contenido: 'remoto',
          sync: {
            id: 'id',
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
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'remote', blind: true }]);
      expect(plan.pull).toHaveLength(1);
      expect(plan.pull[0]?.id).toBe('1');
      expect(plan.pull[0]?.contenido).toBe('remoto');
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
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'remote', blind: true }]);
      expect(plan.pull[0]?.sync.updatedAt).toBe('1700000000000-0000-origina');
    });
  });

  describe('reconcile · fusión de campos no solapados', () => {
    /**
     * Caso central del feature: el destino cambió un campo, local cambió OTRO campo distinto desde
     * la última vez que ambos coincidían. Con el ancestro común embebido (`sync.syncedValues`), el
     * motor puede atribuir cada cambio a su lado y fusionarlos, en vez de descartar uno de los dos
     * enteros.
     * Entrada: `syncedValues` = `{ a: 'orig-a', b: 'orig-b' }`; `base.a` cambió a `'remoto-a'` (b
     * intacto); `data.b` cambió a `'local-b'` (a intacto).
     * Salida: se generan DOS comandos — `push` y `pull` — con el MISMO registro fusionado
     * (`{ a: 'remoto-a', b: 'local-b' }`), huella vacía a propósito, y un conflicto diagnóstico
     * `winner: 'merged'` con `mergedFrom` indicando qué campo vino de cada lado.
     */
    it('destino y local cambiaron campos distintos: se fusionan, no se descarta ninguno', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            a: 'remoto-a',
            b: 'orig-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'orig-a',
            b: 'local-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', a: 'orig-a', b: 'orig-b' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const merged = {
        id: '1',
        a: 'remoto-a',
        b: 'local-b',
        sync: {
          id: 'id',
          keyfinder: '',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '1700000000000-0000-origina',
        },
      };
      expect(plan.push).toEqual([merged]);
      expect(plan.pull).toEqual([merged]);
      expect(plan.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['b'] } },
      ]);
    });

    /**
     * Caso: los dos lados cambiaron el MISMO campo a valores distintos — un solapamiento real, no
     * atribuible sin pérdida. Aunque haya ancestro, la fusión se aborta entera y se cae al criterio
     * de siempre (gana la fecha más reciente, registro completo).
     * Entrada: `syncedValues.a = 'orig'`; `base.a = 'remoto'`; `data.a = 'local'` (mismo campo,
     * valores distintos), con `data` más reciente.
     * Salida: NUNCA `winner: 'merged'` — gana lo local entero, exactamente como sin ancestro.
     */
    it('mismo campo cambiado a valores distintos en los dos lados: no se fusiona, gana un lado entero', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            a: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
              syncedValues: { id: '1', a: 'orig' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'local', blind: false }]);
      expect(plan.push).toEqual([
        {
          id: '1',
          a: 'local',
          sync: {
            id: 'id',
            keyfinder: 'fp-local',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
      expect(plan.pull).toEqual([]);
    });

    /**
     * Caso: los dos lados cambiaron el MISMO campo, pero al MISMO valor nuevo (p. ej. dos
     * dispositivos que capturaron la misma corrección) — no hay nada que perder ahí, así que no
     * cuenta como solapamiento y no bloquea la fusión del resto de campos que sí cambiaron en un
     * solo lado.
     * Entrada: `syncedValues = { a: 'orig-a', b: 'orig-b' }`; `base.a` y `data.a` cambiaron los dos
     * a `'nuevo'` (coinciden); `data.b` cambió a `'local-b'` (solo local).
     * Salida: fusiona; `mergedFrom.local` incluye `b` pero no `a` (nadie "entregó" `a` en exclusiva).
     */
    it('mismo campo al mismo valor nuevo en los dos lados no bloquea la fusión del resto', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            a: 'nuevo',
            b: 'orig-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'nuevo',
            b: 'local-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', a: 'orig-a', b: 'orig-b' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: [], local: ['b'] } },
      ]);
      expect(plan.push).toEqual([
        {
          id: '1',
          a: 'nuevo',
          b: 'local-b',
          sync: {
            id: 'id',
            keyfinder: '',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
    });

    /**
     * Caso: sin ancestro embebido (registro nunca sincronizado antes, o escrito por código previo a
     * este campo), el motor no tiene forma de atribuir un campo divergente a un lado — aunque los dos
     * cambios caigan en campos distintos, no puede saber que no se pisan. Cae al criterio de
     * siempre.
     * Entrada: igual que el caso central de fusión (campos `a`/`b` distintos), pero SIN
     * `syncedValues` en `data.sync`.
     * Salida: NUNCA `winner: 'merged'` — gana un lado entero por versión.
     */
    it('sin ancestro embebido, campos distintos cambiados no se fusionan: no hay forma de atribuirlos', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            a: 'remoto-a',
            b: 'orig-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'orig-a',
            b: 'local-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
              // Sin syncedValues: no hay ancestro con el que fusionar.
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'local', blind: false }]);
    });

    /**
     * Caso: el ancestro embebido no es un objeto plano (un dato corrupto, o de una forma que no
     * encaja) — no hay "campos" que comparar, así que la fusión ni se intenta.
     * Entrada: `data.sync.syncedValues` es un string, no un objeto; `base`/`data` difieren en
     * contenido.
     * Salida: cae al criterio de siempre, sin lanzar ninguna excepción.
     */
    it('un ancestro que no es un objeto plano no se puede usar para fusionar', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            a: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
              syncedValues: 'no-es-un-objeto' as unknown as { id: string; a: string },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: '1', winner: 'local', blind: false }]);
    });

    /**
     * Caso: local añadió un campo que no existía ni en el ancestro ni en el destino (p. ej. una
     * columna nueva del esquema, capturada aquí antes de que el destino la vea). Debe incluirse en la
     * fusión igual que cualquier otro cambio exclusivo de un lado.
     * Entrada: `syncedValues = { a: 'orig-a' }` (sin `b`); `base` cambió `a`, sin `b`; `data` no tocó
     * `a` pero añadió `b: 'nuevo-local'`.
     * Salida: fusiona; el resultado incluye `b`, y `mergedFrom.local` lo lista.
     */
    it('un campo nuevo solo en local, ausente en el ancestro y en el destino, se incluye en la fusión', () => {
      const plan = reconcile<{ id: string; a: string; b?: string }>({
        base: [
          {
            id: '1',
            a: 'remoto-a',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'orig-a',
            b: 'nuevo-local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', a: 'orig-a' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['b'] } },
      ]);
      expect(plan.push[0]?.a).toBe('remoto-a');
      expect(plan.push[0]?.b).toBe('nuevo-local');
      expect(plan.pull[0]?.a).toBe('remoto-a');
      expect(plan.pull[0]?.b).toBe('nuevo-local');
    });

    /**
     * Caso: el escenario exacto que motivó el feature — el destino cambió DOS campos y local
     * cambió un tercero, todos distintos entre sí. La fusión no se limita a "un campo por lado":
     * atribuye cada clave divergente a quien la cambió, sin importar cuántas sean.
     * Entrada: `syncedValues = { a: 'orig-a', b: 'orig-b', c: 'orig-c' }`; `base` cambió `a` y `b`;
     * `data` cambió solo `c`.
     * Salida: fusiona los tres campos; `mergedFrom.remote = ['a', 'b']`, `mergedFrom.local = ['c']`.
     */
    it('destino cambia DOS campos y local cambia uno: se fusionan los tres', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            a: 'remoto-a',
            b: 'remoto-b',
            c: 'orig-c',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'orig-a',
            b: 'orig-b',
            c: 'local-c',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', a: 'orig-a', b: 'orig-b', c: 'orig-c' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const merged = { id: '1', a: 'remoto-a', b: 'remoto-b', c: 'local-c' };
      expect(plan.push[0]).toMatchObject(merged);
      expect(plan.pull[0]).toMatchObject(merged);
      expect(plan.conflicts).toEqual([
        {
          id: '1',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: ['a', 'b'], local: ['c'] },
        },
      ]);
    });

    /**
     * Caso simétrico al anterior: local cambia DOS campos y el destino cambia solo uno. La fusión
     * no favorece a ningún lado por cuántos campos haya tocado.
     * Entrada: `base` cambió solo `a`; `data` cambió `b` y `c`.
     * Salida: fusiona los tres; `mergedFrom.remote = ['a']`, `mergedFrom.local = ['b', 'c']`.
     */
    it('local cambia DOS campos y destino cambia uno: se fusionan los tres', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            a: 'remoto-a',
            b: 'orig-b',
            c: 'orig-c',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'orig-a',
            b: 'local-b',
            c: 'local-c',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', a: 'orig-a', b: 'orig-b', c: 'orig-c' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const merged = { id: '1', a: 'remoto-a', b: 'local-b', c: 'local-c' };
      expect(plan.push[0]).toMatchObject(merged);
      expect(plan.pull[0]).toMatchObject(merged);
      expect(plan.conflicts).toEqual([
        {
          id: '1',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: ['a'], local: ['b', 'c'] },
        },
      ]);
    });

    /**
     * Caso: la fusión no está pensada solo para strings — compara por igualdad estructural
     * (`deepEqual`), así que campos numéricos y booleanos se atribuyen igual que cualquier otro.
     * Entrada: `syncedValues = { precio: 10, activo: true }`; `base` cambió `precio` a `20`; `data`
     * cambió `activo` a `false`.
     * Salida: fusiona los dos campos con sus tipos originales intactos (no se convierten a texto).
     */
    it('campos numéricos y booleanos se fusionan igual que los de texto', () => {
      const plan = reconcile<{ id: string; precio: number; activo: boolean }>({
        base: [
          {
            id: '1',
            precio: 20,
            activo: true,
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            precio: 10,
            activo: false,
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', precio: 10, activo: true },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push[0]).toMatchObject({ precio: 20, activo: false });
      expect(plan.conflicts).toEqual([
        {
          id: '1',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: ['precio'], local: ['activo'] },
        },
      ]);
    });

    /**
     * Caso: `deepEqual` compara arrays por valor, no por referencia — dos arrays con el mismo
     * contenido cuentan como "sin cambio" aunque sean instancias distintas. Necesario para que un
     * campo de negocio que sea una lista (p. ej. etiquetas) no parezca "cambiado" solo por ser un
     * objeto nuevo en memoria.
     * Entrada: `base` cambió `nombre` (con `tags` igual al ancestro, pero en un array NUEVO con el
     * mismo contenido); `data` cambió `tags` a una lista distinta.
     * Salida: fusiona; `nombre` viene de `base` y `tags` de `data`.
     */
    it('un campo de negocio que es un array se fusiona por valor, no por referencia', () => {
      const plan = reconcile<{ id: string; nombre: string; tags: string[] }>({
        base: [
          {
            id: '1',
            nombre: 'remoto',
            tags: ['a', 'b'], // mismo contenido que el ancestro, pero OTRA instancia de array
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            nombre: 'orig',
            tags: ['a', 'b', 'c'],
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', nombre: 'orig', tags: ['a', 'b'] },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push[0]).toMatchObject({ nombre: 'remoto', tags: ['a', 'b', 'c'] });
      expect(plan.conflicts).toEqual([
        {
          id: '1',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: ['nombre'], local: ['tags'] },
        },
      ]);
    });

    /**
     * Caso: un campo que el ancestro tenía y que YA NO EXISTE en ninguno de los dos lados (se quitó
     * del esquema, o del registro, en los dos sitios por igual). Los dos "cambiaron" respecto al
     * ancestro (pasó de tener valor a estar ausente), pero al MISMO valor final (`undefined`), así
     * que no es un solapamiento real y no bloquea la fusión del resto de campos.
     * Entrada: `syncedValues = { a: 'orig-a', obsoleto: 'y' }`; ni `base` ni `data` traen
     * `obsoleto`; `base` cambió `a`.
     * Salida: fusiona con normalidad; `obsoleto` no aparece en `mergedFrom` de ningún lado.
     */
    it('un campo que desaparece de los dos lados por igual no bloquea la fusión del resto', () => {
      const plan = reconcile<{ id: string; a: string; obsoleto?: string }>({
        base: [
          {
            id: '1',
            a: 'remoto-a',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'orig-a',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', a: 'orig-a', obsoleto: 'y' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: [] } },
      ]);
      expect(plan.push[0]?.obsoleto).toBeUndefined();
    });

    /**
     * Caso: las huellas no coinciden, pero al comparar campo a campo NINGUNO difiere realmente del
     * ancestro — solo cambió el propio identificador de contenido (`keyfinder`), no ningún campo de
     * negocio. Es una fusión "vacía": el motor no tiene por qué saberlo y sigue el mismo camino,
     * produciendo un `push`/`pull` que solo re-estampa huella y versión.
     * Entrada: `base` y `data` tienen el mismo contenido que el ancestro, pero huellas distintas
     * entre sí.
     * Salida: `winner: 'merged'` con `mergedFrom: { remote: [], local: [] }` — ningún campo se
     * atribuye a nadie porque ninguno cambió.
     */
    it('huellas distintas sin ningún campo realmente cambiado: fusión vacía, sin mergedFrom', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            a: 'x',
            b: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'x',
            b: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', a: 'x', b: 'y' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: [], local: [] } },
      ]);
      expect(plan.push[0]).toMatchObject({ a: 'x', b: 'y' });
    });

    /**
     * Caso: la fusión funciona igual con un `sync.id` que no sea `'id'` — el motor resuelve la
     * identidad por el nombre de campo que diga `sync.id`, y eso no cambia nada de la lógica de
     * atribución de campos.
     * Entrada: identificador en `sku`; `base` cambió `a`, `data` cambió `b`.
     * Salida: fusiona igual que con el campo `id` por defecto.
     */
    it('la fusión funciona con un sync.id distinto de "id" (p. ej. sku)', () => {
      const plan = reconcile({
        base: [
          {
            sku: '1',
            a: 'remoto-a',
            b: 'orig-b',
            sync: {
              id: 'sku',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            sku: '1',
            a: 'orig-a',
            b: 'local-b',
            sync: {
              id: 'sku',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { sku: '1', a: 'orig-a', b: 'orig-b' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['b'] } },
      ]);
      expect(plan.push[0]).toMatchObject({ sku: '1', a: 'remoto-a', b: 'local-b' });
      expect(plan.pull[0]).toMatchObject({ sku: '1', a: 'remoto-a', b: 'local-b' });
    });

    /**
     * Caso: el ciclo completo que documenta el README ("Lo que le toca al adaptador") — tras una
     * fusión, el adaptador guarda los valores YA fusionados como el `syncedValues` del siguiente
     * ciclo, usando exactamente `nextSyncedValues(applied)` (la función exportada para esto, ver
     * "reconcile · nextSyncedValues" más abajo) sobre el registro que salió de `plan.push`. Este
     * test hace ese paso de verdad, no lo simula a mano, para comprobar que con ese nuevo ancestro
     * un segundo ciclo con divergencias distintas vuelve a fusionar sin arrastrar los cambios ya
     * resueltos en el primero.
     * Entrada ciclo 1: `base` cambia `a`, `data` cambia `b` → fusiona en `{ a: 'remoto-a', b: 'local-b' }`.
     * Entrada ciclo 2 (con `nextSyncedValues` de ese resultado como ancestro): `base` cambia ahora
     * `a` otra vez (a `'remoto-a-2'`), `data` cambia `c` (nuevo campo, ausente en el ciclo 1).
     * Salida: el ciclo 2 fusiona `a` (de `base`) y `c` (de `data`), y conserva `b` del ciclo
     * anterior sin tocarlo — la prueba de que el ancestro se actualiza ciclo a ciclo.
     */
    it('el ancestro del ciclo 2 es nextSyncedValues() del resultado fusionado del ciclo 1', () => {
      const ciclo1 = reconcile<{ id: string; a: string; b: string }>({
        base: [
          {
            id: '1',
            a: 'remoto-a',
            b: 'orig-b',
            sync: {
              id: 'id',
              keyfinder: 'fp1',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'orig-a',
            b: 'local-b',
            sync: {
              id: 'id',
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', a: 'orig-a', b: 'orig-b' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      const fusionadoCiclo1 = ciclo1.push[0] as Registro<{ id: string; a: string; b: string }>;
      expect(fusionadoCiclo1).toMatchObject({ a: 'remoto-a', b: 'local-b' });

      // El paso real del adaptador: `nextSyncedValues` sobre el registro que se acaba de aplicar.
      const nuevoAncestro = nextSyncedValues(fusionadoCiclo1);
      expect(nuevoAncestro).toEqual({ id: '1', a: 'remoto-a', b: 'local-b' });

      const ciclo2 = reconcile<{ id: string; a: string; b: string; c?: string }>({
        base: [
          {
            id: '1',
            a: 'remoto-a-2', // el destino volvió a cambiar 'a' tras el ciclo 1
            b: 'local-b', // 'b' quedó como lo dejó el ciclo 1, nadie lo tocó
            sync: {
              id: 'id',
              keyfinder: 'fp3',
              deleted: false,
              createdAt: '0000000000200-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'remoto-a', // aquí todavía no se ha visto el segundo cambio remoto
            b: 'local-b',
            c: 'nuevo-local', // local añadió un campo que no existía en el ciclo 1
            sync: {
              id: 'id',
              keyfinder: 'fp4',
              deleted: false,
              createdAt: '0000000000200-0000-origina',
              syncedValues: nuevoAncestro,
            },
          },
        ],
        now: 1_700_000_100_000,
        originId: 'origina',
      });

      expect(ciclo2.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['c'] } },
      ]);
      expect(ciclo2.push[0]).toMatchObject({ a: 'remoto-a-2', b: 'local-b', c: 'nuevo-local' });
    });
  });

  describe('nextSyncedValues · lo que un adaptador debe guardar como el ancestro del próximo ciclo', () => {
    /**
     * `nextSyncedValues` es la única pieza exportada del motor pensada para usarse DESPUÉS de
     * aplicar un plan, no durante `reconcile()`. Estos tests no ejercitan `reconcile`: comprueban
     * directamente el contrato de esta función, que es lo que hace comprobable —y no solo
     * documentado en prosa— el paso "el adaptador guarda syncedValues tras escribir con éxito".
     */

    /**
     * Caso: el uso normal — un registro que salió de `plan.push` (o `plan.pull`, da igual, tienen
     * la misma forma) se convierte en el ancestro quitándole `sync`.
     * Entrada: un `Registro` con campos de negocio y su `sync` completo.
     * Salida: un objeto con SOLO los campos de negocio, sin `sync` en absoluto.
     */
    it('devuelve los campos de negocio de un registro aplicado, sin su sync', () => {
      const aplicado: Registro<{ id: string; nombre: string; precio: number }> = {
        id: '1',
        nombre: 'Bizcocho',
        precio: 25,
        sync: {
          id: 'id',
          keyfinder: 'fp-nueva',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '1700000000000-0000-origina',
        },
      };

      expect(nextSyncedValues(aplicado)).toEqual({ id: '1', nombre: 'Bizcocho', precio: 25 });
    });

    /**
     * Caso: da igual si el registro aplicado viene de un `push`, un `pull` o una fusión — las tres
     * formas comparten la misma forma de `Registro`, así que `nextSyncedValues` las trata igual.
     * Entrada: reconcile() real que produce una fusión; se toma el registro de `plan.pull`.
     * Salida: el ancestro resultante son los valores YA fusionados, listos para el próximo ciclo.
     */
    it('funciona igual sobre el resultado de una fusión real (push o pull)', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            a: 'remoto-a',
            b: 'orig-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'orig-a',
            b: 'local-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: '1', a: 'orig-a', b: 'orig-b' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(nextSyncedValues(plan.pull[0]!)).toEqual({ id: '1', a: 'remoto-a', b: 'local-b' });
    });

    /**
     * Caso: la huella vacía a propósito de una fusión (ver README) NO se filtra por accidente —
     * `nextSyncedValues` solo quita `sync`, nunca inspecciona ni transforma los campos de negocio.
     * Entrada: un registro fusionado real, con `sync.keyfinder === ''`.
     * Salida: el ancestro no lleva ningún campo `keyfinder`, `deleted` ni ninguno de `sync` —
     * ninguno de esos nombres se filtra desde `sync` hacia el resultado.
     */
    it('no incluye ningún campo de sync, ni siquiera con nombres que colisionen', () => {
      const aplicado: Registro<{ id: string; a: string }> = {
        id: '1',
        a: 'x',
        sync: {
          id: 'id',
          keyfinder: '',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '1700000000000-0000-origina',
        },
      };

      const ancestro = nextSyncedValues(aplicado);
      expect(Object.keys(ancestro)).toEqual(['id', 'a']);
      expect(ancestro).not.toHaveProperty('keyfinder');
      expect(ancestro).not.toHaveProperty('deleted');
    });

    /**
     * Caso: no debe mutar ni el registro recibido ni su `sync` — un adaptador que siga usando el
     * registro original después de llamar a esta función no puede llevarse una sorpresa.
     */
    it('no muta el registro que recibe', () => {
      const aplicado: Registro<{ id: string; a: string }> = {
        id: '1',
        a: 'x',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
        },
      };
      const antes = JSON.parse(JSON.stringify(aplicado)) as unknown;

      nextSyncedValues(aplicado);

      expect(JSON.parse(JSON.stringify(aplicado)) as unknown).toEqual(antes);
    });

    /**
     * Caso: un registro BORRADO (una lápida) que se sube o se trae pasa por `push`/`pull` como
     * cualquiera otro — con su contenido de negocio intacto y `sync.deleted: true`.
     * `nextSyncedValues` no distingue: no mira `deleted` en absoluto, solo quita `sync`.
     *
     * Que esto sea inofensivo —y no un descuido— depende de una regla ya probada en el describe
     * "borrado local: compite por fecha, sin privilegio": un borrado (de cualquiera de los dos
     * lados) NUNCA entra en la fusión, así que este ancestro queda inerte mientras el registro siga
     * borrado en cualquiera de los dos lados. Solo importaría el día que el registro "reviva" y
     * vuelva a competir por contenido — y para eso hace falta tenerlo guardado, igual que cualquier
     * otro ancestro.
     * Entrada: un registro con `sync.deleted: true`, tal como saldría de `plan.push`/`plan.pull`.
     * Salida: `nextSyncedValues` devuelve sus campos de negocio igual que con cualquier registro
     * activo — `deleted` no aparece en el resultado porque vive en `sync`, no en los campos de
     * negocio.
     */
    it('funciona igual sobre un registro borrado (tombstone): el motor no lo excluye', () => {
      const borrado: Registro<{ id: string; nombre: string }> = {
        id: '1',
        nombre: 'Bizcocho',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: true,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '1700000000000-0000-origina',
        },
      };

      expect(nextSyncedValues(borrado)).toEqual({ id: '1', nombre: 'Bizcocho' });
    });

    /**
     * Caso: el ancestro NO nace solo de una fusión — nace de CUALQUIER escritura con éxito,
     * incluida la más simple de todas: un alta local que el destino nunca había visto (`base`
     * vacío). Este test encadena dos ciclos completos para probarlo de punta a punta:
     *
     * - Ciclo 1: un alta simple, sin ningún ancestro (como el primer test del archivo). El
     *   adaptador, tras el `push`, calcula `nextSyncedValues` sobre lo que se acaba de subir.
     * - Ciclo 2: el destino YA tiene ese dato (llegó del ciclo 1) y alguien lo cambia allí; en
     *   paralelo, aquí se cambia un campo distinto — usando como ancestro el que generó el ciclo 1.
     *
     * Entrada ciclo 1: `base` vacío; `data` = `{ a: 'x', b: 'y' }`, sin `syncedValues`.
     * Entrada ciclo 2: `base` = `{ a: 'remoto-a2', b: 'y' }` (cambió `a`); `data` = `{ a: 'x', b:
     * 'local-b' }` con `syncedValues` = lo que salió de `nextSyncedValues` del ciclo 1.
     * Salida: el ciclo 2 FUSIONA `a` (de `base`) y `b` (de `data`) — algo que sin el ancestro del
     * ciclo 1 habría sido, como mucho, un conflicto a ciegas por fecha.
     */
    it('el ancestro se crea tras CUALQUIER escritura exitosa, no solo tras una fusión', () => {
      const ciclo1 = reconcile<{ id: string; a: string; b: string }>({
        base: [],
        data: [
          {
            id: '1',
            a: 'x',
            b: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      expect(ciclo1.push).toHaveLength(1); // es un alta simple: NINGUNA fusión en este ciclo

      // El paso del adaptador tras el alta: exactamente el mismo que tras una fusión.
      const ancestroTrasElAlta = nextSyncedValues(ciclo1.push[0]!);
      expect(ancestroTrasElAlta).toEqual({ id: '1', a: 'x', b: 'y' });

      const ciclo2 = reconcile<{ id: string; a: string; b: string }>({
        base: [
          {
            id: '1',
            a: 'remoto-a2', // el destino recibió el alta y luego alguien cambió 'a' allí
            b: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000200-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'x',
            b: 'local-b', // aquí, en paralelo, se cambió 'b'
            sync: {
              id: 'id',
              keyfinder: 'fp3',
              deleted: false,
              createdAt: '0000000000200-0000-origina',
              syncedValues: ancestroTrasElAlta, // ← el ancestro nacido de un alta, no de una fusión
            },
          },
        ],
        now: 1_700_000_100_000,
        originId: 'origina',
      });

      expect(ciclo2.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['b'] } },
      ]);
      expect(ciclo2.push[0]).toMatchObject({ a: 'remoto-a2', b: 'local-b' });
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
            id: '1',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: '2',
            contenido: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const byId = (id: string) => plan.push.find((registro) => registro['id'] === id);
      expect(byId('1')?.sync.updatedAt).toBe('1700000000000-0000-origina');
      expect(byId('2')?.sync.updatedAt).toBe('1700000000000-0001-origina');
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
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000005000-0000-deviceb',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'local',
            sync: {
              id: 'id',
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
            id: 'semilla',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '1700000200000-0003-otroorigen',
            },
          },
        ],
        data: [
          {
            id: 'semilla',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: 'empuje',
            contenido: 'y',
            sync: {
              id: 'id',
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
      expect(plan.push[0]?.sync.updatedAt).toBe('1700000200000-0004-origina');
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
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '1700000600000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
          {
            id: '2',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const pulled = plan.pull.find((registro) => registro['id'] === '1');
      const pushed = plan.push.find((registro) => registro['id'] === '2');
      expect(pulled?.sync.updatedAt).not.toBe('1700000600000-0000-origina');
      expect(pulled?.sync.updatedAt).toBe('1700000000000-0000-origina');
      expect(pushed?.sync.updatedAt).toBe('1700000000000-0001-origina');
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
            id: '1',
            contenido: 'uno',
            sync: {
              id: 'id',
              keyfinder: 'fp-uno',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
          {
            id: '1',
            contenido: 'dos',
            sync: {
              id: 'id',
              keyfinder: 'fp-dos',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.pull).toEqual([]);
      expect(plan.push).toEqual([]);
    });

    /**
     * Caso: quien reciba el plan necesita poder ver los registros en conflicto, no solo que existen.
     * Entrada: dos entradas del mismo id, con contenidos distintos y reconocibles.
     * Salida: `duplicates` incluye los dos registros completos, no solo el id.
     */
    it('se reporta con todos sus registros', () => {
      const uno: Registro<{ id: string; contenido: string }> = {
        id: '1',
        contenido: 'x',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: false,
          createdAt: 'no-es-una-version',
        },
      };
      const dos: Registro<{ id: string; contenido: string }> = {
        id: '1',
        contenido: 'y',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: false,
          createdAt: 'no-es-una-version',
        },
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
            id: '2',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'y',
            sync: {
              id: 'id',
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
      expect(plan.push[0]?.['id']).toBe('1');
      expect(plan.pull).toHaveLength(1);
      expect(plan.pull[0]?.['id']).toBe('2');
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
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'local',
            sync: {
              id: 'id',
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
            id: '1',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            contenido: 'local',
            sync: {
              id: 'id',
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
        id: 'a',
        contenido: 'remoto-a',
        sync: {
          id: 'id',
          keyfinder: 'fp-remoto-a',
          deleted: false,
          createdAt: '0000000000500-0000-origina',
        },
      };
      const registroB = {
        id: 'b',
        contenido: 'remoto-b',
        sync: {
          id: 'id',
          keyfinder: 'fp-remoto-b',
          deleted: false,
          createdAt: '0000000000600-0000-origina',
        },
      };
      const data = [
        {
          id: 'a',
          contenido: 'local-a',
          sync: {
            id: 'id',
            keyfinder: 'fp-local-a',
            deleted: false,
            createdAt: 'no-es-una-version',
          },
        },
        {
          id: 'b',
          contenido: 'local-b',
          sync: {
            id: 'id',
            keyfinder: 'fp-local-b',
            deleted: false,
            createdAt: 'no-es-una-version',
          },
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
        [...plan.pull].sort((x, y) => String(x['id']).localeCompare(String(y['id'])));
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
     * motor sin que lo interprete ni lo transforme. El motor nunca inspecciona los campos de negocio
     * más allá de leer el campo identificador — por eso el campo anidado de `push[0]`/`pull[0]` es
     * EXACTAMENTE (`===`) el mismo objeto que llegó en `data`/`base`, aunque el registro que lo
     * envuelve sea un objeto nuevo (aplanar implica reconstruir el contenedor, no el contenido
     * anidado).
     * Entrada: un objeto local con un campo anidado arbitrario, en un alta local; y un objeto remoto
     * anidado, en un registro que se trae.
     * Salida: el `anidado` de la salida es el mismo objeto que el de la entrada, sin copiar ni
     * transformar.
     */
    it('el contenido de un registro nunca se inspecciona, solo se transporta', () => {
      interface Contenido {
        id: string;
        compuesto: boolean;
        anidado: { x: number };
      }
      const pushedAnidado = { x: 1 };
      const pulledAnidado = { x: 2 };

      const pushPlan = reconcile<Contenido>({
        base: [],
        data: [
          {
            id: '1',
            compuesto: true,
            anidado: pushedAnidado,
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      expect(pushPlan.push[0]?.anidado).toBe(pushedAnidado);

      const pullPlan = reconcile<Contenido>({
        base: [
          {
            id: '1',
            compuesto: false,
            anidado: pulledAnidado,
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            compuesto: true,
            anidado: { x: 9 },
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      expect(pullPlan.pull[0]?.anidado).toBe(pulledAnidado);
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

      expect(plan).toEqual({ push: [], pull: [], duplicates: [], conflicts: [] });
    });

    /**
     * Caso: un registro de `data` no tiene un id legible (falta el campo) — un registro corrupto. No
     * puede indexarse ni compararse contra nada, así que se ignora: ni sube, ni provoca que el resto
     * de la colección falle.
     * Entrada: `base` trae el id '1' vivo; `data` trae un objeto sin campo `id`.
     * Salida: el objeto sin id no genera ningún efecto — el id '1' de `base` se trata como "aquí no
     * se tiene todavía" (el objeto inválido no cuenta como su reemplazo) y se trae con `pull`.
     */
    it('un registro de `data` sin id legible se ignora, sin hacer fallar al resto', () => {
      const plan = reconcile({
        base: [
          {
            id: '1',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [
          {
            contenido: 'huerfano',
            sync: {
              id: 'id',
              keyfinder: 'fp-huerfano',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.pull).toHaveLength(1);
      expect(plan.pull[0]?.id).toBe('1');
      expect(plan.pull[0]?.contenido).toBe('x');
      expect(plan.push).toEqual([]);
    });

    /**
     * Caso: se usa un `sync.id` distinto al predeterminado — por ejemplo, un registro cuyo
     * identificador vive en el campo `sku`, no en `id`.
     * Entrada: `data` con `{ sku: '1', ..., sync: { id: 'sku', ... } }`, huella distinta a la de un
     * `base` que usa el mismo esquema.
     * Salida: el motor resuelve el id leyendo `sku`, exactamente igual que si se llamara `id` — el
     * conflicto se decide con normalidad, no a ciegas.
     */
    it('con `sync.id` distinto de `id`, el motor lee el identificador por ese nombre de campo', () => {
      const plan = reconcile({
        base: [
          {
            sku: '1',
            contenido: 'remoto',
            sync: {
              id: 'sku',
              keyfinder: 'fp-remote',
              deleted: false,
              createdAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            sku: '1',
            contenido: 'local',
            sync: {
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
          sku: '1',
          contenido: 'local',
          sync: {
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

  describe('reconcile · sync.id es obligatorio (garantía de tipos); sync.syncedValues es opcional', () => {
    /**
     * `sync.id` no tiene forma de validarse en runtime sin coste: nada impide construir un objeto
     * incompleto con un `as unknown as Registro<...>`, y el motor no va a recorrer cada registro
     * comprobando que esté, porque eso es exactamente el trabajo que ya hace el compilador gratis.
     * La garantía real es de TIPOS — `Sync.id` es una clave obligatoria (ver `engine.types.ts`),
     * así que un literal que la omita no compila.
     *
     * `@ts-expect-error` es lo que lo convierte en un test de verdad y no solo en un comentario: si
     * `sync.id` volviera a ser opcional, el error esperado dejaría de producirse, la directiva
     * quedaría "no usada" y **`tsc` fallaría con `TS2578`** — exactamente lo que hace falta para
     * que un futuro cambio que relaje esta regla se note en `npm run typecheck`, no en producción.
     */
    it('un registro sin `sync.id` no compila', () => {
      const registro: Registro<{ id: string }> = {
        id: '1',
        // @ts-expect-error — sync.id es obligatorio, sin default; omitirlo es un error de tipos.
        sync: { keyfinder: 'fp', deleted: false, createdAt: '0000000000100-0000-origina' },
      };

      expect(registro.sync.keyfinder).toBe('fp');
    });

    /**
     * Caso: `sync.syncedValues`, a diferencia de `sync.id`, es opcional a propósito — su ausencia
     * es el estado normal de la primera sincronización de un registro, no un descuido que haya que
     * forzar a declarar (el porqué completo está en `engine.types.ts`). Omitirla del todo compila
     * sin problema, y el motor la trata exactamente igual que si valiera `undefined`: sin ancestro
     * con el que fusionar, cae en el criterio de siempre.
     * Entrada: un alta local sin `sync.syncedValues` en absoluto.
     * Salida: el registro compila y se sube con normalidad, como cualquier alta sin ancestro.
     */
    it('un registro sin `sync.syncedValues` compila y se trata como si no hubiera ancestro', () => {
      const registro: Registro<{ id: string }> = {
        id: '1',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
        },
      };

      const plan = reconcile({ base: [], data: [registro], now: 1_700_000_000_000, originId: 'x' });
      expect(plan.push).toHaveLength(1);
    });
  });
});
