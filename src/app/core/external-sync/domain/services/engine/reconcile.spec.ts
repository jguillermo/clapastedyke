import { LogicalVersion } from './hybrid-clock';
import { reconcile } from './reconcile';
import {
  BaseItem,
  CollectionSnapshot,
  EngineInput,
  LocalItem,
  MassDeleteGuard,
  RemoteItem,
} from './engine.types';

/**
 * El motor no depende de ninguna librería, ni hace red ni I/O: es una función pura, así que estos son
 * tests unitarios en el sentido más estricto — sin `TestBed`, sin dobles, sin async.
 *
 * Cada `it(...)` lleva un comentario con tres partes:
 * - **Caso**: la situación real que representa (qué le pasó al dato entre la última sincronización y
 *   ahora), en lenguaje llano, sin jerga del código.
 * - **Entrada**: qué hay en cada una de las tres copias que compara el motor — `local` (aquí),
 *   `remoto` (el destino) y `base` (la última vez que se supo que coincidían) — o su ausencia, que
 *   también es información (`sin base` = nunca se vio antes).
 * - **Salida**: qué decide el motor y por qué esa es la decisión correcta para ese caso.
 */

// Un epoch real (no un número pequeño): restar 90 días para una lápida vieja no puede dar un
// milisegundo negativo, o el propio `toString()` de la versión produciría un guion de más y
// rompería su propio parseo — el mismo problema de fondo que los ids de origen con guion.
const NOW = 1_700_000_000_000;

function remoteItem(overrides: Partial<RemoteItem<string>> & { id: string }): RemoteItem<string> {
  return {
    value: 'contenido',
    fingerprint: 'fp',
    writtenFingerprint: 'fp',
    version: null,
    deleted: false,
    ref: overrides.id,
    ...overrides,
  };
}

function localItem(overrides: Partial<LocalItem<string>> & { id: string }): LocalItem<string> {
  return { value: 'contenido', fingerprint: 'fp', changedAt: null, ...overrides };
}

function baseItem(overrides: Partial<BaseItem> & { collection: string; id: string }): BaseItem {
  return { fingerprint: 'fp', version: versionAt(0), deleted: false, ...overrides };
}

function snapshot(
  collection: string,
  items: RemoteItem<string>[] = [],
  present = true,
): CollectionSnapshot<string> {
  return { collection, present, items };
}

function input<TValue = string>(overrides: Partial<EngineInput<TValue>> = {}): EngineInput<TValue> {
  return {
    remote: [],
    base: [],
    local: {},
    now: NOW,
    originId: 'origina',
    ...overrides,
  };
}

// Sin guiones a propósito: el formato "millis-contador-origen" se parte por "-", así que un id de
// origen con guion (como el que tendría un UUID) rompería el parseo. En producción el id de
// dispositivo es hexadecimal corto y nunca lleva guion (ver `IndexedDbDeviceIdentity`); aquí se
// respeta la misma restricción en vez de tapar el problema alargando la lógica de parseo.
function versionAt(millis: number, counter = 0, originId = 'origina'): string {
  return LogicalVersion.of(millis, counter, originId).toString();
}

describe('reconcile · three-way merge básico', () => {
  /**
   * Caso: nadie tocó el dato desde la última sincronización, ni aquí ni en el destino.
   * Entrada: local, remoto y base tienen la MISMA huella ('fp') — coinciden los tres.
   * Salida: nada que subir, ni traer, ni adoptar, ni conflicto — el plan queda vacío para este id.
   */
  it('sin cambios en ningún lado, no hay nada que hacer', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp' })]),
        ],
        local: { a: [localItem({ id: '1', fingerprint: 'fp' })] },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp' })],
      }),
    );

    expect(plan.push).toEqual([]);
    expect(plan.apply).toEqual([]);
    expect(plan.adopt).toEqual([]);
    expect(plan.conflicts).toEqual([]);
  });

  /**
   * Caso: el usuario editó el dato en este dispositivo; el destino sigue como estaba la última vez
   * que se sincronizó.
   * Entrada: base='fp-old' (lo último que coincidía); remoto='fp-old' (el destino no cambió);
   * local='fp-new' (aquí sí cambió).
   * Salida: `push` con el contenido nuevo y una versión recién emitida por el reloj; nada que aplicar.
   */
  it('solo cambió lo local: se sube', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({ id: '1', fingerprint: 'fp-old', writtenFingerprint: 'fp-old' }),
          ]),
        ],
        local: { a: [localItem({ id: '1', fingerprint: 'fp-new' })] },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-old' })],
      }),
    );

    expect(plan.push).toEqual([
      {
        collection: 'a',
        id: '1',
        value: 'contenido',
        fingerprint: 'fp-new',
        version: versionAt(NOW),
      },
    ]);
    expect(plan.apply).toEqual([]);
  });

  /**
   * Caso: otro dispositivo (o alguien editando el destino directamente) cambió el dato; aquí sigue
   * como estaba.
   * Entrada: base='fp-old'; local='fp-old' (sin cambios aquí); remoto='fp-new' con su propia
   * versión ya escrita (500) — nadie la tocó sin querer, así que es de fiar.
   * Salida: `apply` con el contenido nuevo, respetando la versión 500 tal cual (no hizo falta
   * sintetizar ninguna).
   */
  it('solo cambió lo remoto: se aplica aquí', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp-new',
              writtenFingerprint: 'fp-new',
              version: versionAt(500),
            }),
          ]),
        ],
        local: { a: [localItem({ id: '1', fingerprint: 'fp-old' })] },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-old' })],
      }),
    );

    expect(plan.apply).toEqual([
      {
        collection: 'a',
        id: '1',
        value: 'contenido',
        fingerprint: 'fp-new',
        version: versionAt(500),
      },
    ]);
    expect(plan.push).toEqual([]);
  });

  /**
   * Caso: dos ediciones en paralelo desde la última sincronización — aquí y en el destino — y hay
   * que desempatar por fecha lógica.
   * Entrada: base='fp-base'; remoto='fp-remote' con versión 2000; local='fp-local' con
   * `changedAt`=3000 (se sabe que el cambio de aquí es más reciente).
   * Salida: conflicto resuelto a favor de lo local (`blind: false`, porque sí se conocía su fecha);
   * se sube lo local.
   */
  it('ambos cambiaron: gana la versión más alta', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp-remote',
              writtenFingerprint: 'fp-remote',
              version: versionAt(2_000),
            }),
          ]),
        ],
        local: {
          a: [localItem({ id: '1', fingerprint: 'fp-local', changedAt: versionAt(3_000) })],
        },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-base' })],
      }),
    );

    expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'local', blind: false }]);
    expect(plan.push).toHaveLength(1);
    expect(plan.apply).toEqual([]);
  });

  /**
   * Caso: igual que el anterior, pero no se sabe cuándo se editó aquí (por ejemplo, un dato guardado
   * antes de que existiera el campo que registra la fecha de cambio local).
   * Entrada: igual que arriba, pero `local.changedAt = null`.
   * Salida: gana el destino por precaución (nunca se favorece a lo local sin poder compararlo), y el
   * conflicto queda marcado `blind: true` para que quien lo revise sepa que la decisión fue a ciegas.
   */
  it('ambos cambiaron sin versión local conocida: gana el remoto, marcado como a ciegas', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp-remote',
              writtenFingerprint: 'fp-remote',
              version: versionAt(2_000),
            }),
          ]),
        ],
        local: { a: [localItem({ id: '1', fingerprint: 'fp-local', changedAt: null })] },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-base' })],
      }),
    );

    expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'remote', blind: true }]);
    expect(plan.apply).toHaveLength(1);
    expect(plan.push).toEqual([]);
  });

  /**
   * Caso: un dato completamente nuevo, creado aquí, que el destino nunca ha recibido — la primera
   * sincronización de ese registro.
   * Entrada: sin remoto para ese id (la colección existe pero está vacía) y sin base; solo local.
   * Salida: `push` con la versión recién emitida — es un alta, no hay nada que comparar.
   */
  it('alta solo local (el destino nunca lo vio) se sube', () => {
    const plan = reconcile(
      input({
        remote: [snapshot('a', [])],
        local: { a: [localItem({ id: '1', fingerprint: 'fp' })] },
      }),
    );

    expect(plan.push).toEqual([
      { collection: 'a', id: '1', value: 'contenido', fingerprint: 'fp', version: versionAt(NOW) },
    ]);
  });

  /**
   * Caso: un dato que ya existe en el destino (llegó de otro dispositivo, o de un ciclo anterior) y
   * todavía no llegó aquí. A diferencia de la "adopción" (ver el siguiente describe), este registro
   * SÍ lleva su huella escrita — el motor ya lo conocía, solo que no en este dispositivo.
   * Entrada: solo remoto, con huella escrita y coincidente ('fp' === 'fp'); sin local, sin base.
   * Salida: `apply` con una versión sintetizada (el remoto no traía ninguna propia); nunca pasa por
   * `adopt`, porque `adopt` es solo para huella vacía.
   */
  it('alta solo remota, ya escrita con su huella, se aplica sin pasar por la adopción', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp' })]),
        ],
      }),
    );

    expect(plan.apply).toEqual([
      { collection: 'a', id: '1', value: 'contenido', fingerprint: 'fp', version: versionAt(NOW) },
    ]);
    expect(plan.adopt).toEqual([]);
  });
});

