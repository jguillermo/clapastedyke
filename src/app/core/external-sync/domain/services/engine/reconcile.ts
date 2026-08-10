import {
  AbortReason,
  Apply,
  BaseItem,
  DuplicateIdentity,
  EngineInput,
  EnginePlan,
  LocalItem,
  MassDeleteGuard,
  Purge,
  RecordId,
  RemoteItem,
  Remove,
} from './engine.types';
import { HybridClock, LogicalVersion } from './hybrid-clock';

/**
 * **El motor**: dadas tres copias de los mismos datos — lo de aquí, lo del destino y la última vez
 * que coincidieron — decide qué hacer. Y nada más: no lee, no escribe, no espera a nada, y no sabe qué
 * es una red. Ver `README.md` de esta carpeta para la explicación completa.
 *
 * Es una función pura: mismas entradas, mismo plan, siempre. Eso es lo que permite probar cada modo de
 * fallo —una colección ausente, un id duplicado, una versión del año 3000— sin red y sin destino real,
 * que es la única forma de cubrirlos de verdad.
 */

/**
 * Cuántos registros de una colección puede borrar un ciclo antes de que deje de parecer un borrado y
 * empiece a parecer un accidente.
 *
 * La regla «estaba en la base y ya no está en el destino, luego alguien lo borró» es correcta y es una
 * bomba: basta que una lectura vuelva a medias para que se convierta en «bórralo todo, en todas las
 * réplicas». Un tope no distingue el accidente del borrado legítimo —nada puede—, pero convierte la
 * pérdida total en una pregunta.
 */
const DEFAULT_MASS_DELETE_GUARD: MassDeleteGuard = {
  floor: 4,
  maxCount: 20,
  maxRatio: 0.3,
};

/**
 * Cuánto se conserva una lápida en el destino antes de tirarla.
 *
 * Una lápida existe para que una réplica desconectada se entere del borrado al volver. Pasado un
 * tiempo razonable, todas se han enterado y el registro solo estorba.
 */
const DEFAULT_TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

type Mutable<TValue> = {
  -readonly [
    Key in keyof EnginePlan<TValue>
  ]: EnginePlan<TValue>[Key] extends readonly (infer Item)[] ? Item[] : EnginePlan<TValue>[Key];
};

export function reconcile<TValue = unknown>(input: EngineInput<TValue>): EnginePlan<TValue> {
  const plan: Mutable<TValue> = {
    aborted: null,
    adopt: [],
    apply: [],
    remove: [],
    push: [],
    tombstones: [],
    purge: [],
    duplicates: [],
    conflicts: [],
  };

  // Las barreras van ANTES de cualquier decisión: una colección que falta invalida el ciclo entero,
  // no solo la suya, porque otras pueden referirse por id a lo que había en ella.
  for (const snapshot of input.remote) {
    if (!snapshot.present) {
      return { ...plan, aborted: { kind: 'missing-collection', collection: snapshot.collection } };
    }
  }

  const clock = new HybridClock(input.originId);

  // El reloj se pone al día con TODO lo leído antes de emitir nada. Si se hiciera colección por
  // colección, una versión sintetizada para la primera podría nacer por detrás de algo que ya estaba
  // escrito en la última, y perdería un conflicto que debía ganar.
  for (const snapshot of input.remote) {
    for (const item of snapshot.items) {
      const version = item.version !== null ? LogicalVersion.parse(item.version) : null;
      if (version) {
        clock.observe(version, input.now);
      }
    }
  }

  const guard = input.massDeleteGuard ?? DEFAULT_MASS_DELETE_GUARD;
  const tombstoneTtlMs = input.tombstoneTtlMs ?? DEFAULT_TOMBSTONE_TTL_MS;

  for (const snapshot of input.remote) {
    const { collection, items } = snapshot;

    const duplicates = duplicatesOf(collection, items);
    plan.duplicates.push(...duplicates);

    // Un id repetido no se toca por ningún lado: no se sabe cuál de los dos registros es el de
    // verdad, y escribir en uno dejaría el otro reapareciendo como un fantasma en cada ciclo.
    const ambiguous = new Set(duplicates.map((duplicate) => duplicate.id));
    const remoteById = new Map(
      items.filter((item) => !ambiguous.has(item.id)).map((item) => [item.id, item] as const),
    );
    const localById = new Map(
      (input.local[collection] ?? []).map((item) => [item.id, item] as const),
    );
    const baseItems = input.base.filter((item) => item.collection === collection);
    const baseById = new Map(baseItems.map((item) => [item.id, item] as const));

    plan.purge.push(...purgeableOf(collection, items, input.now, tombstoneTtlMs));

    const removals: Remove[] = [];
    for (const id of union(remoteById, localById, baseById)) {
      if (ambiguous.has(id)) {
        continue;
      }
      decide<TValue>({
        collection,
        id,
        remote: remoteById.get(id),
        local: localById.get(id),
        base: baseById.get(id),
        clock,
        now: input.now,
        plan,
        removals,
      });
    }

    const mass = massDeleteOf(collection, removals, baseById.size, guard);
    if (mass) {
      return { ...plan, aborted: mass };
    }
    plan.remove.push(...removals);
  }

  return plan;
}

