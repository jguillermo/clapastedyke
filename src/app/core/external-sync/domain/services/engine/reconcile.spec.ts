import { nextSyncedValues, reconcile } from './reconcile';
import { EngineInput, Registro } from './engine.types';

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
 * ## Qué modela la entrada
 *
 * El motor compara dos copias, `data` (aquí) contra `base` (el destino, la fuente de verdad), y no
 * necesita una tercera colección aparte que alguien mantenga sincronizada. Lo que SÍ puede llevar
 * cada registro de `data` es su propio ancestro embebido (`sync.syncedValues`): los campos de
 * negocio que ese registro sabía que coincidían con el destino la última vez que convergieron. Es
 * **opcional** (se omite del todo cuando no hay ancestro, que es el caso normal y más frecuente:
 * primera sincronización de un registro) — sin él, el motor cae en "gana un lado entero por
 * versión"; con él, y sin solapamiento de campos, el motor fusiona en vez de descartar un lado
 * completo. Siempre es UNA sola colección: `base`/`data` son arrays de `Registro` — los campos de
 * negocio **aplanados** al nivel superior del objeto, junto con sus metadatos de sincronización en
 * `sync` — no colecciones anidadas.
 *
 * `sync.id` no es el valor del identificador: es el NOMBRE del campo de negocio donde vive, y es
 * **obligatorio, sin default** — quien construye el registro tiene que decirlo explícitamente, o
 * no hay forma de validar que se está leyendo el campo correcto. Estos tests usan siempre un campo
 * `id` propio y escriben `sync.id: 'id'` en cada registro, salvo el caso que ejercita
 * explícitamente un nombre de campo distinto (`sku`).
 *
 * ## Por qué la mayoría de los registros de estos tests NO lleva `sync.syncedValues`
 *
 * Porque **no es un campo que el motor rellene, y su ausencia significa algo**. Cada registro lo
 * lleva solo si su caso lo necesita, y hay exactamente tres motivos para omitirlo:
 *
 * 1. **Es imposible que exista.** El registro solo está en `base` (nunca se ha visto aquí), solo
 *    está en `data` (el destino no lo ha visto nunca: un alta), o converge por huella — en los tres
 *    el motor ni siquiera llega a `tryMerge`. Ahí ponerlo sería inventar un dato falso.
 * 2. **Su ausencia ES el caso.** Sin ancestro no hay forma de atribuir un campo divergente a un
 *    lado, así que se cae en "gana un lado entero por versión". Es el estado real de un registro
 *    nunca sincronizado, o escrito antes de que el campo existiera.
 * 3. **El motor no lo lee ahí.** En `base` se ignora siempre: el destino no tiene ancestro propio
 *    (lo prueba `ancestro-en-base`).
 *
 * Y la otra mitad del contrato: **el motor NUNCA escribe `syncedValues` en su salida**, ni siquiera
 * arrastrando el que traía el registro local. Lo guarda el adaptador con `nextSyncedValues(...)`
 * DESPUÉS de escribir con éxito — hacerlo antes congelaría un ancestro sobre una escritura que
 * todavía puede fallar. Se comprueba con la forma completa de los `push`/`pull` (`toEqual`), no de
 * pasada: en el describe de fusión, un registro que entra con ancestro sale sin él.
 *
 * ## Cómo está organizado
 *
 * **Un `it` por regla del motor, no por ejemplo de esa regla.** Cada regla tiene una sola prueba,
 * y esa prueba mete en la MISMA llamada a `reconcile()` todas las variantes que la ejercitan —
 * ids independientes que además demuestran, gratis, que no se contaminan entre sí. Partirlas en un
 * `it` por variante multiplicaba los literales de entrada sin cubrir una sola rama más.
 *
 * **No hay ningún helper de fixture ni dato calculado: cada test construye su `EngineInput`
 * completo, literal e inline**, incluidas las cadenas de versión ya resueltas a mano en el formato
 * `millis(13)-contador(4)-origen` que exige `LogicalVersion.parse` (`hybrid-clock.ts`). Un
 * constructor de registros ahorraría líneas, pero escondería justo lo que decide cada caso (la
 * huella, el borrado, la versión, el ancestro) detrás de unos valores por defecto que habría que ir
 * a leer a otro sitio — y un dato de test que no se ve entero no se puede revisar.
 *
 * Cada `it(...)` lleva un comentario que enumera los casos que recorre: la situación real de cada
 * uno en lenguaje llano, qué hay (o falta) en `base` y en `data`, y qué decide el motor.
 */