describe('reconcile · adopción (huella nunca escrita)', () => {
  /**
   * Caso: la primera vez que el motor mira un destino que YA tenía datos — por ejemplo, alguien
   * escribió directamente ahí sin pasar por este sistema, así que nunca se le puso una huella.
   * Entrada: remoto con `writtenFingerprint: ''` (nunca escrita); sin local, sin base.
   * Salida: `adopt` (se registra como conocido, con la versión más baja posible) Y `apply` (se trae
   * aquí, porque no existía localmente). Nunca genera un `conflict`: no es una edición, es la
   * primera vez que se ve.
   */
  it('un registro sin huella escrita se adopta como base y no se toma por editado a mano', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({ id: '1', fingerprint: 'fp-x', writtenFingerprint: '', ref: 5 }),
          ]),
        ],
      }),
    );

    expect(plan.adopt).toEqual([
      {
        collection: 'a',
        id: '1',
        ref: 5,
        fingerprint: 'fp-x',
        version: LogicalVersion.adopted().toString(),
        deleted: false,
      },
    ]);
    expect(plan.apply).toEqual([
      {
        collection: 'a',
        id: '1',
        value: 'contenido',
        fingerprint: 'fp-x',
        version: LogicalVersion.adopted().toString(),
      },
    ]);
    expect(plan.conflicts).toEqual([]);
  });

  /**
   * Caso: mismo escenario, pero aquí YA existía un dato distinto — hasta este ciclo, la app era la
   * única fuente de la verdad para ese registro, así que lo del destino es como mucho una copia
   * vieja.
   * Entrada: remoto sin huella ('fp-remote'); local con contenido distinto ('fp-local').
   * Salida: `adopt` (para dejar registrada la base) y ADEMÁS `push` — gana lo local, no lo adoptado.
   */
  it('al adoptar, si el contenido local difiere del adoptado, gana lo local', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({ id: '1', fingerprint: 'fp-remote', writtenFingerprint: '' }),
          ]),
        ],
        local: { a: [localItem({ id: '1', fingerprint: 'fp-local' })] },
      }),
    );

    expect(plan.adopt).toHaveLength(1);
    expect(plan.push).toHaveLength(1);
    expect(plan.apply).toEqual([]);
  });

  /**
   * Caso: variante del anterior donde el contenido adoptado YA coincide con lo local (son, de
   * hecho, el mismo dato).
   * Entrada: remoto sin huella ('fp-same'); local con el MISMO contenido ('fp-same').
   * Salida: solo `adopt` — no hay nada que mover en ninguna dirección.
   */
  it('un alta con huella vacía cuyo contenido ya coincide con lo local no sube ni baja nada más', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp-same', writtenFingerprint: '' })]),
        ],
        local: { a: [localItem({ id: '1', fingerprint: 'fp-same' })] },
      }),
    );

    expect(plan.adopt).toHaveLength(1);
    expect(plan.push).toEqual([]);
    expect(plan.apply).toEqual([]);
  });

  /**
   * Caso: comprobar que "adoptar" no inventa antigüedad — pase lo que pase con el reloj del ciclo,
   * un dato adoptado siempre parte de la versión más baja que existe.
   * Entrada: remoto sin huella; `now` deliberadamente distinto de lo normal, para demostrar que no
   * influye en el resultado.
   * Salida: `adopt[0].version` es siempre `LogicalVersion.adopted()`, nunca algo derivado del reloj.
   */
  it('la versión de una adopción es siempre la mínima, no la del reloj del ciclo', () => {
    const plan = reconcile(
      input({
        now: 999_999_999,
        remote: [
          snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: '' })]),
        ],
      }),
    );

    expect(plan.adopt[0]?.version).toBe(LogicalVersion.adopted().toString());
  });
});

describe('reconcile · ediciones fuera de proceso', () => {
  /**
   * Caso: alguien editó el valor directamente en el destino (p. ej. una celda de una hoja de
   * cálculo) sin pasar por la app — el contenido cambió pero la huella que quedó escrita es la
   * vieja, y la versión que trae (500) ya no es de fiar (quien tocó el valor no la actualizó).
   * Entrada: remoto con `fingerprint` (recalculada del contenido actual) = 'fp-contenido-nuevo',
   * pero `writtenFingerprint` (la que había antes) = 'fp-contenido-viejo' — no coinciden.
   * Salida: `apply` con una versión sintetizada por el reloj de este ciclo, NO la 500 que traía
   * escrita — confiar en ella pisaría la corrección de esa persona sin dejar rastro.
   */
  it('huella escrita que no coincide con la recalculada no confía en la versión escrita', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp-contenido-nuevo',
              writtenFingerprint: 'fp-contenido-viejo',
              version: versionAt(500),
            }),
          ]),
        ],
        // Sin base y sin local: es un alta remota nueva, para no confundir el caso con "se borró
        // aquí" (eso lo cubre su propio describe, "borrado y tombstones").
      }),
    );

    expect(plan.apply).toHaveLength(1);
    // Se ignora la versión escrita (500) y se sintetiza una nueva con el reloj del ciclo.
    expect(plan.apply[0]?.version).toBe(versionAt(NOW));
  });
});