function duplicatesOf<TValue>(
  collection: string,
  items: readonly RemoteItem<TValue>[],
): DuplicateIdentity[] {
  const byId = new Map<string, unknown[]>();
  for (const item of items) {
    byId.set(item.id, [...(byId.get(item.id) ?? []), item.ref]);
  }
  return [...byId]
    .filter(([, refs]) => refs.length > 1)
    .map(([id, refs]) => ({ collection, id, refs }));
}

/**
 * Las lápidas del destino que ya se pueden tirar.
 *
 * Solo se miran las que llevan **versión legible**: sin versión no se sabe de cuándo son, y tirar algo
 * cuya antigüedad no se conoce es tirar a ciegas. Una lápida sin versión se queda, que es lo prudente.
 */
function purgeableOf<TValue>(
  collection: string,
  items: readonly RemoteItem<TValue>[],
  now: number,
  ttlMs: number,
): Purge[] {
  const purgeable: Purge[] = [];
  for (const item of items) {
    if (!item.deleted || item.version === null) {
      continue;
    }
    const version = LogicalVersion.parse(item.version);
    if (version && now - version.millis > ttlMs) {
      purgeable.push({ collection, id: item.id, ref: item.ref });
    }
  }
  return purgeable;
}

/** El tope de borrado masivo. Solo cuenta lo que desapareció sin lápida, no lo tombstoneado. */
function massDeleteOf(
  collection: string,
  removals: readonly Remove[],
  baseSize: number,
  guard: MassDeleteGuard,
): AbortReason | null {
  if (baseSize < guard.floor) {
    return null;
  }
  const vanished = removals.filter((removal) => removal.reason === 'vanished').length;
  if (vanished >= guard.maxCount || vanished > baseSize * guard.maxRatio) {
    return { kind: 'mass-delete', collection, count: vanished, base: baseSize };
  }
  return null;
}

function union(...maps: readonly Map<string, unknown>[]): string[] {
  return [...new Set(maps.flatMap((map) => [...map.keys()]))];
}

interface Decision<TValue> {
  collection: string;
  id: RecordId;
  remote: RemoteItem<TValue> | undefined;
  local: LocalItem<TValue> | undefined;
  base: BaseItem | undefined;
  clock: HybridClock;
  now: number;
  plan: Mutable<TValue>;
  removals: Remove[];
}

/**
 * Cómo decide, comparando cada lado contra la **base** (lo último que se vio coincidir):
 *
 * | cambió local | cambió remoto | qué se hace |
 * |---|---|---|
 * | no | no | nada |
 * | sí | no | subir |
 * | no | sí | aplicar aquí |
 * | sí | sí | conflicto: gana la versión más alta |
 *
 * Antes de llegar a esa tabla hay dos salidas previas: la adopción (huella nunca escrita) y la
 * igualdad total (los dos lados dicen lo mismo, haya base o no). Ver `README.md`.
 */
