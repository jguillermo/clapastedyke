import {
  Apply,
  DuplicateIdentity,
  EngineInput,
  EnginePlan,
  LocalItem,
  Purge,
  RecordId,
  RemoteItem,
} from './engine.types';
import { HybridClock, LogicalVersion } from './hybrid-clock';

/**
 * **El motor**: dado lo que hay en el destino (`base`, la fuente de verdad) y lo que hay aquí
 * (`data`), decide qué hacer. Y nada más: no lee, no escribe, no espera a nada, y no sabe qué es una
 * red. Ver `README.md` de esta carpeta para la explicación completa.
 *
 * Es una función pura: mismas entradas, mismo plan, siempre. Eso es lo que permite probar cada modo de
 * fallo —una colección ausente, un id duplicado, una versión del año 3000— sin red y sin destino real,
 * que es la única forma de cubrirlos de verdad.
 */

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
  for (const snapshot of input.base) {
    if (!snapshot.present) {
      return { ...plan, aborted: { kind: 'missing-collection', collection: snapshot.collection } };
    }
  }

  const clock = new HybridClock(input.originId);

  // El reloj se pone al día con TODO lo leído antes de emitir nada. Si se hiciera colección por
  // colección, una versión sintetizada para la primera podría nacer por detrás de algo que ya estaba
  // escrito en la última, y perdería un conflicto que debía ganar.
  for (const snapshot of input.base) {
    for (const item of snapshot.items) {
      const version = item.version !== null ? LogicalVersion.parse(item.version) : null;
      if (version) {
        clock.observe(version, input.now);
      }
    }
  }

  const tombstoneTtlMs = input.tombstoneTtlMs ?? DEFAULT_TOMBSTONE_TTL_MS;

  for (const snapshot of input.base) {
    const { collection, items } = snapshot;

    const duplicates = duplicatesOf(collection, items);
    plan.duplicates.push(...duplicates);

    // Un id repetido no se toca por ningún lado: no se sabe cuál de los dos registros es el de
    // verdad, y escribir en uno dejaría el otro reapareciendo como un fantasma en cada ciclo.
    const ambiguous = new Set(duplicates.map((duplicate) => duplicate.id));
    const baseById = new Map(
      items.filter((item) => !ambiguous.has(item.id)).map((item) => [item.id, item] as const),
    );
    const dataById = new Map((input.data[collection] ?? []).map((item) => [item.id, item] as const));

    plan.purge.push(...purgeableOf(collection, items, input.now, tombstoneTtlMs));

    for (const id of union(baseById, dataById)) {
      if (ambiguous.has(id)) {
        continue;
      }
      decide<TValue>({
        collection,
        id,
        base: baseById.get(id),
        data: dataById.get(id),
        clock,
        now: input.now,
        plan,
      });
    }
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

function union(...maps: readonly Map<string, unknown>[]): string[] {
  return [...new Set(maps.flatMap((map) => [...map.keys()]))];
}

interface Decision<TValue> {
  collection: string;
  id: RecordId;
  base: RemoteItem<TValue> | undefined;
  data: LocalItem<TValue> | undefined;
  clock: HybridClock;
  now: number;
  plan: Mutable<TValue>;
}

/**
 * Cómo decide, comparando `data` (aquí) directamente contra `base` (el destino, la fuente de verdad):
 *
 * | en `base` | en `data` | qué se hace |
 * |---|---|---|
 * | no | sí | se creó aquí: subir |
 * | sí, viva | no | se borró aquí: marcar lápida en el destino |
 * | sí, ya borrada | no | nada, ya está borrado en los dos lados |
 * | sí, borrada | sí | el destino manda: se quita aquí también |
 * | sí, viva, misma huella | sí | nada, coinciden |
 * | sí, viva, huella distinta | sí | conflicto: gana quien tenga la fecha más reciente |
 */
function decide<TValue>(decision: Decision<TValue>): void {
  const { collection, id, base, data, clock, now, plan } = decision;

  if (!base) {
    // Solo está aquí: se creó en este origen y el destino nunca lo vio.
    pushLocal(decision);
    return;
  }

  if (!data) {
    if (base.deleted) {
      // Ya está borrado en el destino y tampoco está aquí: nada que hacer.
      return;
    }
    // Está en el destino, no está aquí: se borró aquí. Se marca en el destino en vez de quitarlo,
    // porque un registro que desaparece lo resube la primera réplica que estuviera desconectada.
    plan.tombstones.push({
      collection,
      id,
      ref: base.ref,
      version: clock.next(now).toString(),
    });
    return;
  }

  // Está en los dos lados.
  if (base.deleted) {
    // El destino manda: se borró allí, se quita aquí también, aunque `data` todavía lo tuviera.
    plan.remove.push({ collection, id, version: effectiveVersion(base, clock, now).toString() });
    return;
  }

  if (base.fingerprint === data.fingerprint) {
    return; // Coinciden: nada que hacer.
  }

  // Los dos lados cambiaron con contenido distinto: decide la fecha más reciente.
  const baseVersion = effectiveVersion(base, clock, now);
  const dataVersion = data.changedAt !== null ? LogicalVersion.parse(data.changedAt) : null;
  const dataWins = dataVersion !== null && dataVersion.isAfter(baseVersion);

  plan.conflicts.push({
    collection,
    id,
    winner: dataWins ? 'local' : 'remote',
    blind: dataVersion === null,
  });

  if (dataWins) {
    pushLocal(decision);
    return;
  }
  plan.apply.push(applyOf(collection, base, baseVersion.toString()));
}

/**
 * Apunta que hay que subir el registro local, con **la huella de lo que se va a escribir y una
 * versión nueva**, emitida por el mismo reloj que ya observó todo lo que había en el destino: así una
 * subida nunca nace por detrás de algo que ya estaba escrito.
 */
function pushLocal<TValue>(decision: Decision<TValue>): void {
  const { collection, id, data, clock, now, plan } = decision;
  if (!data) {
    // No puede pasar —todas las ramas que llegan aquí tienen registro local—, pero subir uno que no
    // existe escribiría un vacío sobre el del destino, así que se calla en vez de arriesgarlo.
    return;
  }
  plan.push.push({
    collection,
    id,
    value: data.value,
    fingerprint: data.fingerprint,
    version: clock.next(now).toString(),
  });
}

function applyOf<TValue>(
  collection: string,
  base: RemoteItem<TValue>,
  version: string,
): Apply<TValue> {
  return {
    collection,
    id: base.id,
    value: base.value,
    fingerprint: base.fingerprint,
    version,
  };
}

/**
 * Con qué versión cuenta un registro del destino.
 *
 * Una versión **del futuro** se re-estampa en vez de respetarse — si el destino expone la versión de
 * forma editable, un valor corrupto la dejaría ganando para siempre, sin forma de volver.
 */
function effectiveVersion<TValue>(
  base: RemoteItem<TValue>,
  clock: HybridClock,
  now: number,
): LogicalVersion {
  const parsed = base.version !== null ? LogicalVersion.parse(base.version) : null;
  if (parsed === null || parsed.isFromTheFuture(now)) {
    return clock.next(now);
  }
  return parsed;
}