describe('reconcile · reloj lógico híbrido (HLC)', () => {
  /**
   * Caso: dos altas locales, en dos colecciones distintas, decididas dentro del mismo ciclo — deben
   * quedar ordenadas de forma inequívoca aunque compartan el mismo milisegundo.
   * Entrada: colecciones 'a' y 'b', cada una con un alta local nueva.
   * Salida: la primera decidida lleva contador 0; la segunda, contador 1 — mismo milisegundo, orden
   * total garantizado.
   */
  it('dos escrituras dentro del mismo ciclo se desempatan por contador', () => {
    const plan = reconcile(
      input({
        remote: [snapshot('a', []), snapshot('b', [])],
        local: {
          a: [localItem({ id: '1', fingerprint: 'fp' })],
          b: [localItem({ id: '1', fingerprint: 'fp' })],
        },
      }),
    );

    expect(plan.push[0]?.version).toBe(versionAt(NOW, 0));
    expect(plan.push[1]?.version).toBe(versionAt(NOW, 1));
  });

  /**
   * Caso: dos orígenes editaron exactamente en el mismo instante lógico (mismo milisegundo y mismo
   * contador) — hace falta un criterio de desempate que dé SIEMPRE el mismo resultado, se mire desde
   * el dispositivo que se mire.
   * Entrada: remoto version=(5000, 0, 'deviceb'); local `changedAt`=(5000, 0, 'devicea').
   * Salida: gana 'deviceb' (mayor en orden alfabético) — el mismo desempate, sea cual sea la réplica
   * que lo evalúe.
   */
  it('mismo instante y contador se desempatan por el origen, de forma determinista', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp-remote',
              writtenFingerprint: 'fp-remote',
              version: versionAt(5_000, 0, 'deviceb'),
            }),
          ]),
        ],
        local: {
          a: [
            localItem({
              id: '1',
              fingerprint: 'fp-local',
              changedAt: versionAt(5_000, 0, 'devicea'),
            }),
          ],
        },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-base' })],
      }),
    );

    // 'devicea' < 'deviceb': el remoto gana el empate, en cualquier réplica que lo evalúe.
    expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'remote', blind: false }]);
  });

  /**
   * Caso: el reloj de este origen va "atrasado" respecto a lo que ya se ha visto escrito en el
   * destino (por ejemplo, por otro dispositivo) — no debe retroceder al emitir una versión nueva.
   * Entrada: colección 'semilla' con una versión observada más adelantada que `now` (pero dentro del
   * margen de tolerancia); colección 'empuje' con un alta local que necesita versión nueva.
   * Salida: la versión del alta nace POR DELANTE de lo observado (mismo milisegundo, contador
   * siguiente), nunca detrás de `now` a secas.
   */
  it('el reloj nunca emite una versión anterior a la última observada, aunque "ahora" sea menor', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('semilla', [
            remoteItem({
              id: '1',
              fingerprint: 'fp',
              writtenFingerprint: 'fp',
              version: versionAt(NOW + 200_000, 3, 'otroorigen'),
            }),
          ]),
          snapshot('empuje', []),
        ],
        local: {
          semilla: [localItem({ id: '1', fingerprint: 'fp' })],
          empuje: [localItem({ id: '1', fingerprint: 'fp' })],
        },
        base: [baseItem({ collection: 'semilla', id: '1', fingerprint: 'fp' })],
      }),
    );

    expect(plan.push).toHaveLength(1);
    expect(plan.push[0]?.version).toBe(versionAt(NOW + 200_000, 4, 'origina'));
  });

  /**
   * Caso: alguien (o un error) dejó una fecha absurda en el destino — mucho más allá de lo que
   * cualquier reloj real justificaría — y no debe contaminar el resto del sistema.
   * Entrada: remoto con una versión 10 minutos en el futuro (el margen de tolerancia es de 5 min).
   * Salida: esa versión se ignora (ni siquiera "adelanta" el reloj), se sintetiza una razonable para
   * aplicarla, y lo que se sube DESPUÉS en el mismo ciclo tampoco hereda el valor corrupto.
   */
  it('una versión remota del futuro no adelanta el reloj y se re-estampa', () => {
    const farFuture = versionAt(NOW + 10 * 60 * 1000);
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp',
              writtenFingerprint: 'fp',
              version: farFuture,
            }),
          ]),
          snapshot('b', []),
        ],
        local: { b: [localItem({ id: '1', fingerprint: 'fp' })] },
      }),
    );

    expect(plan.apply[0]?.version).not.toBe(farFuture);
    expect(plan.apply[0]?.version).toBe(versionAt(NOW, 0));
    // El reloj no se envenenó: lo que se sube después nace en "ahora" (mismo milisegundo), no en el
    // futuro — el contador avanza porque ya hubo una emisión antes en el mismo ciclo.
    expect(plan.push[0]?.version).toBe(versionAt(NOW, 1));
  });

  /**
   * Caso: el campo de versión del destino contiene basura — alguien escribió texto donde iba una
   * versión, o se corrompió.
   * Entrada: remoto con `version: 'no-es-una-version'`.
   * Salida: el ciclo sigue con normalidad (NO aborta por esto), tratando la versión como si no
   * existiera y sintetizando una nueva.
   */
  it('una versión ilegible en el destino se trata como ausente, nunca aborta el ciclo', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp',
              writtenFingerprint: 'fp',
              version: 'no-es-una-version',
            }),
          ]),
        ],
      }),
    );

    expect(plan.aborted).toBeNull();
    expect(plan.apply).toHaveLength(1);
  });
});

describe('reconcile · borrado y tombstones', () => {
  /**
   * Caso: el usuario borró el dato aquí; hay que avisarle al destino sin borrar físicamente la fila,
   * para que el borrado "viaje" y otros dispositivos se enteren al reconectar.
   * Entrada: remoto con contenido normal; base que lo recuerda; SIN entrada local (justo lo que
   * indica que se borró aquí).
   * Salida: `tombstones` con una versión nueva (marcar, no eliminar); `remove` queda vacío — no hay
   * nada que quitar de este lado, porque aquí ya no existe.
   */
  it('un borrado local se marca como lápida en el destino, no se elimina', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp', ref: 7 }),
          ]),
        ],
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp' })],
        // sin `local`: el registro se borró aquí
      }),
    );

    expect(plan.remove).toEqual([]);
    expect(plan.tombstones).toEqual([
      { collection: 'a', id: '1', ref: 7, version: versionAt(NOW) },
    ]);
  });

  /**
   * Caso: el dato se borró en OTRO dispositivo (o directamente en el destino) y hay que reflejar ese
   * borrado aquí.
   * Entrada: remoto marcado `deleted: true`, con su propia versión escrita (500); base todavía sin
   * marcar como borrado.
   * Salida: `remove` con `reason: 'tombstoned'` (borrado confirmado por el destino, no sospechoso) y
   * la versión 500 respetada tal cual, porque no hay indicio de edición fuera de proceso.
   */
  it('una lápida en el destino se borra aquí', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp',
              writtenFingerprint: 'fp',
              deleted: true,
              version: versionAt(500),
            }),
          ]),
        ],
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp', deleted: false })],
      }),
    );

    expect(plan.remove).toEqual([
      { collection: 'a', id: '1', version: versionAt(500), reason: 'tombstoned' },
    ]);
  });

  /**
   * Caso: un dato que nunca se pudo aplicar aquí (quedó en cuarentena — por ejemplo, un valor
   * inválido) — que "no esté aquí" no significa que alguien lo haya borrado, sino que nunca llegó a
   * entrar.
   * Entrada: `base.rejected` puesto (marca de cuarentena); remoto con contenido normal (no borrado);
   * sin local.
   * Salida: ni lápida ni borrado — el registro en cuarentena no se confunde con un borrado real.
   */
  it('un registro en cuarentena no se borra del destino solo por no estar aquí', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp' })]),
        ],
        base: [
          baseItem({
            collection: 'a',
            id: '1',
            fingerprint: 'fp-vieja',
            rejected: 'campo ilegible',
          }),
        ],
      }),
    );

    expect(plan.tombstones).toEqual([]);
    expect(plan.remove).toEqual([]);
  });
});