function decide<TValue>(decision: Decision<TValue>): void {
  const { collection, id, remote, local, base, clock, now, plan, removals } = decision;

  if (!remote) {
    if (!base) {
      // Solo está aquí y el destino nunca lo vio: hay que subirlo.
      pushLocal(decision);
      return;
    }
    // Estaba en el destino y en la base, y ya no está: alguien lo borró allí sin dejar lápida.
    removals.push({ collection, id, version: clock.next(now).toString(), reason: 'vanished' });
    return;
  }

  /**
   * Está en el destino y en la base, pero **ya no está aquí**: se borró en este origen.
   *
   * Se marca en el destino en vez de quitarlo, porque un registro que desaparece lo resube la
   * primera réplica que estuviera desconectada.
   *
   * Un registro en **cuarentena** no cuenta: no está aquí porque no se pudo aplicar, no porque nadie
   * lo quisiera. Borrarlo del destino por eso destruiría el dato que su dueño está intentando
   * arreglar.
   */
  if (!local && base && !remote.deleted && base.rejected === undefined) {
    plan.tombstones.push({
      collection,
      id,
      ref: remote.ref,
      version: clock.next(now).toString(),
    });
    return;
  }

  // Sin huella escrita, este registro no lo puso el motor: se adopta como base y la comparación
  // normal decide después. Es lo que evita que el primer ciclo contra un destino ya existente
  // colisione entero. Ver README § "La regla que evita la tormenta".
  if (remote.writtenFingerprint.length === 0) {
    plan.adopt.push({
      collection,
      id,
      ref: remote.ref,
      fingerprint: remote.fingerprint,
      version: LogicalVersion.adopted().toString(),
      deleted: remote.deleted,
    });
    if (!local) {
      plan.apply.push(applyOf(collection, remote, LogicalVersion.adopted().toString()));
    } else if (local.fingerprint !== remote.fingerprint) {
      pushLocal(decision);
    }
    return;
  }

  // Los dos lados dicen exactamente lo mismo: no hay nada que hacer, haya base o no. Solo se pone la
  // base al día si le hacía falta. La lápida es la excepción: ahí el contenido coincide y aun así hay
  // que borrar, por eso se excluye con `!remote.deleted`.
  if (local && local.fingerprint === remote.fingerprint && !remote.deleted) {
    if (!base || base.fingerprint !== remote.fingerprint || base.deleted) {
      plan.adopt.push({
        collection,
        id,
        ref: remote.ref,
        fingerprint: remote.fingerprint,
        version: remote.version ?? LogicalVersion.adopted().toString(),
        deleted: false,
      });
    }
    return;
  }

  const remoteChanged =
    !base || base.fingerprint !== remote.fingerprint || base.deleted !== remote.deleted;
  // Que un registro no esté aquí NO se toma por un borrado local si no hay lápida local que lo diga
  // (eso ya se resolvió arriba); a partir de aquí, "cambió aquí" solo compara huellas.
  const localChanged = local !== undefined && (!base || base.fingerprint !== local.fingerprint);

  if (!remoteChanged && !localChanged) {
    return;
  }
  if (!remoteChanged && localChanged) {
    pushLocal(decision);
    return;
  }

  // Una edición fuera de proceso no trae versión nueva junto a su huella —quien la hizo no sabe que
  // existe esa columna—, así que se le sintetiza una de ahora: si no, la resolución por versión
  // pisaría su corrección sin dejar rastro. Se calcula aquí, no antes, para no gastar un tick del
  // reloj en una versión que la rama de "solo cambió lo local" nunca llega a usar.
  const handEdited = remote.writtenFingerprint !== remote.fingerprint;
  const remoteVersion = effectiveVersion(remote, handEdited, clock, now);

  if (remoteChanged && !localChanged) {
    applyRemote(decision, remoteVersion);
    return;
  }

  const localVersion = local?.changedAt ? LogicalVersion.parse(local.changedAt) : null;
  const localWins = localVersion !== null && localVersion.isAfter(remoteVersion);
  plan.conflicts.push({
    collection,
    id,
    winner: localWins ? 'local' : 'remote',
    blind: localVersion === null,
  });

  if (localWins) {
    pushLocal(decision);
    return;
  }
  applyRemote(decision, remoteVersion);
}

/**
 * Apunta que hay que subir el registro local, con **la huella de lo que se va a escribir y una
 * versión nueva**, emitida por el mismo reloj que ya observó todo lo que había en el destino: así una
 * subida nunca nace por detrás de algo que ya estaba escrito.
 */
function pushLocal<TValue>(decision: Decision<TValue>): void {
  const { collection, id, local, clock, now, plan } = decision;
  if (!local) {
    // No puede pasar —todas las ramas que llegan aquí tienen registro local—, pero subir uno que no
    // existe escribiría un vacío sobre el del destino, así que se calla en vez de arriesgarlo.
    return;
  }
  plan.push.push({
    collection,
    id,
    value: local.value,
    fingerprint: local.fingerprint,
    version: clock.next(now).toString(),
  });
}

function applyRemote<TValue>(decision: Decision<TValue>, version: LogicalVersion): void {
  const { collection, id, remote, plan, removals } = decision;
  if (!remote) {
    return;
  }
  if (remote.deleted) {
    removals.push({ collection, id, version: version.toString(), reason: 'tombstoned' });
    return;
  }
  plan.apply.push(applyOf(collection, remote, version.toString()));
}

function applyOf<TValue>(
  collection: string,
  remote: RemoteItem<TValue>,
  version: string,
): Apply<TValue> {
  return {
    collection,
    id: remote.id,
    value: remote.value,
    fingerprint: remote.fingerprint,
    version,
  };
}

/**
 * Con qué versión cuenta un registro del destino.
 *
 * Una edición fuera de proceso no trae versión nueva, así que se le sintetiza una de ahora. Y una
 * versión **del futuro** se re-estampa en vez de respetarse — si el destino expone la versión de
 * forma editable, un valor corrupto la dejaría ganando para siempre, sin forma de volver.
 */
function effectiveVersion<TValue>(
  remote: RemoteItem<TValue>,
  handEdited: boolean,
  clock: HybridClock,
  now: number,
): LogicalVersion {
  const parsed = remote.version !== null ? LogicalVersion.parse(remote.version) : null;
  if (handEdited || parsed === null || parsed.isFromTheFuture(now)) {
    return clock.next(now);
  }
  return parsed;
}