describe('reconcile engine', () => {
  describe('reconcile · el plan básico', () => {
    /**
     * Las cuatro decisiones que no son un conflicto, en un solo ciclo (y con la entrada vacía como
     * caso degenerado):
     * - `convergido`: misma huella y ninguno borrado ⇒ nada que hacer.
     * - `con-version`: solo en el destino ⇒ `pull`, respetando la versión que ya traía.
     * - `sin-version`: solo en el destino y sin ninguna fecha legible ⇒ `pull` con una versión
     *   sintetizada por el reloj del ciclo.
     * - `alta-local`: solo aquí ⇒ `push` con una versión nueva.
     *
     * Que los cuatro convivan en la misma llamada prueba además que un id no contamina a otro: cada
     * uno decide lo suyo, y el reloj avanza una sola vez por escritura que lo necesita (de ahí el
     * contador `0001` del alta: el `0000` se lo llevó la versión sintetizada de `sin-version`).
     */
    it('alta local, traída del destino (con y sin versión legible) y convergencia no se estorban', () => {
      const vacio = reconcile<{ id: string; contenido: string }>({
        base: [],
        data: [],
        now: 1_700_000_000_000,
        originId: 'origina',
      });
      expect(vacio).toEqual({ push: [], pull: [], duplicates: [], conflicts: [], ignored: [] });

      const plan = reconcile<{ id: string; contenido: string }>({
        base: [
          {
            id: 'convergido',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
          {
            id: 'con-version',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
          {
            id: 'sin-version',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        data: [
          {
            id: 'convergido',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: 'alta-local',
            contenido: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp-nueva',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan).toEqual({
        push: [
          {
            id: 'alta-local',
            contenido: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp-nueva',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '1700000000000-0001-origina',
            },
          },
        ],
        pull: [
          {
            id: 'con-version',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
          {
            id: 'sin-version',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: 'no-es-una-version',
              updatedAt: '1700000000000-0000-origina',
            },
          },
        ],
        duplicates: [],
        conflicts: [],
        ignored: [],
      });
    });
  });

  describe('reconcile · borrados', () => {
    /**
     * El borrado del DESTINO es incondicional: es la fuente de verdad y su borrado no se discute,
     * así que no se compara ni huella, ni fecha, ni ancestro. Las cuatro variantes que podrían
     * hacer dudar:
     * - `mas-nuevo-aqui`: aquí sigue vivo, con otro contenido y una fecha MÁS reciente.
     * - `misma-huella`: el contenido de aquí es idéntico al que tenía el destino (no decide la
     *   huella, decide el `deleted` de `base`).
     * - `sin-version`: el destino no dejó ninguna fecha legible al borrar ⇒ se sintetiza una.
     * - `con-ancestro`: aquí SÍ hay ancestro (`sync.syncedValues`) y los campos divergentes son
     *   distintos en cada lado, o sea que una fusión sería posible — el borrado del destino corta
     *   antes de intentarla siquiera (`if (base.sync.deleted)` va antes que `tryMerge`).
     *
     * En los cuatro: `pull` de la lápida, nada que subir y ningún conflicto — no hubo nada que
     * decidir. Y el registro traído NO lleva `syncedValues`: el motor nunca lo escribe, lo guarda el
     * adaptador tras aplicar (por eso la comprobación es de forma completa, con `toEqual`).
     */
    it('un borrado en el destino se trae siempre, sin mirar huella, fecha ni ancestro', () => {
      interface Fila {
        id: string;
        contenido?: string;
        a?: string;
        b?: string;
      }

      const plan = reconcile<Fila>({
        base: [
          {
            id: 'mas-nuevo-aqui',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
          {
            id: 'misma-huella',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
          {
            id: 'sin-version',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: true,
              createdAt: 'no-es-una-version',
            },
          },
          {
            id: 'con-ancestro',
            a: 'remoto-a',
            b: 'orig-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        data: [
          {
            id: 'mas-nuevo-aqui',
            contenido: 'x-local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              // Más reciente que el borrado del destino: da igual, el destino no se discute.
              updatedAt: '1699999999999-0000-origina',
            },
          },
          {
            id: 'misma-huella',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
          {
            id: 'sin-version',
            contenido: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            // El destino cambió 'a' y aquí se cambió 'b': con ancestro y sin solapamiento, esto
            // fusionaría… si el destino no lo hubiera borrado. Con la lápida, ni se intenta.
            id: 'con-ancestro',
            a: 'orig-a',
            b: 'local-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: 'con-ancestro', a: 'orig-a', b: 'orig-b' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan).toEqual({
        push: [],
        pull: [
          {
            id: 'mas-nuevo-aqui',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
          {
            id: 'misma-huella',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
          {
            id: 'sin-version',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: true,
              createdAt: 'no-es-una-version',
              updatedAt: '1700000000000-0000-origina',
            },
          },
          {
            // Sin `syncedValues`: el motor no lo escribe nunca, ni lo arrastra del registro local.
            id: 'con-ancestro',
            a: 'remoto-a',
            b: 'orig-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
        ],
        duplicates: [],
        conflicts: [],
        ignored: [],
      });
    });

    /**
     * El borrado LOCAL, en cambio, no tiene privilegio ninguno: es un cambio como cualquier otro y
     * compite por fecha. Y NUNCA se fusiona, ni aunque traiga ancestro — un borrado es un evento de
     * todo el registro, no de un campo.
     * - `gana-aqui`: el borrado local es más reciente ⇒ se sube la lápida.
     * - `revive`: el destino cambió después ⇒ gana el destino y el registro vuelve a estar vivo aquí.
     * - `con-ancestro`: igual que `revive`, pero con `syncedValues` que, campo a campo, invitaría a
     *   fusionar ⇒ el motor ni lo intenta; nunca `winner: 'merged'`.
     */
    it('un borrado local compite por fecha, sin privilegio, y nunca se fusiona', () => {
      const plan = reconcile<{ id: string; contenido: string }>({
        base: [
          {
            id: 'gana-aqui',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
          {
            id: 'revive',
            contenido: 'remoto-revivido',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000009000-0000-origina',
            },
          },
          {
            id: 'con-ancestro',
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
            id: 'gana-aqui',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
            },
          },
          {
            id: 'revive',
            contenido: 'remoto-revivido',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
            },
          },
          {
            id: 'con-ancestro',
            contenido: 'remoto-revivido',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: true,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
              syncedValues: { id: 'con-ancestro', contenido: 'orig' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([
        { id: 'gana-aqui', winner: 'local', blind: false },
        { id: 'revive', winner: 'remote', blind: false },
        { id: 'con-ancestro', winner: 'remote', blind: false },
      ]);
      expect(plan.push).toEqual([
        {
          id: 'gana-aqui',
          contenido: 'x',
          sync: {
            id: 'id',
            keyfinder: 'fp-remoto',
            deleted: true,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
      expect(plan.pull).toEqual([
        {
          id: 'revive',
          contenido: 'remoto-revivido',
          sync: {
            id: 'id',
            keyfinder: 'fp-remoto',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '0000000009000-0000-origina',
          },
        },
        {
          id: 'con-ancestro',
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
    });
  });

  describe('reconcile · conflicto: gana la versión más reciente', () => {
    /**
     * Cuando no se puede fusionar, gana un lado ENTERO por versión. Las tres formas de resolverlo:
     * - `gana-aqui`: la edición local es posterior ⇒ `push` con una versión nueva.
     * - `gana-destino`: la del destino es posterior ⇒ `pull`, respetando su versión tal cual.
     * - `empate`: mismo milisegundo y mismo contador ⇒ desempata el origen, alfabéticamente
     *   ('devicea' < 'deviceb'), para que TODAS las réplicas decidan igual.
     *
     * Ninguno lleva `sync.syncedValues`, y es deliberado: **su ausencia es la que abre esta rama**.
     * Modela un registro nunca sincronizado o escrito antes de que el campo existiera. Con ancestro
     * se llega aquí igual —pero solo si el cambio SOLAPA en el mismo campo—, y ese camino lo cubre
     * `solapamiento` en el describe de fusión; lo que se prueba aquí es el desempate por versión, que
     * es idéntico venga de donde venga.
     */
    it('huella distinta: gana la fecha más reciente, y un empate exacto lo rompe el origen', () => {
      const plan = reconcile<{ id: string; contenido: string }>({
        base: [
          {
            id: 'gana-aqui',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
          {
            id: 'gana-destino',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000009000-0000-origina',
            },
          },
          {
            id: 'empate',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000005000-0000-deviceb',
            },
          },
        ],
        data: [
          {
            id: 'gana-aqui',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
            },
          },
          {
            id: 'gana-destino',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
            },
          },
          {
            id: 'empate',
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

      expect(plan.conflicts).toEqual([
        { id: 'gana-aqui', winner: 'local', blind: false },
        { id: 'gana-destino', winner: 'remote', blind: false },
        { id: 'empate', winner: 'remote', blind: false },
      ]);
      expect(plan.push).toEqual([
        {
          id: 'gana-aqui',
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
      expect(plan.pull).toEqual([
        {
          id: 'gana-destino',
          contenido: 'remoto',
          sync: {
            id: 'id',
            keyfinder: 'fp-remoto',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '0000000009000-0000-origina',
          },
        },
        {
          id: 'empate',
          contenido: 'remoto',
          sync: {
            id: 'id',
            keyfinder: 'fp-remoto',
            deleted: false,
            createdAt: '0000000005000-0000-deviceb',
            updatedAt: '0000000005000-0000-deviceb',
          },
        },
      ]);
    });

    /**
     * Cuando no se puede leer una fecha con la que comparar, el destino gana por precaución y el
     * conflicto queda marcado `blind: true` para que quien reciba el plan sepa que fue una apuesta:
     * - `ciego-aqui`: solo la fecha local es ilegible ⇒ se aplica la versión del destino.
     * - `ciego-los-dos`: ninguna es legible ⇒ además hay que sintetizar la versión que se escribe, y
     *   eso se marca aparte con `restamped`. Son dos cosas distintas y por eso son dos banderas:
     *   `blind` dice que no había fecha LOCAL con la que comparar; `restamped`, que la del DESTINO
     *   tampoco se podía creer y salió del reloj — o sea, que ganó con una versión inventada.
     */
    it('sin fecha legible gana el destino, marcado a ciegas, sintetizando versión si hace falta', () => {
      const plan = reconcile<{ id: string; contenido: string }>({
        base: [
          {
            id: 'ciego-aqui',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
          {
            id: 'ciego-los-dos',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
        ],
        data: [
          {
            id: 'ciego-aqui',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
          {
            id: 'ciego-los-dos',
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

      expect(plan.conflicts).toEqual([
        { id: 'ciego-aqui', winner: 'remote', blind: true },
        { id: 'ciego-los-dos', winner: 'remote', blind: true, restamped: true },
      ]);
      expect(plan.push).toEqual([]);
      expect(plan.pull).toEqual([
        {
          id: 'ciego-aqui',
          contenido: 'remoto',
          sync: {
            id: 'id',
            keyfinder: 'fp-remoto',
            deleted: false,
            createdAt: '0000000000100-0000-origina',
            updatedAt: '0000000002000-0000-origina',
          },
        },
        {
          id: 'ciego-los-dos',
          contenido: 'remoto',
          sync: {
            id: 'id',
            keyfinder: 'fp-remoto',
            deleted: false,
            createdAt: 'no-es-una-version',
            updatedAt: '1700000000000-0000-origina',
          },
        },
      ]);
    });
  });

  describe('reconcile · fusión de campos no solapados', () => {
    /**
     * El caso central del feature, con la forma completa del resultado: el destino cambió un campo,
     * aquí se cambió OTRO distinto, y el ancestro embebido permite atribuir cada uno a su lado en
     * vez de descartar un lado entero.
     *
     * Se generan DOS comandos con el MISMO registro (literalmente el mismo objeto): al destino le
     * falta lo que cambió aquí y a local le falta lo que cambió el destino, así que ninguno de los
     * dos por separado basta. Esto es lo que justifica los dos comandos, y por eso el caso vive
     * aquí: cuando solo cambia un lado, solo se emite uno (ver «la fusión solo escribe donde falta
     * algo»). La huella sale `null` A PROPÓSITO —«hay que recalcularla»—, porque el contenido
     * fusionado no coincide con la de ningún lado y el motor no calcula huellas.
     */
    it('cada lado cambió un campo distinto: se fusionan en un único registro para push y pull', () => {
      const plan = reconcile<{ id: string; a: string; b: string }>({
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

      const fusionado = {
        id: '1',
        a: 'remoto-a',
        b: 'local-b',
        sync: {
          id: 'id',
          keyfinder: null,
          deleted: false,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '1700000000000-0000-origina',
        },
      };
      expect(plan.push).toEqual([fusionado]);
      expect(plan.pull).toEqual([fusionado]);
      expect(plan.push[0]).toBe(plan.pull[0]); // el mismo registro, no dos copias
      expect(plan.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['b'] } },
      ]);
    });

    /**
     * La atribución campo a campo, en todas sus formas, en un solo ciclo. El motor compara por
     * igualdad ESTRUCTURAL contra el ancestro, no por tipo ni por referencia:
     * - `tipos`: números y booleanos se atribuyen igual que el texto, sin convertirse a cadena.
     * - `arrays`: dos arrays con el mismo contenido son "sin cambio" aunque sean instancias
     *   distintas — si no, una lista parecería editada solo por ser un objeto nuevo en memoria.
     * - `campo-nuevo`: una clave que solo existe aquí (ausente en el ancestro y en el destino) entra
     *   en la fusión como cualquier otro cambio exclusivo de un lado.
     * - `campo-borrado`: una clave que desapareció de los DOS lados por igual cambió en ambos, pero
     *   al mismo valor final (ausente): no es solapamiento y no bloquea al resto.
     * - `mismo-valor`: el mismo campo cambiado al MISMO valor nuevo en los dos lados tampoco es
     *   solapamiento — no hay nada que perder — y no se le atribuye a nadie.
     * - `sin-cambios-reales`: huellas distintas pero ningún campo divergente ⇒ fusión "vacía": el
     *   motor sigue el mismo camino y solo re-estampa huella y versión.
     *
     * Cada uno es un id independiente, así que también prueban que una fusión no contamina a otra.
     *
     * Los tres últimos, además, son de UN SOLO lado (`campo-borrado` solo remoto; `mismo-valor` solo
     * local; `sin-cambios-reales` ninguno), así que aquí se ve de paso a qué lista va cada uno — la
     * regla entera está en «la fusión solo escribe donde falta algo».
     */
    it('la atribución cubre tipos no-texto, arrays por valor, campos añadidos, quitados y coincidentes', () => {
      interface Fila {
        id: string;
        precio?: number;
        activo?: boolean;
        nombre?: string;
        tags?: string[];
        a?: string;
        b?: string;
        obsoleto?: string;
      }

      const plan = reconcile<Fila>({
        base: [
          {
            id: 'tipos',
            precio: 20,
            activo: true,
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: 'arrays',
            nombre: 'remoto',
            // Mismo contenido que el ancestro, pero OTRA instancia de array: no cuenta como cambio.
            tags: ['a', 'b'],
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: 'campo-nuevo',
            a: 'remoto-a',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: 'campo-borrado',
            a: 'remoto-a',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: 'mismo-valor',
            a: 'nuevo',
            b: 'orig-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: 'sin-cambios-reales',
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
            id: 'tipos',
            precio: 10,
            activo: false,
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: 'tipos', precio: 10, activo: true },
            },
          },
          {
            id: 'arrays',
            nombre: 'orig',
            tags: ['a', 'b', 'c'],
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: 'arrays', nombre: 'orig', tags: ['a', 'b'] },
            },
          },
          {
            id: 'campo-nuevo',
            a: 'orig-a',
            b: 'nuevo-local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: 'campo-nuevo', a: 'orig-a' },
            },
          },
          {
            id: 'campo-borrado',
            a: 'orig-a',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: 'campo-borrado', a: 'orig-a', obsoleto: 'y' },
            },
          },
          {
            id: 'mismo-valor',
            a: 'nuevo',
            b: 'local-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: 'mismo-valor', a: 'orig-a', b: 'orig-b' },
            },
          },
          {
            id: 'sin-cambios-reales',
            a: 'x',
            b: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: 'sin-cambios-reales', a: 'x', b: 'y' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      // Solo los tres primeros son conflictos: en ellos hubo que combinar un cambio de cada lado.
      // En los otros tres solo cambió un lado (o ninguno), así que no hubo nada que decidir.
      expect(plan.conflicts).toEqual([
        {
          id: 'tipos',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: ['precio'], local: ['activo'] },
        },
        {
          id: 'arrays',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: ['nombre'], local: ['tags'] },
        },
        {
          id: 'campo-nuevo',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: ['a'], local: ['b'] },
        },
      ]);

      // Al destino solo se le manda lo que no tiene: los tres de doble cambio, y `mismo-valor`,
      // donde `b` solo cambió aquí. `campo-borrado` (solo cambió allí) y `sin-cambios-reales`
      // (no cambió nada) no le hacen falta — mandárselos sería escribir de más.
      expect(plan.push.map(nextSyncedValues)).toEqual([
        { id: 'tipos', precio: 20, activo: false },
        { id: 'arrays', nombre: 'remoto', tags: ['a', 'b', 'c'] },
        { id: 'campo-nuevo', a: 'remoto-a', b: 'nuevo-local' },
        { id: 'mismo-valor', a: 'nuevo', b: 'local-b' },
      ]);
      // Y aquí se escribe lo que aquí falta: los tres de doble cambio, `campo-borrado` (lo que
      // cambió allí) y `sin-cambios-reales`, que no aporta contenido pero recalcula la huella rancia
      // que provocó esta divergencia — si no, se repetiría cada ciclo sin resolverse nunca.
      expect(plan.pull.map(nextSyncedValues)).toEqual([
        { id: 'tipos', precio: 20, activo: false },
        { id: 'arrays', nombre: 'remoto', tags: ['a', 'b', 'c'] },
        { id: 'campo-nuevo', a: 'remoto-a', b: 'nuevo-local' },
        { id: 'campo-borrado', a: 'remoto-a' }, // `obsoleto` ya no está en ninguno
        { id: 'sin-cambios-reales', a: 'x', b: 'y' },
      ]);
      // Toda fusión sale con la huella marcada para recalcular: `null`, nunca una cadena.
      expect(plan.push.every((registro) => registro.sync.keyfinder === null)).toBe(true);
      expect(plan.pull.every((registro) => registro.sync.keyfinder === null)).toBe(true);
    });

    /**
     * Cuándo NO se fusiona, aunque los campos divergentes parezcan compatibles. En los cinco casos
     * se cae al criterio de siempre (gana un lado entero por versión), sin lanzar ninguna excepción:
     * - `sin-ancestro`: no hay `syncedValues` ⇒ no hay forma de atribuir un cambio a un lado. Es el
     *   estado de un registro nunca sincronizado, o escrito antes de que el campo existiera.
     * - `ancestro-texto` / `ancestro-array`: el ancestro no es un objeto plano ⇒ no hay "campos" que
     *   comparar.
     * - `ancestro-en-base`: el ancestro está en el registro del DESTINO, no en el local. El motor
     *   solo lee `data.sync.syncedValues` —el destino no tiene ancestro propio, ver `engine.types.ts`—
     *   así que este no cuenta y no habilita ninguna fusión.
     * - `solapamiento`: el mismo campo cambiado a valores DISTINTOS en los dos lados; fusionar
     *   perdería en silencio el cambio de uno, así que se aborta la fusión entera.
     *
     * Dos pruebas de que ninguno pasó por la fusión: la huella conservada en `push` (`fp-local`, no
     * `''`), y la forma completa del registro subido — que además fija la otra mitad del contrato de
     * `syncedValues`: **el motor nunca lo propaga**. `solapamiento` entra con ancestro y sale sin él,
     * porque quien lo guarda es el adaptador DESPUÉS de escribir con éxito (`nextSyncedValues`), no
     * el plan. Si el motor lo arrastrara, se congelaría un ancestro sobre una escritura que aún
     * puede fallar.
     */
    it('sin ancestro utilizable o con solapamiento real no se fusiona: gana un lado entero', () => {
      interface Fila {
        id: string;
        a: string;
        b?: string;
      }

      const plan = reconcile<Fila>({
        base: [
          {
            id: 'sin-ancestro',
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
          {
            id: 'ancestro-texto',
            a: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
          {
            id: 'ancestro-array',
            a: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
          {
            id: 'solapamiento',
            a: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
          {
            // El ancestro va aquí, en el destino: el motor NO lo lee. Solo cuenta el del local.
            id: 'ancestro-en-base',
            a: 'remoto-a',
            b: 'orig-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
              syncedValues: { id: 'ancestro-en-base', a: 'orig-a', b: 'orig-b' },
            },
          },
        ],
        data: [
          {
            id: 'sin-ancestro',
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
          {
            id: 'ancestro-texto',
            a: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
              syncedValues: 'no-es-un-objeto' as unknown as Record<string, unknown>,
            },
          },
          {
            id: 'ancestro-array',
            a: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
              syncedValues: ['no', 'plano'] as unknown as Record<string, unknown>,
            },
          },
          {
            id: 'solapamiento',
            a: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
              syncedValues: { id: 'solapamiento', a: 'orig' },
            },
          },
          {
            // Cambia 'b' mientras el destino cambia 'a': fusionaría, si el ancestro estuviera aquí.
            id: 'ancestro-en-base',
            a: 'orig-a',
            b: 'local-b',
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

      expect(plan.conflicts).toEqual([
        { id: 'sin-ancestro', winner: 'local', blind: false },
        { id: 'ancestro-texto', winner: 'local', blind: false },
        { id: 'ancestro-array', winner: 'local', blind: false },
        { id: 'solapamiento', winner: 'local', blind: false },
        { id: 'ancestro-en-base', winner: 'local', blind: false },
      ]);
      expect(plan.pull).toEqual([]);
      expect(plan.push.map(nextSyncedValues)).toEqual([
        { id: 'sin-ancestro', a: 'orig-a', b: 'local-b' },
        { id: 'ancestro-texto', a: 'local' },
        { id: 'ancestro-array', a: 'local' },
        { id: 'solapamiento', a: 'local' },
        { id: 'ancestro-en-base', a: 'orig-a', b: 'local-b' },
      ]);
      expect(plan.push.every((registro) => registro.sync.keyfinder === 'fp-local')).toBe(true);

      // Forma completa del ÚNICO push cuya entrada traía `syncedValues`: sale sin él.
      expect(plan.push[3]).toEqual({
        id: 'solapamiento',
        a: 'local',
        sync: {
          id: 'id',
          keyfinder: 'fp-local',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '1700000000000-0003-origina',
        },
      });
      expect(plan.push.every((registro) => registro.sync.syncedValues === undefined)).toBe(true);
    });

    /**
     * La identidad se resuelve por el NOMBRE de campo que diga `sync.id`, y eso no cambia nada del
     * resto de la lógica: con el identificador en `sku`, tanto la fusión (`m`) como el conflicto por
     * fecha (`c`) se comportan igual. Los ids que aparecen en el plan son los VALORES de ese campo.
     */
    it('con `sync.id` distinto de "id" (p. ej. sku) todo funciona igual', () => {
      interface Fila {
        sku: string;
        a?: string;
        b?: string;
        contenido?: string;
      }

      const plan = reconcile<Fila>({
        base: [
          {
            sku: 'm',
            a: 'remoto-a',
            b: 'orig-b',
            sync: {
              id: 'sku',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            sku: 'c',
            contenido: 'remoto',
            sync: {
              id: 'sku',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000002000-0000-origina',
            },
          },
        ],
        data: [
          {
            sku: 'm',
            a: 'orig-a',
            b: 'local-b',
            sync: {
              id: 'sku',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { sku: 'm', a: 'orig-a', b: 'orig-b' },
            },
          },
          {
            sku: 'c',
            contenido: 'local',
            sync: {
              id: 'sku',
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

      expect(plan.conflicts).toEqual([
        { id: 'm', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['b'] } },
        { id: 'c', winner: 'local', blind: false },
      ]);
      expect(plan.push.map(nextSyncedValues)).toEqual([
        { sku: 'm', a: 'remoto-a', b: 'local-b' },
        { sku: 'c', contenido: 'local' },
      ]);
      expect(plan.pull.map(nextSyncedValues)).toEqual([{ sku: 'm', a: 'remoto-a', b: 'local-b' }]);
    });
  });

  describe('nextSyncedValues · el ancestro del próximo ciclo', () => {
    /**
     * `nextSyncedValues` es la única pieza exportada del motor pensada para usarse DESPUÉS de
     * aplicar un plan: convierte un registro ya escrito en el ancestro del próximo ciclo quitándole
     * `sync`, y nada más. Que sea una función y no prosa en el README es lo que hace comprobable el
     * paso "el adaptador guarda `syncedValues` tras escribir con éxito".
     *
     * Aquí se comprueba su contrato entero: solo campos de negocio (ningún nombre de `sync` se
     * filtra), sin mutar el registro recibido, y sin distinguir un borrado — una lápida da su
     * ancestro igual que cualquier otro registro. Que eso sea inofensivo depende de una regla ya
     * probada arriba: un borrado nunca entra en la fusión, así que ese ancestro queda inerte
     * mientras el registro siga borrado en cualquiera de los dos lados.
     */
    it('devuelve solo los campos de negocio —también en un borrado— y no muta el registro', () => {
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
      const antes = JSON.parse(JSON.stringify(aplicado)) as unknown;

      const ancestro = nextSyncedValues(aplicado);

      expect(ancestro).toEqual({ id: '1', nombre: 'Bizcocho', precio: 25 });
      // Ningún nombre de `sync` se filtra al ancestro: ni 'keyfinder', ni 'deleted', ni 'id' de sync.
      expect(Object.keys(ancestro)).toEqual(['id', 'nombre', 'precio']);
      expect(JSON.parse(JSON.stringify(aplicado)) as unknown).toEqual(antes);

      const lapida: Registro<{ id: string; nombre: string }> = {
        id: '2',
        nombre: 'Otro',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: true,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '1700000000000-0000-origina',
        },
      };

      expect(nextSyncedValues(lapida)).toEqual({ id: '2', nombre: 'Otro' });
    });

    /**
     * El ciclo completo que documenta el README ("Lo que le toca al adaptador"), encadenado de
     * verdad — sin simular a mano ningún ancestro. El README dice «tras cada ciclo con éxito, haya
     * escrito por `push`, por `pull` o por una fusión», así que aquí se recorren **las tres formas
     * de escritura**, que es lo que hace de esto una prueba y no una ilustración:
     *
     * 1. **Alta (`push`)**, SIN ancestro — el estado normal de la primera sincronización. El
     *    ancestro nace de CUALQUIER escritura aplicada, no solo de una fusión.
     * 2. **Fusión**: con ese ancestro, el ciclo siguiente ya fusiona lo que antes habría sido, como
     *    mucho, un conflicto a ciegas por fecha.
     * 3. **Fusión encadenada**: con `nextSyncedValues` del registro FUSIONADO, el tercer ciclo
     *    vuelve a fusionar sin arrastrar lo ya resuelto — `b` quedó como lo dejó el ciclo 2 y nadie
     *    vuelve a reclamarlo.
     * 4. **`pull`** (otro id, para no enredarlo con lo anterior): ganó el destino, y el ancestro
     *    pasa a ser lo que el destino trajo. Este es el que más silenciosamente duele si se olvida:
     *    con un ancestro viejo, el ciclo siguiente vería los valores que acaban de LLEGAR del
     *    destino como si los hubiera cambiado el local, y abortaría la fusión por un solapamiento
     *    que no existe. Con el ancestro al día, fusiona.
     */
    it('el ancestro nace de cualquier escritura aplicada —push, fusión o pull— y se actualiza ciclo a ciclo', () => {
      const alta = reconcile<{ id: string; a: string; b: string }>({
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
      expect(alta.push).toHaveLength(1);
      expect(alta.conflicts).toEqual([]); // es un alta: ninguna fusión de por medio

      const trasElAlta = nextSyncedValues(alta.push[0]!);
      expect(trasElAlta).toEqual({ id: '1', a: 'x', b: 'y' });

      const fusion = reconcile<{ id: string; a: string; b: string }>({
        base: [
          {
            id: '1',
            a: 'remoto-a2', // el destino recibió el alta y luego cambiaron 'a' allí
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
              syncedValues: trasElAlta, // ← el ancestro nacido de un alta, no de una fusión
            },
          },
        ],
        now: 1_700_000_100_000,
        originId: 'origina',
      });
      expect(fusion.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['b'] } },
      ]);

      const trasLaFusion = nextSyncedValues(fusion.push[0]!);
      expect(trasLaFusion).toEqual({ id: '1', a: 'remoto-a2', b: 'local-b' });

      const siguiente = reconcile<{ id: string; a: string; b: string; c?: string }>({
        base: [
          {
            id: '1',
            a: 'remoto-a3', // el destino volvió a cambiar 'a' tras la fusión
            b: 'local-b', // 'b' quedó como lo dejó el ciclo anterior: nadie lo toca
            sync: {
              id: 'id',
              keyfinder: 'fp4',
              deleted: false,
              createdAt: '0000000000300-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '1',
            a: 'remoto-a2', // aquí todavía no se ha visto el tercer cambio remoto
            b: 'local-b',
            c: 'nuevo-local', // y se añadió un campo que no existía en el ciclo anterior
            sync: {
              id: 'id',
              keyfinder: 'fp5',
              deleted: false,
              createdAt: '0000000000300-0000-origina',
              syncedValues: trasLaFusion,
            },
          },
        ],
        now: 1_700_000_200_000,
        originId: 'origina',
      });

      expect(siguiente.conflicts).toEqual([
        { id: '1', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['c'] } },
      ]);
      expect(nextSyncedValues(siguiente.push[0]!)).toEqual({
        id: '1',
        a: 'remoto-a3',
        b: 'local-b',
        c: 'nuevo-local',
      });

      // 4. La otra mitad: el ancestro también se rehace tras un `pull`. Otro id, para no enredarlo
      //    con la cadena de arriba.
      const ganaElDestino = reconcile<{ id: string; a: string; b: string }>({
        base: [
          {
            id: '2',
            a: 'remoto-a',
            b: 'remoto-b',
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
            id: '2',
            a: 'local-a',
            b: 'remoto-b',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000003000-0000-origina',
              // Sin ancestro todavía: por eso este ciclo no fusiona, lo resuelve la fecha.
            },
          },
        ],
        now: 1_700_000_300_000,
        originId: 'origina',
      });
      expect(ganaElDestino.conflicts).toEqual([{ id: '2', winner: 'remote', blind: false }]);

      // El paso del adaptador tras aplicar el `pull`: el ancestro es lo que trajo el destino, no lo
      // que había aquí antes.
      const trasElPull = nextSyncedValues(ganaElDestino.pull[0]!);
      expect(trasElPull).toEqual({ id: '2', a: 'remoto-a', b: 'remoto-b' });

      const trasAplicarElPull = reconcile<{ id: string; a: string; b: string }>({
        base: [
          {
            id: '2',
            a: 'remoto-a2', // el destino cambia 'a' otra vez
            b: 'remoto-b',
            sync: {
              id: 'id',
              keyfinder: 'fp6',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000009500-0000-origina',
            },
          },
        ],
        data: [
          {
            id: '2',
            a: 'remoto-a', // lo que dejó el pull anterior: aquí nadie lo ha tocado
            b: 'local-b', // y aquí se cambia 'b'
            sync: {
              id: 'id',
              keyfinder: 'fp7',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000009400-0000-origina',
              syncedValues: trasElPull, // ← el ancestro nacido de un pull
            },
          },
        ],
        now: 1_700_000_400_000,
        originId: 'origina',
      });

      // Con el ancestro al día, `a` se atribuye al destino y `b` al local. Con el ancestro viejo
      // (`{ a: 'local-a', … }`), `a` habría contado como cambiado en LOS DOS lados a valores
      // distintos: solapamiento falso, fusión abortada y un cambio perdido por la fecha.
      expect(trasAplicarElPull.conflicts).toEqual([
        { id: '2', winner: 'merged', blind: false, mergedFrom: { remote: ['a'], local: ['b'] } },
      ]);
      expect(nextSyncedValues(trasAplicarElPull.push[0]!)).toEqual({
        id: '2',
        a: 'remoto-a2',
        b: 'local-b',
      });
    });

    /**
     * **El ancestro se guarda cuando el destino ya confirmó, y solo entonces.** Es la regla más
     * peligrosa del diseño, así que se ejecuta en vez de quedarse documentada.
     *
     * El motor no puede imponerla —no sabe si la escritura llegó—, y lo único que está en su mano es
     * no estorbar: no lo mete en el plan (`push`/`pull` salen siempre sin `syncedValues`) y deja el
     * sello al adaptador, con `nextSyncedValues(aplicado)`. Este test recorre las TRES continuaciones
     * posibles del mismo ciclo, con el motor de verdad en las tres.
     *
     * El escenario: los dos lados tenían el precio en 2,50 y aquí se sube a 2,75. El ciclo decide
     * subirlo.
     *
     * 1. **Confirmó** ⇒ el adaptador sella `nextSyncedValues(aplicado)` y el ciclo siguiente ve los
     *    dos lados iguales: convergido, plan vacío. Estado estable.
     * 2. **Falló** ⇒ NO se sella nada. El registro local sigue con su ancestro anterior (2,50), así
     *    que el ciclo siguiente vuelve a proponer la subida: el reintento es honesto y **no se pierde
     *    la edición**.
     * 3. **Falló pero se selló igual** ⇒ el desastre, y por eso está aquí: con `ancestro = 2,75`, el
     *    motor lee «el destino bajó el precio a 2,50» y «aquí no tocó nadie», así que **aplica 2,50
     *    encima de tu edición y encima la sube como acordada**. Sin excepción, sin conflicto y sin
     *    rastro. El único que avisaría es este test.
     *
     * La asimetría que justifica todo: un ancestro **vacío** degrada a "gana un lado entero"
     * (molesto, visible, recuperable); un ancestro **mentiroso** pierde datos en silencio.
     */
    it('el ancestro solo se sella tras confirmar: sin confirmar se reintenta, y sellarlo igual perdería la edición', () => {
      const local = {
        id: 'ing-1',
        precio: 2.75, // aquí se subió de 2,50 a 2,75
        sync: {
          id: 'id',
          keyfinder: 'fp-275',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '0000000003000-0000-origina',
          syncedValues: { id: 'ing-1', precio: 2.5 }, // lo último que se sabe acordado
        },
      };
      const remoto = {
        id: 'ing-1',
        precio: 2.5, // el destino sigue como estaba
        sync: {
          id: 'id',
          keyfinder: 'fp-250',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '0000000002000-0000-origina',
        },
      };

      const ciclo = reconcile<{ id: string; precio: number }>({
        base: [remoto],
        data: [local],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      // Solo cambió un lado: no hay nada que decidir (no es un conflicto) y al destino le falta la
      // subida, así que solo se emite `push`. Lo que importa aquí es qué se propone escribir y que
      // el plan NO lleva ancestro con el que sellar nada todavía.
      expect(ciclo.conflicts).toEqual([]);
      expect(ciclo.pull).toEqual([]);
      expect(nextSyncedValues(ciclo.push[0]!)).toEqual({ id: 'ing-1', precio: 2.75 });
      expect(ciclo.push[0]?.sync.syncedValues).toBeUndefined();

      // 1. CONFIRMÓ. El adaptador sella el ancestro y recalcula la huella real (la fusión sale con
      //    `keyfinder: null`, ver README). El destino ya tiene 2,75.
      const selladoTrasConfirmar = nextSyncedValues(ciclo.push[0]!);
      expect(selladoTrasConfirmar).toEqual({ id: 'ing-1', precio: 2.75 });

      const trasConfirmar = reconcile<{ id: string; precio: number }>({
        base: [
          {
            id: 'ing-1',
            precio: 2.75,
            sync: {
              id: 'id',
              keyfinder: 'fp-275',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '1700000000000-0000-origina',
            },
          },
        ],
        data: [
          {
            id: 'ing-1',
            precio: 2.75,
            sync: {
              id: 'id',
              keyfinder: 'fp-275',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '1700000000000-0000-origina',
              syncedValues: selladoTrasConfirmar,
            },
          },
        ],
        now: 1_700_000_100_000,
        originId: 'origina',
      });
      expect(trasConfirmar).toEqual({
        push: [],
        pull: [],
        duplicates: [],
        conflicts: [],
        ignored: [],
      });

      // 2. FALLÓ. No se sella nada: el registro local queda EXACTAMENTE como estaba, ancestro viejo
      //    incluido, y el destino tampoco cambió. El ciclo siguiente vuelve a proponer la subida.
      const trasFallar = reconcile<{ id: string; precio: number }>({
        base: [remoto],
        data: [local], // el mismo objeto de entrada: nada se tocó
        now: 1_700_000_100_000,
        originId: 'origina',
      });
      expect(nextSyncedValues(trasFallar.push[0]!)).toEqual({ id: 'ing-1', precio: 2.75 });

      // 3. FALLÓ, pero se selló igual. Mismo destino intacto en 2,50, y un ancestro que miente.
      const trasSellarSinConfirmar = reconcile<{ id: string; precio: number }>({
        base: [remoto],
        data: [{ ...local, sync: { ...local.sync, syncedValues: { id: 'ing-1', precio: 2.75 } } }],
        now: 1_700_000_100_000,
        originId: 'origina',
      });

      // El precio pasa a atribuirse al DESTINO —que no lo tocó—, así que el motor cree que aquí no
      // se editó nada y lo único que falta es traerse los 2,50 «de allí». La edición de 2,75
      // desaparece: se escribe 2,50 encima, sin conflicto, sin aviso y sin forma de recuperarla.
      expect(trasSellarSinConfirmar.conflicts).toEqual([]);
      expect(trasSellarSinConfirmar.push).toEqual([]);
      expect(nextSyncedValues(trasSellarSinConfirmar.pull[0]!)).toEqual({
        id: 'ing-1',
        precio: 2.5,
      });
    });
  });

  describe('reconcile · reloj lógico híbrido (HLC)', () => {
    /**
     * Las dos garantías del reloj, en el mismo ciclo. El destino trae una versión de otro origen 200
     * segundos por delante de `now` — desfase grande pero dentro de la tolerancia, así que es
     * legítima y el reloj la adopta:
     * - **No retrocede**: las versiones que emite nacen POR DELANTE de lo observado, no en `now` a
     *   secas; si no, este origen perdería siempre contra quien tenga el reloj adelantado.
     * - **Ordena dentro del ciclo**: dos escrituras en el mismo milisegundo se desempatan por
     *   contador, en el orden en que se decidieron (de ahí `0004` y `0005`, tras el `0003` leído).
     */
    it('el reloj nunca emite por detrás de lo observado y desempata por contador dentro del ciclo', () => {
      const plan = reconcile<{ id: string; contenido: string }>({
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
            // Convergido con el destino: no escribe, solo deja que el reloj se ponga al día.
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
            id: 'alta-1',
            contenido: 'y',
            sync: {
              id: 'id',
              keyfinder: 'fp2',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: 'alta-2',
            contenido: 'z',
            sync: {
              id: 'id',
              keyfinder: 'fp3',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push.map((registro) => registro.sync.updatedAt)).toEqual([
        '1700000200000-0004-origina',
        '1700000200000-0005-origina',
      ]);
    });

    /**
     * Una versión del destino MUY por delante (10 min, con 5 de tolerancia) no la justifica ningún
     * reloj real: es un dato corrupto — una celda tecleada, arrastrada al ordenar o pegada sin
     * querer. Si entrara en el reloj lo envenenaría, y a partir de ahí todo lo que emitiera este
     * origen nacería en el futuro, contagiando a los demás en cuanto lo leyeran.
     *
     * Así que ni adelanta el reloj ni se respeta al escribir: el registro que la traía se
     * re-estampa en "ahora" (`conflicto`), y lo que se decide después en el mismo ciclo (`alta`)
     * nace en ese mismo milisegundo con el contador siguiente, no en el futuro.
     */
    it('una versión del futuro no adelanta el reloj y se re-estampa al aplicarla', () => {
      const plan = reconcile<{ id: string; contenido: string }>({
        base: [
          {
            id: 'conflicto',
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
            id: 'conflicto',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
          {
            id: 'alta',
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

      expect(plan.conflicts).toEqual([
        { id: 'conflicto', winner: 'remote', blind: true, restamped: true },
      ]);
      expect(plan.pull[0]?.sync.updatedAt).toBe('1700000000000-0000-origina');
      expect(plan.push[0]?.sync.updatedAt).toBe('1700000000000-0001-origina');
    });
  });

  describe('reconcile · robustez de entrada', () => {
    /**
     * Los tres modos de entrada rota, y la garantía de que ninguno se lleva por delante al resto de
     * la colección:
     * - `dup`: dos registros del DESTINO reclaman el mismo id. No se puede saber cuál es el de
     *   verdad, así que no se toca por ningún lado (escribir en uno dejaría al otro reapareciendo
     *   como un fantasma cada ciclo) y se reporta ENTERO, con sus registros, no solo el id. El
     *   registro LOCAL con ese mismo id queda en cuarentena con ellos: no se sube ni se compara.
     * - un registro de `data` sin id legible: no puede indexarse ni compararse ⇒ se ignora, pero
     *   **se reporta** en `ignored`. Descartarlo sin decirlo era perder datos locales en silencio.
     * - `repetido-aqui`: el id repetido está en `data`. Aquí sí hay un criterio —la versión más
     *   alta, y a igualdad el último— y se comprueba porque ese ganador converge con el destino: si
     *   se hubiera quedado con el otro, habría salido un conflicto. El perdedor también se reporta.
     *
     * `sano` demuestra que el resto de la colección decide con normalidad pese a todo lo anterior.
     */
    it('ids duplicados y registros sin id no rompen el ciclo ni contaminan al resto', () => {
      interface Fila {
        id?: string;
        contenido: string;
      }

      const dupUno: Registro<Fila> = {
        id: 'dup',
        contenido: 'uno',
        sync: { id: 'id', keyfinder: 'fp-uno', deleted: false, createdAt: 'no-es-una-version' },
      };
      const dupDos: Registro<Fila> = {
        id: 'dup',
        contenido: 'dos',
        sync: { id: 'id', keyfinder: 'fp-dos', deleted: false, createdAt: 'no-es-una-version' },
      };
      // Sin campo `id`: no hay identidad que resolver, así que se ignora entero — pero se reporta.
      const huerfano: Registro<Fila> = {
        contenido: 'huerfano',
        sync: {
          id: 'id',
          keyfinder: 'fp-huerfano',
          deleted: false,
          createdAt: 'no-es-una-version',
        },
      };
      // Misma versión que su gemela, así que el desempate cae en el orden: gana la última.
      const repetidaPerdedora: Registro<Fila> = {
        id: 'repetido-aqui',
        contenido: 'vieja',
        sync: {
          id: 'id',
          keyfinder: 'fp-primera',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
        },
      };

      const plan = reconcile<Fila>({
        base: [
          dupUno,
          dupDos,
          {
            id: 'sano',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
          {
            id: 'repetido-aqui',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp-ultima',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000700-0000-origina',
            },
          },
        ],
        data: [
          {
            id: 'dup',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
          huerfano,
          repetidaPerdedora,
          {
            id: 'repetido-aqui',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp-ultima',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan).toEqual({
        push: [],
        pull: [
          {
            id: 'sano',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000100-0000-origina',
            },
          },
        ],
        duplicates: [{ id: 'dup', registros: [dupUno, dupDos] }],
        conflicts: [],
        ignored: [
          { side: 'data', reason: 'no-id', id: null, registro: huerfano },
          {
            side: 'data',
            reason: 'duplicate-local',
            id: 'repetido-aqui',
            registro: repetidaPerdedora,
          },
        ],
      });
    });

    /**
     * Las garantías estructurales que permiten probar el motor así de barato, todas sobre la misma
     * entrada:
     * - **Determinista**: la misma entrada da el mismo plan, siempre.
     * - **Síncrono**: es un cálculo, no I/O; el resultado no es una `Promise`.
     * - **Sin mutar nada**: quien llama puede reutilizar sus objetos después.
     * - **Independiente del orden de llegada**: muchas APIs devuelven las filas en otro orden cada
     *   vez, y eso no puede cambiar qué se decide. (Los registros del destino traen versión
     *   legible: así ninguno consume un tick del reloj, que sí es legítimamente sensible al orden —
     *   ver el describe del HLC.)
     * - **Opaco**: el motor nunca inspecciona los campos de negocio más allá de leer el id, así que
     *   un objeto anidado sale siendo EXACTAMENTE (`===`) el mismo que entró, tanto al subir como al
     *   traer. El registro que lo envuelve sí es nuevo: aplanar implica reconstruir el contenedor,
     *   no el contenido.
     */
    it('es puro, síncrono, indiferente al orden de llegada y no interpreta el contenido', () => {
      interface Fila {
        id: string;
        anidado?: { x: number };
        contenido?: string;
      }

      const anidadoRemoto = { x: 1 };
      const anidadoLocal = { x: 2 };
      const input: EngineInput<Fila> = {
        base: [
          {
            id: 'r1',
            anidado: anidadoRemoto,
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000500-0000-origina',
            },
          },
          {
            id: 'r2',
            contenido: 'otro',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: '0000000000600-0000-origina',
            },
          },
        ],
        data: [
          {
            id: 'nuevo',
            anidado: anidadoLocal,
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      };
      const antes = JSON.parse(JSON.stringify(input)) as unknown;

      const plan = reconcile<Fila>(input);

      expect(plan).toEqual(reconcile<Fila>(input));
      expect(plan).not.toBeInstanceOf(Promise);
      expect(JSON.parse(JSON.stringify(input)) as unknown).toEqual(antes);

      const alReves = reconcile<Fila>({ ...input, base: [...input.base].reverse() });
      const porId = (registros: readonly Registro<Fila>[]) =>
        [...registros].sort((x, y) => x.id.localeCompare(y.id));
      expect(porId(alReves.pull)).toEqual(porId(plan.pull));
      expect(alReves.push).toEqual(plan.push);

      expect(plan.push[0]?.anidado).toBe(anidadoLocal);
      expect(plan.pull[0]?.anidado).toBe(anidadoRemoto);
    });
  });

  describe('reconcile · garantías de tipos', () => {
    /**
     * Ni `sync.id` ni `sync.syncedValues` se validan en runtime, y no es un descuido: nada impide
     * construir un objeto incompleto con un `as unknown as Registro<...>`, y recorrer cada registro
     * comprobándolo sería repetir el trabajo que el compilador ya hace gratis. La garantía es de
     * TIPOS, y aquí se fija en un test para que un cambio que la relaje se note en
     * `npm run typecheck` y no en producción:
     *
     * - `sync.id` es **obligatorio, sin default** — omitirlo no compila. `@ts-expect-error` es lo
     *   que lo convierte en un test de verdad y no en un comentario: si volviera a ser opcional, el
     *   error esperado dejaría de producirse, la directiva quedaría sin usar y **`tsc` fallaría con
     *   `TS2578`**.
     * - `sync.syncedValues` es **opcional a propósito**: su ausencia es el estado normal de la
     *   primera sincronización, no un descuido que haya que forzar a declarar. Omitirlo compila, y
     *   el motor lo trata como "sin ancestro" — cae en el criterio de siempre.
     */
    it('`sync.id` es obligatorio en tipos; `sync.syncedValues` es opcional', () => {
      const sinSyncId: Registro<{ id: string }> = {
        id: '1',
        // @ts-expect-error — sync.id es obligatorio, sin default; omitirlo es un error de tipos.
        sync: { keyfinder: 'fp', deleted: false, createdAt: '0000000000100-0000-origina' },
      };
      expect(sinSyncId.sync.keyfinder).toBe('fp');

      const sinAncestro: Registro<{ id: string }> = {
        id: '2',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
        },
      };
      const plan = reconcile<{ id: string }>({
        base: [],
        data: [sinAncestro],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push).toHaveLength(1);
      expect(plan.conflicts).toEqual([]);
    });
  });

  describe('reconcile · el reloj y las versiones locales', () => {
    /**
     * El reloj se pone al día con **los dos lados**, no solo con el destino.
     *
     * Un HLC solo cumple su promesa si observa todo lo que ha visto, **incluida su propia historia
     * ya persistida**. Si solo mirase `base`, la versión que se emite al subir podría nacer por
     * detrás de la que ese mismo registro ya tenía guardada aquí — y entonces el desfase de reloj que
     * el HLC existe para absorber vuelve por la puerta de atrás: la edición vieja de este origen
     * ganaría a una edición remota posterior.
     *
     * `adelantado` lo ejercita: su versión local (`+2 min`, dentro del margen tolerado) es más alta
     * que todo lo que hay en el destino. Lo que se sube tiene que quedar por delante de ella, no por
     * detrás. `normal` está ahí para que se vea que un registro corriente no paga nada por esto.
     */
    it('el reloj observa también `data`: nada se sube por detrás de la versión que ya tenía aquí', () => {
      interface Fila {
        id: string;
        contenido: string;
      }

      const ahora = 1_700_000_000_000;
      const localAdelantada = `${String(ahora + 120_000).padStart(13, '0')}-0000-origina`;

      const plan = reconcile<Fila>({
        base: [
          {
            id: 'normal',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-otro',
            },
          },
        ],
        data: [
          {
            id: 'adelantado',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: localAdelantada,
            },
          },
        ],
        now: ahora,
        originId: 'origina',
      });

      const subida = plan.push[0]?.sync.updatedAt ?? '';
      expect(subida > localAdelantada).toBe(true);
    });

    /**
     * El tope de reloj futuro protege **los dos lados**, no solo el destino.
     *
     * `base` ya estaba protegido (`effectiveVersion` re-estampa lo que viene del futuro). `data` no
     * lo estaba, y ese hueco se paga caro: `data` sale de IndexedDB, que también escriben otra
     * pestaña, una versión anterior de la app o un import — un `updatedAt` corrupto en el año 3000
     * ganaba **todos** los conflictos, para siempre y sin dejar rastro.
     *
     * Con el tope aplicado, una versión local del futuro se trata como lo que es: ilegible. Gana el
     * destino, marcado `blind`, y al aplicar el `pull` el registro local queda re-estampado con una
     * versión sana — o sea, se cura solo.
     */
    it('una versión local del futuro no vale: se trata como ilegible y gana el destino', () => {
      interface Fila {
        id: string;
        contenido: string;
      }

      const ahora = 1_700_000_000_000;
      const delFuturo = `${String(ahora + 6 * 60 * 1000).padStart(13, '0')}-0000-origina`;

      const plan = reconcile<Fila>({
        base: [
          {
            id: 'envenenado',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-otro',
              updatedAt: '0000000000500-0000-otro',
            },
          },
        ],
        data: [
          {
            id: 'envenenado',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              updatedAt: delFuturo,
            },
          },
        ],
        now: ahora,
        originId: 'origina',
      });

      expect(plan.push).toEqual([]);
      expect(plan.conflicts).toEqual([{ id: 'envenenado', winner: 'remote', blind: true }]);
      expect(plan.pull).toEqual([
        {
          id: 'envenenado',
          contenido: 'remoto',
          sync: {
            id: 'id',
            keyfinder: 'fp-remoto',
            deleted: false,
            createdAt: '0000000000100-0000-otro',
            updatedAt: '0000000000500-0000-otro',
          },
        },
      ]);
    });

    /**
     * `updatedAt` es la fecha de cambio **si se puede leer**; si no, la de creación sigue ahí y vale.
     *
     * Los dos caminos por los que se perdía:
     * - `vacio`: `updatedAt: ''` — un `??` no cae con la cadena vacía (es falsy, no nullish), así que
     *   la versión salía `null` sin llegar a mirar `createdAt`.
     * - `basura`: un `updatedAt` que no se puede leer devolvía `null` en vez de caer a `createdAt`.
     *
     * En un registro local eso significa `blind` ⇒ gana el destino: **la edición local se descartaba**
     * aunque su `createdAt` fuera perfectamente legible y posterior. Aquí los dos ganan por fecha, que
     * es lo que les corresponde.
     */
    it('un `updatedAt` vacío o ilegible cae a `createdAt` en vez de perder la edición local', () => {
      interface Fila {
        id: string;
        contenido: string;
      }

      const plan = reconcile<Fila>({
        base: [
          {
            id: 'vacio',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-otro',
            },
          },
          {
            id: 'basura',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-otro',
            },
          },
        ],
        data: [
          {
            id: 'vacio',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000900-0000-origina',
              updatedAt: '',
            },
          },
          {
            id: 'basura',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000900-0000-origina',
              updatedAt: 'lo-que-alguien-tecleo',
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.pull).toEqual([]);
      expect(plan.conflicts).toEqual([
        { id: 'vacio', winner: 'local', blind: false },
        { id: 'basura', winner: 'local', blind: false },
      ]);
      expect(plan.push.map((registro) => registro.id)).toEqual(['vacio', 'basura']);
    });
  });

  describe('reconcile · la entrada local rota se reporta, no se pierde', () => {
    /**
     * Un registro local que el motor no puede indexar **no puede desaparecer en silencio**.
     *
     * Antes se descartaba sin dejar rastro en ninguna lista del plan: quien lo aplicaba no tenía
     * forma de saber que había datos locales que nunca se iban a subir. Un id duplicado del destino
     * sí se reportaba (`duplicates`); el mismo problema del lado local, no. Ahora todo lo que se
     * ignora sale en `ignored`, con el lado y el motivo, que es lo mínimo para poder arreglarlo.
     *
     * Los tres motivos, más el reverso:
     * - `sin-campo` / vacío: no hay identidad que resolver.
     * - **id numérico**: el caso más traicionero, porque el registro parece perfecto. Una hoja de
     *   cálculo devuelve números; si el adaptador no los pasa a texto, la fila entera se evaporaba.
     * - `base` también reporta lo suyo: una fila del destino sin id tampoco puede compararse.
     *
     * `sano` demuestra que el resto de la colección decide con normalidad pese a todo lo anterior.
     */
    it('un registro sin id legible —incluido un id numérico— se reporta en `ignored`', () => {
      interface Fila {
        id?: unknown;
        contenido: string;
      }

      const sinCampo: Registro<Fila> = {
        contenido: 'huerfano',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
        },
      };
      const vacio: Registro<Fila> = {
        id: '',
        contenido: 'vacio',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
        },
      };
      const numerico: Registro<Fila> = {
        id: 42,
        contenido: 'numerico',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
        },
      };
      const remotoSinId: Registro<Fila> = {
        contenido: 'remoto-huerfano',
        sync: {
          id: 'id',
          keyfinder: 'fp',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
        },
      };

      const plan = reconcile<Fila>({
        base: [
          remotoSinId,
          {
            id: 'sano',
            contenido: 'x',
            sync: {
              id: 'id',
              keyfinder: 'fp',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
            },
          },
        ],
        data: [sinCampo, vacio, numerico],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.ignored).toEqual([
        { side: 'base', reason: 'no-id', id: null, registro: remotoSinId },
        { side: 'data', reason: 'no-id', id: null, registro: sinCampo },
        { side: 'data', reason: 'no-id', id: null, registro: vacio },
        { side: 'data', reason: 'no-id', id: null, registro: numerico },
      ]);
      expect(plan.push).toEqual([]);
      expect(plan.pull.map((registro) => registro.id)).toEqual(['sano']);
    });

    /**
     * Un id repetido **aquí** se resuelve por versión, no por posición en el array.
     *
     * Antes se quedaba con el último elemento del array y el resto desaparecía sin reporte. Dos
     * problemas en uno: el criterio no era de negocio (el orden en que un almacén devuelve las filas
     * no significa nada) y la pérdida era invisible. Ahora gana **la versión más alta** —el mismo
     * criterio que decide cualquier otro empate en el motor— y el resto sale en `ignored`.
     *
     * La prueba de que ya no depende del orden: el mismo caso con `data` al revés da exactamente el
     * mismo plan, salvo el orden en que se reportan los ignorados.
     *
     * `sin-version` fija el desempate cuando ninguno es legible: no hay criterio mejor que el orden,
     * así que gana el último y queda documentado.
     */
    it('un id repetido en `data` lo gana la versión más alta, no la posición', () => {
      interface Fila {
        id: string;
        contenido: string;
      }

      const vieja: Registro<Fila> = {
        id: 'repetido',
        contenido: 'vieja',
        sync: {
          id: 'id',
          keyfinder: 'fp-vieja',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '0000000000200-0000-origina',
        },
      };
      const nueva: Registro<Fila> = {
        id: 'repetido',
        contenido: 'nueva',
        sync: {
          id: 'id',
          keyfinder: 'fp-nueva',
          deleted: false,
          createdAt: '0000000000100-0000-origina',
          updatedAt: '0000000000900-0000-origina',
        },
      };

      const entrada: EngineInput<Fila> = {
        base: [],
        // La nueva va PRIMERO: quedarse con la última del array elegiría la vieja.
        data: [nueva, vieja],
        now: 1_700_000_000_000,
        originId: 'origina',
      };

      const plan = reconcile<Fila>(entrada);

      expect(plan.push.map((registro) => registro.contenido)).toEqual(['nueva']);
      expect(plan.ignored).toEqual([
        { side: 'data', reason: 'duplicate-local', id: 'repetido', registro: vieja },
      ]);

      const alReves = reconcile<Fila>({ ...entrada, data: [vieja, nueva] });
      expect(alReves.push).toEqual(plan.push);
      expect(alReves.ignored).toEqual(plan.ignored);
    });
  });

  describe('reconcile · la fusión solo escribe donde falta algo', () => {
    /**
     * Una fusión emite dos comandos **cuando de verdad faltan los dos**. Si solo un lado cambió
     * respecto al ancestro, escribir en los dos es escribir de más.
     *
     * Y no es un caso raro: en cuanto el adaptador hace su trabajo (guardar `nextSyncedValues` tras
     * cada ciclo con éxito), el ancestro está presente **casi siempre**, así que **cualquier edición
     * corriente** entra por aquí. Antes, todas salían con `push` Y `pull` y una entrada en
     * `conflicts` con `winner: 'merged'`. Eso significaba: escrituras en el destino de filas que no
     * habían cambiado (cuota, latencia y una carrera con cualquier otro dispositivo) y un
     * diagnóstico que llamaba «conflicto» a lo que era una edición normal.
     *
     * Los cuatro casos, con el mismo ancestro `{ a: 'orig', b: 'orig' }`:
     * - `solo-local`: cambió `b` aquí ⇒ al destino le falta ⇒ **solo `push`**. No hay conflicto.
     * - `solo-remoto`: cambió `a` allí ⇒ aquí falta ⇒ **solo `pull`**. No hay conflicto.
     * - `los-dos`: cada lado cambió un campo distinto ⇒ **los dos** comandos y `winner: 'merged'`,
     *   igual que siempre. Sin regresión.
     * - `ni-uno`: los tres lados tienen los MISMOS valores y solo difieren las huellas — una huella
     *   quedó mal calculada o rancia. No hay nada que mandar al destino (sus valores ya son los
     *   buenos); se escribe **solo aquí** para que la huella local se recalcule y el ciclo siguiente
     *   converja de verdad. Sin esto, cada ciclo volvería a ver divergencia y a no hacer nada.
     */
    it('solo local ⇒ solo push; solo el destino ⇒ solo pull; los dos ⇒ los dos y conflicto', () => {
      interface Fila {
        id: string;
        a: string;
        b: string;
      }

      const ancestro = { a: 'orig', b: 'orig' };
      const versionRemota = {
        id: 'id',
        keyfinder: 'fp-remoto',
        deleted: false,
        createdAt: '0000000000100-0000-otro',
      } as const;
      const versionLocal = {
        id: 'id',
        keyfinder: 'fp-local',
        deleted: false,
        createdAt: '0000000000100-0000-origina',
      } as const;

      const plan = reconcile<Fila>({
        base: [
          { id: 'solo-local', a: 'orig', b: 'orig', sync: versionRemota },
          { id: 'solo-remoto', a: 'remoto', b: 'orig', sync: versionRemota },
          { id: 'los-dos', a: 'remoto', b: 'orig', sync: versionRemota },
          { id: 'ni-uno', a: 'orig', b: 'orig', sync: versionRemota },
        ],
        data: [
          {
            id: 'solo-local',
            a: 'orig',
            b: 'local',
            sync: { ...versionLocal, syncedValues: { id: 'solo-local', ...ancestro } },
          },
          {
            id: 'solo-remoto',
            a: 'orig',
            b: 'orig',
            sync: { ...versionLocal, syncedValues: { id: 'solo-remoto', ...ancestro } },
          },
          {
            id: 'los-dos',
            a: 'orig',
            b: 'local',
            sync: { ...versionLocal, syncedValues: { id: 'los-dos', ...ancestro } },
          },
          {
            id: 'ni-uno',
            a: 'orig',
            b: 'orig',
            sync: { ...versionLocal, syncedValues: { id: 'ni-uno', ...ancestro } },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.push.map(nextSyncedValues)).toEqual([
        { id: 'solo-local', a: 'orig', b: 'local' },
        { id: 'los-dos', a: 'remoto', b: 'local' },
      ]);
      expect(plan.pull.map(nextSyncedValues)).toEqual([
        { id: 'solo-remoto', a: 'remoto', b: 'orig' },
        { id: 'los-dos', a: 'remoto', b: 'local' },
        { id: 'ni-uno', a: 'orig', b: 'orig' },
      ]);
      // Solo el caso en que de verdad hubo que combinar dos cambios cuenta como conflicto.
      expect(plan.conflicts).toEqual([
        {
          id: 'los-dos',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: ['a'], local: ['b'] },
        },
      ]);
    });

    /**
     * Un campo que desapareció de los dos lados desaparece **del todo** del registro fusionado.
     *
     * Antes se quedaba como una clave con valor `undefined`, arrastrada del ancestro. Es un fallo que
     * `toEqual` **no ve** (vitest trata `{ a: undefined }` y `{}` como iguales), así que se comprueba
     * con `Object.keys` a propósito — si no, este test pasaría igual estando roto. Importa porque ese
     * registro se escribe en el destino y se convierte en el ancestro del ciclo siguiente: una clave
     * fantasma se propaga.
     */
    it('una clave borrada en los dos lados no queda como `undefined` en el fusionado', () => {
      interface Fila {
        id: string;
        a: string;
        obsoleto?: string;
      }

      const plan = reconcile<Fila>({
        base: [
          {
            id: 'm',
            a: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-otro',
            },
          },
        ],
        data: [
          {
            id: 'm',
            a: 'orig',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: 'm', a: 'orig', obsoleto: 'y' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(Object.keys(nextSyncedValues(plan.pull[0]))).toEqual(['id', 'a']);
    });

    /**
     * `base` y `data` que declaran identidades en campos distintos **no se fusionan**.
     *
     * Fusionar mezcla los campos de los dos lados, así que si uno dice que su identidad vive en `id`
     * y el otro en `sku`, el registro resultante saldría con las DOS — y se escribiría así en el
     * destino, inventando una columna y una identidad que nadie pidió. Ante esa incoherencia se cae
     * al criterio de siempre (gana un lado entero), que sube o trae un registro tal cual venía, con
     * una sola identidad.
     */
    it('con nombres de campo de identidad distintos no se fusiona: nunca sale un registro con dos', () => {
      interface Fila {
        id?: string;
        sku?: string;
        a: string;
      }

      const plan = reconcile<Fila>({
        base: [
          {
            id: 'x',
            a: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-otro',
              updatedAt: '0000000000900-0000-otro',
            },
          },
        ],
        data: [
          {
            sku: 'x',
            a: 'local',
            sync: {
              id: 'sku',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { sku: 'x', a: 'orig' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([{ id: 'x', winner: 'remote', blind: false }]);
      expect(plan.push).toEqual([]);
      expect(Object.keys(nextSyncedValues(plan.pull[0])).sort()).toEqual(['a', 'id']);
    });
  });

  describe('reconcile · la huella de una fusión hay que recalcularla', () => {
    /**
     * Por qué la huella de un registro fusionado es `null` y no `''`.
     *
     * Los valores fusionados son contenido **nuevo**, que no coincide con la huella de ningún lado, y
     * el motor no calcula huellas. Hasta ahí, igual que antes. Lo que cambia es cómo se dice: `''` es
     * una cadena como cualquier otra —indistinguible de una huella legítima— y persistirla tenía una
     * consecuencia silenciosa y grave, que es lo que fija este test de DOS ciclos: en el segundo, los
     * dos lados traen `''`, el motor los ve iguales y **declara convergencia con contenidos
     * distintos**. La divergencia se queda ahí para siempre, sin conflicto y sin rastro.
     *
     * Con `null`, «hay que recalcular» deja de ser una convención que cada adaptador tiene que
     * recordar y pasa a ser algo que el tipo obliga a mirar; y aunque alguien lo persista igual, dos
     * `null` ya **no** cuentan como convergidos.
     */
    it('sale marcada para recalcular, y persistirla tal cual no hace converger en falso', () => {
      interface Fila {
        id: string;
        a: string;
        b: string;
      }

      const primerCiclo = reconcile<Fila>({
        base: [
          {
            id: 'm',
            a: 'remoto',
            b: 'orig',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-otro',
            },
          },
        ],
        data: [
          {
            id: 'm',
            a: 'orig',
            b: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: '0000000000100-0000-origina',
              syncedValues: { id: 'm', a: 'orig', b: 'orig' },
            },
          },
        ],
        now: 1_700_000_000_000,
        originId: 'origina',
      });

      const fusionado = primerCiclo.push[0];
      expect(fusionado.sync.keyfinder).toBeNull();

      // El adaptador que NO recalcula: escribe la huella centinela tal cual en los dos lados, pero
      // con contenidos que en realidad siguen sin coincidir (aquí se aplicó el `pull`, allí no).
      const segundoCiclo = reconcile<Fila>({
        base: [{ ...fusionado, a: 'remoto', b: 'orig' }],
        data: [{ ...fusionado, sync: { ...fusionado.sync, syncedValues: undefined } }],
        now: 1_700_000_001_000,
        originId: 'origina',
      });

      expect(segundoCiclo.conflicts).not.toEqual([]);
    });
  });

  describe('reconcile · una versión no fiable del destino se ve en el diagnóstico', () => {
    /**
     * Cuando la versión del destino no se puede creer —ilegible, o de un futuro que ningún reloj
     * justifica— se re-estampa con el reloj de este origen. Eso es lo correcto (si no, un valor
     * corrupto en una columna que un humano edita ganaría esa fila para siempre), pero tiene una
     * consecuencia que conviene no esconder: la versión re-estampada es, por construcción, **la más
     * alta que hay** — así que el destino gana ese conflicto contra cualquier edición local legítima.
     *
     * Que gane es defendible: el destino es la fuente de la verdad. Que **no se vea** no lo era:
     * `blind` solo habla del lado local, así que el conflicto salía indistinguible de uno decidido
     * con dos fechas buenas. `restamped` lo dice.
     */
    it('la versión re-estampada gana el conflicto, y queda marcada como `restamped`', () => {
      interface Fila {
        id: string;
        contenido: string;
      }

      const ahora = 1_700_000_000_000;
      const plan = reconcile<Fila>({
        base: [
          {
            id: 'ilegible',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: 'lo-que-alguien-tecleo',
            },
          },
          {
            id: 'del-futuro',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-otro',
              updatedAt: '9999999999999-0000-otro',
            },
          },
          {
            id: 'normal',
            contenido: 'remoto',
            sync: {
              id: 'id',
              keyfinder: 'fp-remoto',
              deleted: false,
              createdAt: '0000000000100-0000-otro',
            },
          },
        ],
        data: [
          {
            id: 'ilegible',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: `${String(ahora - 1000).padStart(13, '0')}-0000-origina`,
            },
          },
          {
            id: 'del-futuro',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: `${String(ahora - 1000).padStart(13, '0')}-0000-origina`,
            },
          },
          {
            id: 'normal',
            contenido: 'local',
            sync: {
              id: 'id',
              keyfinder: 'fp-local',
              deleted: false,
              createdAt: `${String(ahora - 1000).padStart(13, '0')}-0000-origina`,
            },
          },
        ],
        now: ahora,
        originId: 'origina',
      });

      expect(plan.conflicts).toEqual([
        { id: 'ilegible', winner: 'remote', blind: false, restamped: true },
        { id: 'del-futuro', winner: 'remote', blind: false, restamped: true },
        // El normal pierde por fecha, con las dos versiones legibles: aquí no hay nada que marcar.
        { id: 'normal', winner: 'local', blind: false },
      ]);
    });
  });

  describe('reconcile · volumen', () => {
    /**
     * Un ciclo real trae la colección entera, no un puñado de filas, así que el motor tiene que
     * aguantar el tamaño de un almacén de verdad sin degradarse a cuadrático. El agrupado por id era
     * el sitio donde eso podía pasar sin que nadie lo notara (copiaba el array del grupo en cada
     * inserción), y el caso peor es justo el patológico: **todos los registros con el mismo id**.
     *
     * El tope de tiempo es deliberadamente generoso: no se está midiendo rendimiento —eso sería un
     * test intermitente—, se está detectando un cambio de orden de complejidad, que se pasa de ese
     * tope por varios órdenes de magnitud.
     */
    it('10.000 registros, y 5.000 repitiendo el mismo id, salen en un tiempo razonable', () => {
      interface Fila {
        id: string;
        contenido: string;
      }

      const version = (millis: number) => `${String(millis).padStart(13, '0')}-0000-origina`;
      const base: Registro<Fila>[] = [];
      const data: Registro<Fila>[] = [];
      for (let i = 0; i < 10_000; i += 1) {
        const sync = {
          id: 'id',
          keyfinder: `fp-${i}`,
          deleted: false,
          createdAt: version(100 + i),
        } as const;
        base.push({ id: `r${i}`, contenido: `remoto-${i}`, sync });
        // Un tercio diverge: hay que decidirlos, no solo compararlos.
        data.push({
          id: `r${i}`,
          contenido: `local-${i}`,
          sync: { ...sync, keyfinder: i % 3 === 0 ? `fp-local-${i}` : `fp-${i}` },
        });
      }
      for (let i = 0; i < 5_000; i += 1) {
        data.push({ id: 'repetido', contenido: `dup-${i}`, sync: base[0].sync });
      }

      const arranque = performance.now();
      const plan = reconcile<Fila>({ base, data, now: 1_700_000_000_000, originId: 'origina' });
      const tardo = performance.now() - arranque;

      expect(plan.conflicts).toHaveLength(3334);
      expect(plan.ignored).toHaveLength(4_999);
      expect(tardo).toBeLessThan(2_000);
    });
  });
});