describe('reconcile · lápidas y purga', () => {
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

  /**
   * Caso: limpieza de una lápida vieja que ya cumplió su función — cualquier dispositivo ha tenido
   * tiempo de sobra (más de 90 días) para enterarse del borrado.
   * Entrada: remoto `deleted: true` con una versión de hace más de 90 días.
   * Salida: `purge` incluye el registro — ya se puede tirar del destino sin riesgo.
   */
  it('una lápida con más de 90 días se purga', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              deleted: true,
              version: versionAt(NOW - NINETY_DAYS_MS - 1),
              ref: 9,
            }),
          ]),
        ],
      }),
    );

    expect(plan.purge).toEqual([{ collection: 'a', id: '1', ref: 9 }]);
  });

  /**
   * Caso: una lápida todavía "joven" — un dispositivo desconectado podría no haberse enterado
   * todavía del borrado.
   * Entrada: remoto `deleted: true` con versión de hace solo 10 días.
   * Salida: `purge` queda vacío — se conserva.
   */
  it('una lápida reciente no se purga', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              deleted: true,
              version: versionAt(NOW - 10 * 24 * 60 * 60 * 1000),
            }),
          ]),
        ],
      }),
    );

    expect(plan.purge).toEqual([]);
  });

  /**
   * Caso: no se puede saber cuánto tiempo lleva una lápida — más vale conservarla de más que perder
   * un borrado que ningún dispositivo llegó a ver.
   * Entrada: remoto `deleted: true`, `version: null` (ilegible o ausente).
   * Salida: `purge` queda vacío, sea cual sea `now`.
   */
  it('una lápida sin versión legible nunca se purga', () => {
    const plan = reconcile(
      input({
        remote: [snapshot('a', [remoteItem({ id: '1', deleted: true, version: null })])],
      }),
    );

    expect(plan.purge).toEqual([]);
  });

  /**
   * Caso: un despliegue quiere un plazo de retención de lápidas distinto al de 90 días por defecto.
   * Entrada: lápida de hace apenas 1 segundo, pero con `tombstoneTtlMs: 500` (medio segundo).
   * Salida: con ese plazo tan corto, ya se puede purgar — el TTL no está hardcodeado.
   */
  it('el TTL de las lápidas es configurable desde la entrada', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [remoteItem({ id: '1', deleted: true, version: versionAt(NOW - 1_000) })]),
        ],
        tombstoneTtlMs: 500,
      }),
    );

    expect(plan.purge).toEqual([{ collection: 'a', id: '1', ref: '1' }]);
  });
});

describe('reconcile · guarda de borrado masivo', () => {
  function vanished(
    collection: string,
    count: number,
  ): { base: BaseItem[]; remote: RemoteItem<string>[] } {
    const base: BaseItem[] = [];
    for (let i = 0; i < count; i++) {
      base.push(baseItem({ collection, id: `v${i}`, fingerprint: 'fp' }));
    }
    return { base, remote: [] };
  }

  /**
   * Caso: una lectura del destino que vuelve incompleta (por ejemplo, un fallo de red a medias)
   * puede parecer "se borró todo" — hay que frenar antes de destruir datos por un accidente de
   * lectura.
   * Entrada: 20 registros en la base; ninguno aparece en el destino.
   * Salida: `aborted: { kind: 'mass-delete', ... }` — nada se aplica, ni siquiera lo que sí habría
   * sido correcto.
   */
  it('un borrado que iguala o supera el número absoluto configurado aborta el ciclo entero', () => {
    const { base } = vanished('a', 20);
    const plan = reconcile(input({ remote: [snapshot('a', [])], base }));

    expect(plan.aborted).toEqual({ kind: 'mass-delete', collection: 'a', count: 20, base: 20 });
  });

  /**
   * Caso: en una colección pequeña, perder unos pocos registros ya es proporcionalmente sospechoso,
   * aunque el número absoluto sea bajo (no llegue al tope de 20).
   * Entrada: base de 10; solo 6 sobreviven en remoto y aquí (4 desaparecen = 40%, por encima del
   * 30% por defecto).
   * Salida: aborta por proporción, no por cantidad.
   */
  it('un borrado que supera el porcentaje de la base aborta, aunque sean pocos registros', () => {
    const { base } = vanished('a', 10); // 4/10 = 40% > 30%, y 4 < maxCount(20)
    const onlySix = base.slice(0, 6); // dejamos 4 "desaparecer": 10 en base, 6 siguen en remoto y aquí
    const plan = reconcile(
      input({
        remote: [
          snapshot(
            'a',
            onlySix.map((row) =>
              remoteItem({ id: row.id, fingerprint: 'fp', writtenFingerprint: 'fp' }),
            ),
          ),
        ],
        local: { a: onlySix.map((row) => localItem({ id: row.id, fingerprint: 'fp' })) },
        base,
      }),
    );

    expect(plan.aborted).toEqual({ kind: 'mass-delete', collection: 'a', count: 4, base: 10 });
  });

  /**
   * Caso: colecciones muy pequeñas no necesitan esta protección — borrar 3 de 3 no es sospechoso,
   * es simplemente lo que pasó.
   * Entrada: base de solo 3 registros, los 3 desaparecen.
   * Salida: no aborta (está por debajo del piso mínimo de 4); los 3 se borran con normalidad.
   */
  it('por debajo del piso configurado, borrar todo no dispara la guarda', () => {
    const { base } = vanished('a', 3); // por debajo del floor por defecto (4)
    const plan = reconcile(input({ remote: [snapshot('a', [])], base }));

    expect(plan.aborted).toBeNull();
    expect(plan.remove).toHaveLength(3);
  });

  /**
   * Caso: cuando una colección dispara la guarda, ni siquiera se llega a mirar el resto del ciclo —
   * mejor no decidir nada a medias que decidir la mitad de un ciclo roto.
   * Entrada: colección 'a' dispara el aborto; colección 'b' (que vendría después en la lista) tiene
   * una decisión normal pendiente (un alta que se aplicaría).
   * Salida: `aborted` por 'a', y absolutamente nada de 'b' aparece en el plan — nunca se llegó a
   * procesar.
   */
  it('el aborto impide procesar las colecciones siguientes del mismo ciclo', () => {
    const { base } = vanished('a', 20);
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', []),
          snapshot('b', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp' })]),
        ],
        base,
      }),
    );

    expect(plan.aborted?.kind).toBe('mass-delete');
    // La colección 'b' nunca se llegó a mirar: nada de ella entra en el plan.
    expect(plan.apply.some((item) => item.collection === 'b')).toBe(false);
  });

  /**
   * Caso: 25 borrados "normales", cada uno con su lápida ya puesta por quien los borró — no son
   * sospechosos, son borrados confirmados, y no deben disparar la guarda pensada para desapariciones
   * silenciosas.
   * Entrada: 25 registros, todos con `deleted: true` explícito en el destino.
   * Salida: no aborta; los 25 se reflejan como removidos con `reason: 'tombstoned'`.
   */
  it('las lápidas explícitas no cuentan para el cómputo de borrado masivo', () => {
    const { base } = vanished('a', 25);
    const plan = reconcile(
      input({
        remote: [
          snapshot(
            'a',
            base.map((row) =>
              remoteItem({
                id: row.id,
                fingerprint: 'fp',
                writtenFingerprint: 'fp',
                deleted: true,
                version: versionAt(500),
              }),
            ),
          ),
        ],
        base,
      }),
    );

    expect(plan.aborted).toBeNull();
    expect(plan.remove).toHaveLength(25);
    expect(plan.remove.every((removal) => removal.reason === 'tombstoned')).toBe(true);
  });

  /**
   * Caso: un despliegue quiere relajar (o endurecer) los límites por defecto de la guarda.
   * Entrada: 25 desaparecidos (que con los umbrales por defecto SÍ abortarían) más un `massDeleteGuard`
   * permisivo pasado explícitamente.
   * Salida: no aborta con esos umbrales — la configuración no está hardcodeada en el motor.
   */
  it('los umbrales de la guarda son configurables y no están hardcodeados', () => {
    const { base } = vanished('a', 25);
    const lenient: MassDeleteGuard = { floor: 100, maxCount: 1000, maxRatio: 1 };
    const plan = reconcile(input({ remote: [snapshot('a', [])], base, massDeleteGuard: lenient }));

    expect(plan.aborted).toBeNull();
    expect(plan.remove).toHaveLength(25);
  });
});

