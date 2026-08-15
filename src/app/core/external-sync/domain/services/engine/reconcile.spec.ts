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
      expect(vacio).toEqual({ push: [], pull: [], duplicates: [], conflicts: [] });

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
     * - `ciego-los-dos`: ninguna es legible ⇒ además hay que sintetizar la versión que se escribe.
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
        { id: 'ciego-los-dos', winner: 'remote', blind: true },
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
     * dos por separado basta. La huella va vacía A PROPÓSITO — el contenido fusionado no coincide
     * con la de ningún lado y el motor no calcula huellas.
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
          keyfinder: '',
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
        // `obsoleto` desapareció de los dos lados: no se le atribuye a nadie.
        {
          id: 'campo-borrado',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: ['a'], local: [] },
        },
        // `a` cambió en los dos, pero al mismo valor: tampoco se atribuye.
        {
          id: 'mismo-valor',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: [], local: ['b'] },
        },
        {
          id: 'sin-cambios-reales',
          winner: 'merged',
          blind: false,
          mergedFrom: { remote: [], local: [] },
        },
      ]);

      const fusionados = [
        { id: 'tipos', precio: 20, activo: false },
        { id: 'arrays', nombre: 'remoto', tags: ['a', 'b', 'c'] },
        { id: 'campo-nuevo', a: 'remoto-a', b: 'nuevo-local' },
        { id: 'campo-borrado', a: 'remoto-a' }, // `obsoleto` ya no está en ninguno
        { id: 'mismo-valor', a: 'nuevo', b: 'local-b' },
        { id: 'sin-cambios-reales', a: 'x', b: 'y' },
      ];
      expect(plan.push.map(nextSyncedValues)).toEqual(fusionados);
      expect(plan.pull.map(nextSyncedValues)).toEqual(fusionados);
      // Toda fusión sale con la huella vacía: quien aplique el plan DEBE recalcularla.
      expect(plan.push.every((registro) => registro.sync.keyfinder === '')).toBe(true);
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

      expect(plan.conflicts).toEqual([{ id: 'conflicto', winner: 'remote', blind: true }]);
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
     *   como un fantasma cada ciclo) y se reporta ENTERO, con sus registros, no solo el id.
     * - un registro de `data` sin id legible: no puede indexarse ni compararse ⇒ se ignora.
     * - `repetido-aqui`: el id repetido está en `data`. Aquí sí hay un criterio —el último gana— y
     *   se comprueba porque ese último converge con el destino: si se hubiera quedado con el
     *   primero, habría salido un conflicto.
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
          {
            // Sin campo `id`: no hay identidad que resolver, así que se ignora entero.
            contenido: 'huerfano',
            sync: {
              id: 'id',
              keyfinder: 'fp-huerfano',
              deleted: false,
              createdAt: 'no-es-una-version',
            },
          },
          {
            id: 'repetido-aqui',
            contenido: 'vieja',
            sync: {
              id: 'id',
              keyfinder: 'fp-primera',
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
});