describe('reconcile · bordes exactos de la guarda de borrado masivo', () => {
  function baseOf(collection: string, count: number): BaseItem[] {
    return Array.from({ length: count }, (_, i) =>
      baseItem({ collection, id: `v${i}`, fingerprint: 'fp' }),
    );
  }

  /**
   * Caso: comprobar el borde exacto del piso mínimo — ¿4 cuenta como "igual al piso" (se aplica la
   * guarda) o como "todavía por debajo" (no se aplica)?
   * Entrada: base de exactamente 4 registros (el piso por defecto), los 4 desaparecen.
   * Salida: la guarda SÍ se aplica en el borde — `floor` es un mínimo inclusive, no exclusive.
   */
  it('exactamente en el piso configurado (floor), la guarda ya se aplica', () => {
    const base = baseOf('a', 4); // === floor por defecto (4), todos desaparecen
    const plan = reconcile(input({ remote: [snapshot('a', [])], base }));

    expect(plan.aborted).toEqual({ kind: 'mass-delete', collection: 'a', count: 4, base: 4 });
  });

  /**
   * Caso: comprobar el borde exacto del umbral de proporción — ¿30% exacto ya es "superarlo" o hace
   * falta pasarse?
   * Entrada: base de 10, exactamente 3 desaparecen (30% clavado, ni un registro más).
   * Salida: NO aborta — el umbral exige superar el 30%, no solo alcanzarlo.
   */
  it('exactamente en el umbral de proporción, sin superarlo, NO aborta', () => {
    const base = baseOf('a', 10); // 3/10 = 30%, el umbral por defecto — no lo supera
    const survivors = base
      .slice(0, 7)
      .map((row) => remoteItem({ id: row.id, fingerprint: 'fp', writtenFingerprint: 'fp' }));
    const plan = reconcile(
      input({
        remote: [snapshot('a', survivors)],
        local: { a: base.slice(0, 7).map((row) => localItem({ id: row.id, fingerprint: 'fp' })) },
        base,
      }),
    );

    expect(plan.aborted).toBeNull();
    expect(plan.remove).toHaveLength(3);
  });

  /**
   * Caso: el mismo borde, pero un registro más allá — ahora sí se supera el 30%.
   * Entrada: base de 10, 4 desaparecen (40%).
   * Salida: aborta — un solo registro de diferencia cruza la línea.
   */
  it('un registro más allá del umbral de proporción SÍ aborta', () => {
    const base = baseOf('a', 10);
    const survivors = base
      .slice(0, 6)
      .map((row) => remoteItem({ id: row.id, fingerprint: 'fp', writtenFingerprint: 'fp' }));
    const plan = reconcile(
      input({
        remote: [snapshot('a', survivors)],
        local: { a: base.slice(0, 6).map((row) => localItem({ id: row.id, fingerprint: 'fp' })) },
        base,
      }),
    );

    expect(plan.aborted).toEqual({ kind: 'mass-delete', collection: 'a', count: 4, base: 10 });
  });

  /**
   * Caso: una colección grande y con vida propia — que unos pocos registros dejen de existir cada
   * ciclo (bajas normales de un catálogo activo) no debe disparar una alarma pensada para
   * catástrofes.
   * Entrada: base de 1000; 19 desaparecen (por debajo del tope absoluto de 20 y muy por debajo del
   * 30% de 1000).
   * Salida: no aborta.
   */
  it('con una base grande, un puñado de bajas no dispara la guarda', () => {
    const base = baseOf('a', 1000);
    const survivors = base
      .slice(0, 981)
      .map((row) => remoteItem({ id: row.id, fingerprint: 'fp', writtenFingerprint: 'fp' }));
    const plan = reconcile(
      input({
        remote: [snapshot('a', survivors)],
        local: { a: base.slice(0, 981).map((row) => localItem({ id: row.id, fingerprint: 'fp' })) },
        base,
      }),
    );

    expect(plan.aborted).toBeNull();
    expect(plan.remove).toHaveLength(19);
  });
});

describe('reconcile · borde exacto de la tolerancia del reloj', () => {
  /**
   * Caso: comprobar el borde exacto del margen de tolerancia (5 minutos) — ¿justo en el límite
   * cuenta como "del futuro" o todavía se acepta?
   * Entrada: remoto con una versión exactamente 5 minutos por delante de `now`.
   * Salida: SÍ se respeta (no se considera del futuro) — el límite es estrictamente "más de 5
   * minutos", no "5 minutos o más".
   */
  it('una versión justo en el borde de la tolerancia NO se considera del futuro', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp',
              writtenFingerprint: 'fp',
              version: versionAt(NOW + 5 * 60 * 1000), // exactamente 5 minutos, el tope
            }),
          ]),
        ],
      }),
    );

    expect(plan.apply[0]?.version).toBe(versionAt(NOW + 5 * 60 * 1000));
  });

  /**
   * Caso: el mismo borde, un milisegundo más allá.
   * Entrada: remoto con versión a 5 minutos y 1 milisegundo de `now`.
   * Salida: ahora SÍ se considera del futuro y se re-estampa con una versión sintetizada.
   */
  it('un milisegundo más allá del borde SÍ se considera del futuro y se re-estampa', () => {
    const beyond = versionAt(NOW + 5 * 60 * 1000 + 1);
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp', version: beyond }),
          ]),
        ],
      }),
    );

    expect(plan.apply[0]?.version).not.toBe(beyond);
    expect(plan.apply[0]?.version).toBe(versionAt(NOW));
  });
});

describe('reconcile · un borrado ya conocido puede resucitarse', () => {
  /**
   * Caso: en la última sincronización, aquí y en el destino se sabía que este dato estaba borrado.
   * Ahora el usuario lo vuelve a crear localmente (mismo id, contenido nuevo) — el destino, por su
   * parte, no ha cambiado desde entonces (sigue tal cual estaba, borrado).
   * Entrada: base `deleted: true`; remoto sin cambios respecto a la base (también `deleted: true`,
   * misma huella); local con contenido NUEVO.
   * Salida: como el destino no cambió (`remoteChanged: false`) y lo local sí (`localChanged: true`),
   * gana lo local sin que haga falta ningún conflicto — se sube y "resucita" el dato.
   */
  it('local resucita un registro que aquí y en el destino ya se sabía borrado: gana lo local, sin conflicto', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp-viejo',
              writtenFingerprint: 'fp-viejo',
              deleted: true,
            }),
          ]),
        ],
        local: { a: [localItem({ id: '1', fingerprint: 'fp-nuevo' })] },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-viejo', deleted: true })],
      }),
    );

    expect(plan.conflicts).toEqual([]);
    expect(plan.push).toHaveLength(1);
    expect(plan.remove).toEqual([]);
  });

  /**
   * Caso: el dato estaba vivo la última vez que se sincronizó. Desde entonces, aquí se editó Y en el
   * destino se borró — un conflicto genuino entre "lo cambié" y "lo borraron". Esta vez gana lo
   * local (versión más alta).
   * Entrada: base viva (`deleted: false`); remoto ahora `deleted: true` con versión 2000; local con
   * contenido editado y `changedAt`=3000 (más reciente que el borrado remoto).
   * Salida: conflicto resuelto a favor de lo local; se sube el contenido nuevo — el borrado remoto
   * queda sin efecto porque la edición de aquí es posterior.
   */
  it('edité aquí mientras allá lo borraban: si gana lo local, resucita con el contenido nuevo', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp-original',
              writtenFingerprint: 'fp-original',
              deleted: true,
              version: versionAt(2_000),
            }),
          ]),
        ],
        local: {
          a: [localItem({ id: '1', fingerprint: 'fp-editado-aqui', changedAt: versionAt(3_000) })],
        },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-original', deleted: false })],
      }),
    );

    expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'local', blind: false }]);
    expect(plan.push).toHaveLength(1);
    expect(plan.remove).toEqual([]);
  });

  /**
   * Caso: el mismo conflicto, pero esta vez el borrado remoto es más reciente que la edición local
   * — el destino gana.
   * Entrada: igual que arriba, pero el borrado remoto trae versión 9000 (posterior a los 3000 de la
   * edición local).
   * Salida: conflicto a favor del destino; la edición local se pierde y el borrado se confirma aquí
   * (aparece en `remove`, no en `push`).
   */
  it('edité aquí mientras allá lo borraban: si gana el destino, se confirma el borrado y se pierde la edición', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp-original',
              writtenFingerprint: 'fp-original',
              deleted: true,
              version: versionAt(9_000),
            }),
          ]),
        ],
        local: {
          a: [localItem({ id: '1', fingerprint: 'fp-editado-aqui', changedAt: versionAt(3_000) })],
        },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-original', deleted: false })],
      }),
    );

    expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'remote', blind: false }]);
    expect(plan.push).toEqual([]);
    expect(plan.remove).toEqual([
      { collection: 'a', id: '1', version: versionAt(9_000), reason: 'tombstoned' },
    ]);
  });

  /**
   * Caso: un borrado que ya se sabía en los dos lados desde el ciclo anterior — no hay nada nuevo
   * que decidir, y repetir la acción sería trabajo (y ruido) de más en cada ciclo.
   * Entrada: base y remoto coinciden exactamente (`deleted: true`, misma huella); sin local (ya no
   * existe aquí, como corresponde a algo borrado).
   * Salida: ni `remove`, ni `tombstones`, ni `adopt` — cero acción, el estado ya está convergido.
   */
  it('un borrado que ya converge en los dos lados no repite ninguna acción', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp', deleted: true }),
          ]),
        ],
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp', deleted: true })],
      }),
    );

    expect(plan.remove).toEqual([]);
    expect(plan.tombstones).toEqual([]);
    expect(plan.adopt).toEqual([]);
  });
});

describe('reconcile · identidad duplicada', () => {
  /**
   * Caso: dos filas del destino reclaman el mismo id — un error de datos, o dos altas que
   * colisionaron. No se puede saber cuál es la de verdad, así que no se toca ninguna.
   * Entrada: remoto con dos entradas para el id '1' (contenidos distintos, refs 1 y 2); local con su
   * propio contenido para ese mismo id.
   * Salida: nada se aplica, ni se sube, ni se adopta para ese id — queda congelado hasta que alguien
   * lo arregle a mano en el destino.
   */
  it('un id repetido en el destino no se toca por ningún lado', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({ id: '1', fingerprint: 'fp-uno', writtenFingerprint: 'fp-uno', ref: 1 }),
            remoteItem({ id: '1', fingerprint: 'fp-dos', writtenFingerprint: 'fp-dos', ref: 2 }),
          ]),
        ],
        local: { a: [localItem({ id: '1', fingerprint: 'fp-local' })] },
      }),
    );

    expect(plan.apply).toEqual([]);
    expect(plan.push).toEqual([]);
    expect(plan.adopt).toEqual([]);
  });

  /**
   * Caso: quien reciba el plan necesita poder señalarle al usuario DÓNDE están las filas en
   * conflicto, no solo que existen.
   * Entrada: igual que arriba, con referencias distintas y reconocibles (1 y 2).
   * Salida: `duplicates` incluye ambas referencias juntas, no solo el id.
   */
  it('se reporta con todas sus referencias', () => {
    const plan = reconcile(
      input({
        remote: [snapshot('a', [remoteItem({ id: '1', ref: 1 }), remoteItem({ id: '1', ref: 2 })])],
      }),
    );

    expect(plan.duplicates).toEqual([{ collection: 'a', id: '1', refs: [1, 2] }]);
  });

  /**
   * Caso: que exista un id ambiguo en el destino no debe sumar de más a la cuenta de "cosas que
   * desaparecieron" que vigila la guarda de borrado masivo.
   * Entrada: base de 4 (`dup`, `v1`, `v2`, `v3`); `dup` aparece duplicado en el destino; `v1..v3`
   * desaparecen de verdad. Umbral bajado a propósito (`maxCount: 3`) para que la diferencia entre
   * contar 3 o 4 sea observable.
   * Salida: el conteo de la guarda es exactamente 3 (no 4) — el duplicado, al no decidirse por
   * ningún lado, tampoco cuenta como una desaparición.
   */
  it('un id duplicado no participa en la guarda de borrado masivo', () => {
    const base: BaseItem[] = [
      baseItem({ collection: 'a', id: 'dup', fingerprint: 'fp' }),
      baseItem({ collection: 'a', id: 'v1', fingerprint: 'fp' }),
      baseItem({ collection: 'a', id: 'v2', fingerprint: 'fp' }),
      baseItem({ collection: 'a', id: 'v3', fingerprint: 'fp' }),
    ];
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [remoteItem({ id: 'dup', ref: 1 }), remoteItem({ id: 'dup', ref: 2 })]),
        ],
        base,
        massDeleteGuard: { floor: 4, maxCount: 3, maxRatio: 1 },
      }),
    );

    // Si 'dup' contara como desaparición serían 4 vanished (>= maxCount 3 igualmente), así que la
    // prueba real está en que el conteo exacto es 3, no 4.
    expect(plan.aborted).toEqual({ kind: 'mass-delete', collection: 'a', count: 3, base: 4 });
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
    const plan = reconcile(input({ remote: [snapshot('a', [], false)] }));

    expect(plan.aborted).toEqual({ kind: 'missing-collection', collection: 'a' });
  });

  /**
   * Caso: una colección legítimamente sin datos todavía (recién creada, o vaciada a propósito) no
   * es un error — es un estado normal.
   * Entrada: snapshot con `present: true`, `items: []`.
   * Salida: `aborted: null` — vacío y ausente son cosas completamente distintas.
   */
  it('una colección presente pero vacía NO aborta: vacío y ausente no son lo mismo', () => {
    const plan = reconcile(input({ remote: [snapshot('a', [], true)] }));

    expect(plan.aborted).toBeNull();
  });

  /**
   * Caso: si una colección falla la barrera, ni siquiera se procesan las demás — mejor no decidir
   * nada a medias que dejar el sistema en un estado parcialmente aplicado.
   * Entrada: 'a' está bien y tendría una subida pendiente (un alta local); 'b' está ausente.
   * Salida: `aborted` por 'b', y la subida de 'a' NUNCA llega a calcularse — `plan.push` vacío.
   */
  it('todas las colecciones se comprueban antes de decidir nada', () => {
    const plan = reconcile(
      input({
        remote: [snapshot('a', [], true), snapshot('b', [], false)],
        local: { a: [localItem({ id: '1', fingerprint: 'fp' })] },
      }),
    );

    expect(plan.aborted).toEqual({ kind: 'missing-collection', collection: 'b' });
    // 'a' hubiera producido una subida, pero la barrera de 'b' corre antes de procesar nada.
    expect(plan.push).toEqual([]);
  });
});

describe('reconcile · varias colecciones', () => {
  /**
   * Caso: el mismo id puede significar cosas completamente distintas en dos colecciones (dos
   * "tablas" o "recursos") sin que el motor las confunda.
   * Entrada: colección 'a' con un alta local (id '1'); colección 'b' con un alta remota (también id
   * '1').
   * Salida: cada una decide lo suyo de forma independiente, cada entrada del plan con su propia
   * etiqueta de colección.
   */
  it('colecciones independientes no mezclan sus decisiones', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', []),
          snapshot('b', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp' })]),
        ],
        local: { a: [localItem({ id: '1', fingerprint: 'fp' })] },
      }),
    );

    expect(plan.push).toEqual([
      expect.objectContaining({ collection: 'a', id: '1', fingerprint: 'fp' }),
    ]);
    expect(plan.apply).toEqual([
      expect.objectContaining({ collection: 'b', id: '1', fingerprint: 'fp' }),
    ]);
  });

  /**
   * Caso: la "última foto conocida" (la base) es específica de cada colección — que un id ya se
   * conociera en 'a' no hace que el mismo id en 'b' se trate como "ya visto".
   * Entrada: base solo para 'a' (id '1'); 'b' no tiene ninguna base para ese id, aunque el destino sí
   * trae contenido para él.
   * Salida: 'a' no genera nada (ya convergido); 'b' sí genera un `apply` — para esa colección, es la
   * primera vez que se ve.
   */
  it('el mismo id en dos colecciones distintas no comparte base', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp-a', writtenFingerprint: 'fp-a' })]),
          snapshot('b', [remoteItem({ id: '1', fingerprint: 'fp-b', writtenFingerprint: 'fp-b' })]),
        ],
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-a' })],
        // No hay base para 'b': su registro '1' se trata como alta nueva, no como "sin cambios".
      }),
    );

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
    const request = input({
      remote: [
        snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp' })]),
      ],
      local: { a: [localItem({ id: '1', fingerprint: 'fp-otra' })] },
      base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp' })],
    });

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
    const request = input({
      remote: [
        snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp' })]),
      ],
      local: { a: [localItem({ id: '1', fingerprint: 'fp-otra' })] },
      base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp' })],
    });
    const before = JSON.parse(JSON.stringify(request)) as unknown;

    reconcile(request);

    expect(JSON.parse(JSON.stringify(request)) as unknown).toEqual(before);
  });

  /**
   * Caso: si un adaptador lee los registros del destino en un orden distinto en cada ciclo (algo
   * habitual en muchas APIs), eso no puede cambiar qué se decide.
   * Entrada: dos registros con versión ya escrita (para que el resultado no dependa además del
   * desempate de contador del reloj, que sí es legítimamente sensible al orden — ver el describe de
   * "reloj lógico híbrido"), presentados en los dos órdenes posibles.
   * Salida: el mismo conjunto de decisiones, comparado id a id.
   */
  it('el orden de llegada de los registros no afecta al resultado', () => {
    const a = remoteItem({
      id: 'a',
      fingerprint: 'fp-a',
      writtenFingerprint: 'fp-a',
      version: versionAt(500),
    });
    const b = remoteItem({
      id: 'b',
      fingerprint: 'fp-b',
      writtenFingerprint: 'fp-b',
      version: versionAt(600),
    });

    const first = reconcile(input({ remote: [snapshot('x', [a, b])] }));
    const second = reconcile(input({ remote: [snapshot('x', [b, a])] }));

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
    const result = reconcile(input());
    expect(result).not.toBeInstanceOf(Promise);
  });
});

describe('reconcile · contrato de opacidad', () => {
  /**
   * Caso: el motor no necesita entender qué es "una fila" o "un documento" — solo reenvía, intacta,
   * la referencia que el adaptador le dio, para que ese mismo adaptador sepa después dónde escribir.
   * Entrada: un `ref` con forma de objeto arbitrario (`{ hoja, fila }`), en un registro que se
   * adopta.
   * Salida: `adopt[0].ref` es EXACTAMENTE (`===`) el mismo objeto que se pasó, sin copiar ni tocar.
   */
  it('la referencia de un registro adoptado se devuelve intacta, sea cual sea su forma', () => {
    const ref = { hoja: 'Insumos', fila: 42 };
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: '', ref })]),
        ],
      }),
    );

    expect(plan.adopt[0]?.ref).toBe(ref);
  });

  /**
   * Caso: lo mismo que arriba, pero para las dos otras salidas que también llevan `ref`: marcar una
   * lápida y purgarla.
   * Entrada: un `ref` con forma de string (`'doc/abc-123'`, como sería en un backend de documentos).
   * Salida: tanto `tombstones[0].ref` como `purge[0].ref` son ese mismo string, sin transformar.
   */
  it('la referencia de una lápida y de una purga se devuelven intactas', () => {
    const ref = 'doc/abc-123';
    const tombstonePlan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp', ref }),
          ]),
        ],
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp' })],
      }),
    );
    expect(tombstonePlan.tombstones[0]?.ref).toBe(ref);

    const purgePlan = reconcile(
      input({
        remote: [
          snapshot('a', [remoteItem({ id: '1', deleted: true, version: versionAt(0), ref })]),
        ],
      }),
    );
    expect(purgePlan.purge[0]?.ref).toBe(ref);
  });

  /**
   * Caso: cualquier forma de contenido (un string, un objeto anidado, lo que sea) tiene que poder
   * viajar por el motor sin que lo interprete ni lo transforme.
   * Entrada: un `value` con un objeto anidado arbitrario, en un alta local.
   * Salida: `push[0].value` es EXACTAMENTE (`===`) ese mismo objeto.
   */
  it('el valor de un registro nunca se inspecciona, solo se transporta', () => {
    const value = { compuesto: true, anidado: { x: 1 } };
    const plan = reconcile<{ compuesto: boolean; anidado: { x: number } }>(
      input<{ compuesto: boolean; anidado: { x: number } }>({
        remote: [{ collection: 'a', present: true, items: [] }],
        local: { a: [{ id: '1', value, fingerprint: 'fp', changedAt: null }] },
      }),
    );

    expect(plan.push[0]?.value).toBe(value);
  });
});

describe('reconcile · robustez de entrada', () => {
  /**
   * Caso: el caso más simple posible — nada en ningún lado.
   * Entrada: `input()` con todos sus valores por defecto (remoto, base y local vacíos).
   * Salida: el plan inicial, completamente vacío, sin lanzar ninguna excepción.
   */
  it('una entrada completamente vacía no hace nada y no falla', () => {
    const plan = reconcile(input());

    expect(plan).toEqual({
      aborted: null,
      adopt: [],
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
   * Caso: la base guarda un rastro de una colección que, en este ciclo, el adaptador ni siquiera
   * incluyó en la lista de colecciones a mirar (por ejemplo, se retiró del esquema). No debe
   * generar ningún efecto, ni tampoco hacer que el motor falle.
   * Entrada: base con entradas para 'a' (que sí se procesa) y para 'fantasma' (que NO aparece en
   * `remote`).
   * Salida: nada relacionado con 'fantasma' aparece en ninguna lista del plan; 'a' converge con
   * normalidad.
   */
  it('una colección que solo existe en la base, sin entrada en remote, se ignora por completo', () => {
    const plan = reconcile(
      input({
        remote: [snapshot('a', [remoteItem({ id: '1', fingerprint: 'fp', writtenFingerprint: 'fp' })])],
        // 'a' converge sin acción (mismo contenido en los tres lados) para aislar limpiamente lo que
        // este test comprueba: que 'fantasma' (solo en la base, sin snapshot remoto) no genera nada.
        local: { a: [localItem({ id: '1', fingerprint: 'fp' })] },
        base: [
          baseItem({ collection: 'a', id: '1', fingerprint: 'fp' }),
          baseItem({ collection: 'fantasma', id: '9', fingerprint: 'fp' }),
        ],
      }),
    );

    expect(plan.apply).toEqual([]);
    expect(plan.remove).toEqual([]);
    expect(plan.adopt).toEqual([]);
    expect(plan.aborted).toBeNull();
  });

  /**
   * Caso: el dato de "cuándo se cambió aquí" está corrupto o mal formado (un valor que no sigue el
   * formato de versión) — debe tratarse igual que si simplemente no se supiera, nunca provocar un
   * error.
   * Entrada: `local.changedAt: 'esto no es una versión'`, en un conflicto real (los dos lados
   * cambiaron).
   * Salida: el conflicto se resuelve exactamente igual que con `changedAt: null` — gana el destino,
   * marcado `blind: true`.
   */
  it('un `changedAt` local ilegible se trata como si no se supiera: el conflicto queda a ciegas', () => {
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            remoteItem({
              id: '1',
              fingerprint: 'fp-remoto',
              writtenFingerprint: 'fp-remoto',
              version: versionAt(2_000),
            }),
          ]),
        ],
        local: {
          a: [localItem({ id: '1', fingerprint: 'fp-local', changedAt: 'esto no es una versión' })],
        },
        base: [baseItem({ collection: 'a', id: '1', fingerprint: 'fp-base' })],
      }),
    );

    expect(plan.conflicts).toEqual([{ collection: 'a', id: '1', winner: 'remote', blind: true }]);
  });

  /**
   * Caso: un registro que llegó ya borrado y muy viejo (más de 90 días), y que nunca existió ni aquí
   * ni en la base — por ejemplo, el destino conserva lápidas de antes de que este dispositivo
   * empezara a sincronizar. Debe poder purgarse sin que "aparezca y desaparezca" cuente como un
   * borrado sospechoso.
   * Entrada: 25 registros normales que convergen sin cambios (para tener una base grande de fondo) y
   * un registro adicional 'fantasma': `deleted: true`, versión de hace mucho, sin base ni local.
   * Salida: `purge` incluye 'fantasma'; `aborted` sigue `null` — la guarda de borrado masivo no se
   * entera de esto (no es un `reason: 'vanished'`, es un `'tombstoned'` de algo que nunca se conoció).
   */
  it('un borrado ya viejo que nunca existió aquí se purga del destino sin disparar la guarda de borrado masivo', () => {
    const base = Array.from({ length: 25 }, (_, i) =>
      baseItem({ collection: 'a', id: `v${i}`, fingerprint: 'fp' }),
    );
    const unchanged = base.map((row) =>
      remoteItem({ id: row.id, fingerprint: 'fp', writtenFingerprint: 'fp' }),
    );
    const plan = reconcile(
      input({
        remote: [
          snapshot('a', [
            ...unchanged,
            remoteItem({
              id: 'fantasma',
              deleted: true,
              version: versionAt(0), // muy anterior a NOW, sobra para superar el TTL de 90 días
              ref: 'fila-77',
            }),
          ]),
        ],
        local: { a: base.map((row) => localItem({ id: row.id, fingerprint: 'fp' })) },
        base,
      }),
    );

    expect(plan.purge).toEqual([{ collection: 'a', id: 'fantasma', ref: 'fila-77' }]);
    expect(plan.aborted).toBeNull();
  });
});
