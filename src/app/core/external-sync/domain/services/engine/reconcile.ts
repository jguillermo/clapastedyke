import { EngineInput, EnginePlan, RecordId, Registro } from './engine.types';
import { HybridClock, LogicalVersion } from './hybrid-clock';

/**
 * **El motor**: dado lo que hay en el destino (`base`, la fuente de verdad) y lo que hay aquí
 * (`data`), decide qué hacer con una sola colección. Y nada más: no lee, no escribe, no espera a
 * nada, y no sabe qué es una red. Ver `README.md` de esta carpeta para la explicación completa.
 *
 * Es una función pura: mismas entradas, mismo plan, siempre. Eso es lo que permite probar cada modo
 * de fallo —un id duplicado, una versión del año 3000, un borrado local frente a uno remoto— sin red
 * y sin destino real, que es la única forma de cubrirlos de verdad.
 */

type Mutable<TValues extends object> = {
  -readonly [
    Key in keyof EnginePlan<TValues>
  ]: EnginePlan<TValues>[Key] extends readonly (infer Item)[] ? Item[] : EnginePlan<TValues>[Key];
};

export function reconcile<TValues extends object = Record<string, unknown>>(
  input: EngineInput<TValues>,
): EnginePlan<TValues> {
  const plan: Mutable<TValues> = { push: [], pull: [], duplicates: [], conflicts: [] };

  const clock = new HybridClock(input.originId);

  // El reloj se pone al día con TODO lo leído en `base` antes de emitir nada. Si se hiciera
  // registro por registro, una versión sintetizada para el primero podría nacer por detrás de algo
  // que ya estaba escrito en el último, y perdería un conflicto que debía ganar.
  for (const registro of input.base) {
    const version = versionOf(registro);
    if (version) {
      clock.observe(version, input.now);
    }
  }

  const baseGroups = groupById(input.base);
  const ambiguous = new Set<RecordId>();
  for (const [id, registros] of baseGroups) {
    if (registros.length > 1) {
      ambiguous.add(id);
      plan.duplicates.push({ id, registros });
    }
  }

  // Un id repetido en `base` no se toca por ningún lado: no se sabe cuál de los dos registros es el
  // de verdad, y escribir en uno dejaría el otro reapareciendo como un fantasma en cada ciclo.
  const baseById = new Map(
    [...baseGroups]
      .filter(([id]) => !ambiguous.has(id))
      .map(([id, registros]) => [id, registros[0]] as const),
  );
  const dataGroups = groupById(input.data);
  const dataById = new Map(
    [...dataGroups].map(([id, registros]) => [id, registros[registros.length - 1]] as const),
  );

  for (const id of union(baseById, dataById)) {
    if (ambiguous.has(id)) {
      continue;
    }
    decide({
      id,
      base: baseById.get(id),
      data: dataById.get(id),
      clock,
      now: input.now,
      plan,
    });
  }

  return plan;
}

/**
 * El id real de un registro — el valor de `registro[sync.id]`. `sync.id` no es el valor del
 * identificador: es el NOMBRE del campo donde vive, y es **obligatorio** (sin default): quien
 * construye el registro tiene que decir explícitamente qué campo leer, para que se pueda validar
 * que es el correcto en vez de asumirlo en silencio. Un registro sin un id resoluble no puede
 * indexarse ni compararse contra nada, así que se ignora.
 */
function resolveId<TValues extends object>(registro: Registro<TValues>): RecordId | null {
  const field = registro.sync.id;
  const raw = (registro as Record<string, unknown>)[field];
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

function groupById<TValues extends object>(
  registros: readonly Registro<TValues>[],
): Map<RecordId, Registro<TValues>[]> {
  const byId = new Map<RecordId, Registro<TValues>[]>();
  for (const registro of registros) {
    const id = resolveId(registro);
    if (id === null) {
      continue;
    }
    byId.set(id, [...(byId.get(id) ?? []), registro]);
  }
  return byId;
}

function union(...maps: readonly Map<RecordId, unknown>[]): RecordId[] {
  return [...new Set(maps.flatMap((map) => [...map.keys()]))];
}

/** `updatedAt` si está; si no, `createdAt` — nunca se inventa una fecha. */
function versionOf<TValues extends object>(registro: Registro<TValues>): LogicalVersion | null {
  const raw = registro.sync.updatedAt ?? registro.sync.createdAt;
  return raw ? LogicalVersion.parse(raw) : null;
}

interface Decision<TValues extends object> {
  id: RecordId;
  base: Registro<TValues> | undefined;
  data: Registro<TValues> | undefined;
  clock: HybridClock;
  now: number;
  plan: Mutable<TValues>;
}

/**
 * Cómo decide, comparando `data` (aquí) directamente contra `base` (el destino, la fuente de verdad):
 *
 * | en `base` | en `data` | qué se hace |
 * |---|---|---|
 * | no | sí | se creó aquí: `push` |
 * | sí | no | aquí no se tiene todavía: `pull` |
 * | sí, `deleted: true` | sí o no | el destino manda de forma INCONDICIONAL: `pull` |
 * | sí, activo | sí, misma huella y sin borrar aquí | nada, convergido |
 * | sí, activo | sí, huella distinta, con ancestro embebido y sin campos solapados | fusiona: `push` Y `pull` a la vez |
 * | sí, activo | sí, huella distinta o borrado aquí (resto de casos) | conflicto: gana la fecha más reciente |
 *
 * Un borrado LOCAL (`data.sync.deleted: true` con `base` activo) entra por la última fila: compite
 * por fecha como cualquier otro cambio de contenido, sin privilegio, y NUNCA se intenta fusionar (un
 * borrado es un evento de todo el registro, no de un campo). Solo el borrado del destino es
 * incondicional — es la fuente de verdad y su borrado no se discute.
 */
function decide<TValues extends object>(decision: Decision<TValues>): void {
  const { id, base, data, clock, now, plan } = decision;

  if (!base) {
    // Solo está aquí: se creó en este origen y el destino nunca lo vio.
    pushLocal(decision);
    return;
  }

  if (!data) {
    // El destino lo tiene, aquí no se ha visto todavía (o no se pasó esta vez): se trae.
    plan.pull.push(pullOf(base, effectiveVersion(base, clock, now)));
    return;
  }

  if (base.sync.deleted) {
    // El destino manda: se borró allí, y su borrado no se discute aunque `data` siguiera activo.
    plan.pull.push(pullOf(base, effectiveVersion(base, clock, now)));
    return;
  }

  const converged = base.sync.keyfinder === data.sync.keyfinder && !data.sync.deleted;
  if (converged) {
    return; // Coinciden: nada que hacer.
  }

  // Los dos lados difieren en contenido. Antes de rendirse a "gana un lado entero", se intenta
  // fusionar campo a campo — pero nunca si el borrado local es lo que causó la divergencia: un
  // borrado no tiene "campos", así que sigue compitiendo por fecha más abajo, sin pasar por aquí.
  if (!data.sync.deleted) {
    const merge = tryMerge(base, data, clock, now);
    if (merge) {
      // Dos comandos, no uno: al destino le falta lo que cambió local, a local le falta lo que
      // cambió el destino. `merge.registro` ya combina los dos, así que escribirlo en el destino
      // (`push`) le entrega su parte que faltaba, y escribirlo aquí (`pull`) entrega la suya —
      // ninguno de los dos por separado basta.
      plan.push.push(merge.registro);
      plan.pull.push(merge.registro);
      plan.conflicts.push({
        id,
        winner: 'merged',
        blind: false,
        mergedFrom: { remote: merge.fromRemote, local: merge.fromLocal },
      });
      return;
    }
  }

  // No se pudo fusionar (sin ancestro, contenido no es un objeto plano, borrado local, o
  // solapamiento real en el mismo campo): decide la fecha más reciente, como siempre.
  // `baseVersion` se calcula UNA sola vez: si hiciera falta re-estampar (`effectiveVersion` cae al
  // reloj), llamarlo dos veces consumiría dos ticks del reloj para la misma decisión.
  const baseVersion = effectiveVersion(base, clock, now);
  const dataVersion = versionOf(data);
  const dataWins = dataVersion !== null && dataVersion.isAfter(baseVersion);

  plan.conflicts.push({ id, winner: dataWins ? 'local' : 'remote', blind: dataVersion === null });

  if (dataWins) {
    pushLocal(decision);
    return;
  }
  plan.pull.push(pullOf(base, baseVersion));
}

/** Los campos de negocio de un registro, sin `sync` — lo que viaja como `TValues`. */
function omitSync<TValues extends object>(registro: Registro<TValues>): TValues {
  const { sync: _sync, ...values } = registro;
  return values as TValues;
}

/**
 * Lo que un adaptador tiene que guardar como el nuevo `sync.syncedValues` del registro local,
 * **justo después de escribir con éxito** cualquier entrada de `plan.push` o `plan.pull` (incluida
 * una fusión) — nunca antes, y nunca para una escritura que falló.
 *
 * El motor no lo hace por sí solo (ver README → "Lo que le toca al adaptador"): no sabe si la
 * escritura tuvo éxito, y guardarlo aquí encima congelaría un ancestro sobre un intento que pudo no
 * haber llegado a persistir. Esta función existe para que un adaptador no tenga que reinventar "qué
 * cuenta como ancestro" por su cuenta — es literalmente el registro aplicado, sin sus metadatos de
 * `sync`, porque eso es justo lo que en ese instante ya coincide en los dos lados.
 *
 * ```ts
 * const outcome = await gateway.send({ ... , batch: plan.push });
 * if (outcome.ok) {
 *   for (const applied of plan.push) {
 *     await localStore.setSyncedValues(applied.id, nextSyncedValues(applied));
 *   }
 * }
 * ```
 */
export function nextSyncedValues<TValues extends object>(
  applied: Registro<TValues>,
): Record<string, unknown> {
  return omitSync(applied) as Record<string, unknown>;
}

/**
 * Intenta fusionar los campos de negocio de `base` y `data` usando `data.sync.syncedValues` como
 * ancestro común. Devuelve `null` — nunca lanza — cuando no se puede fusionar con seguridad: sin
 * ancestro, con contenido que no es un objeto plano, o con un solapamiento real (el mismo campo
 * cambiado a valores distintos en los dos lados). En cualquiera de esos casos, quien llama cae al
 * criterio de "gana un lado entero" de siempre.
 */
function tryMerge<TValues extends object>(
  base: Registro<TValues>,
  data: Registro<TValues>,
  clock: HybridClock,
  now: number,
): { registro: Registro<TValues>; fromRemote: string[]; fromLocal: string[] } | null {
  const ancestor = data.sync.syncedValues;
  if (ancestor === undefined || !isRecord(ancestor)) {
    return null;
  }

  const baseValues = omitSync(base) as Record<string, unknown>;
  const dataValues = omitSync(data) as Record<string, unknown>;
  const ancestorValues = ancestor as Record<string, unknown>;

  const keys = new Set([
    ...Object.keys(ancestorValues),
    ...Object.keys(baseValues),
    ...Object.keys(dataValues),
  ]);
  const merged: Record<string, unknown> = { ...ancestorValues };
  const fromRemote: string[] = [];
  const fromLocal: string[] = [];

  for (const key of keys) {
    const remoteChanged = !deepEqual(baseValues[key], ancestorValues[key]);
    const localChanged = !deepEqual(dataValues[key], ancestorValues[key]);

    if (remoteChanged && localChanged) {
      if (!deepEqual(baseValues[key], dataValues[key])) {
        // El mismo campo, cambiado a valores distintos en los dos lados: eso sí es un
        // solapamiento real. Fusionar aquí perdería en silencio el cambio de uno de los dos, así
        // que se aborta la fusión ENTERA — no solo este campo — y decide quien llama.
        return null;
      }
      // Cambiaron el mismo campo al MISMO valor: no hay nada que perder.
      merged[key] = baseValues[key];
      continue;
    }
    if (remoteChanged) {
      merged[key] = baseValues[key];
      fromRemote.push(key);
    } else if (localChanged) {
      merged[key] = dataValues[key];
      fromLocal.push(key);
    }
    // Ninguno de los dos cambió esta clave: se queda el valor del ancestro, que ya coincide con
    // los dos lados.
  }

  return {
    registro: {
      ...(merged as TValues),
      sync: {
        id: base.sync.id,
        // Vacía A PROPÓSITO. `merged` es contenido nuevo que no coincide con la huella de ningún
        // lado, y el motor no calcula huellas — no es su trabajo (ver README). Quien aplique este
        // plan DEBE recalcular la huella real antes de escribirla, en el destino y en local; nunca
        // persistir esta cadena vacía.
        keyfinder: '',
        deleted: false,
        createdAt: base.sync.createdAt,
        updatedAt: clock.next(now).toString(),
        // Sin syncedValues: igual que la huella, el motor no decide el ancestro del próximo ciclo
        // — es trabajo del adaptador, tras escribir, guardar los valores YA fusionados como tal.
      },
    } as Registro<TValues>,
    fromRemote,
    fromLocal,
  };
}

/** `true` si `value` es un objeto plano — ni `null`, ni array, ni un primitivo. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Igualdad estructural simple: primitivos por `Object.is`, y recursiva en arrays/objetos planos.
 * Cubre de sobra lo que hoy viaja como campos de negocio (filas planas de primitivos) sin romperse
 * si algún campo resulta ser un objeto o un array anidado.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
  }
  if (isRecord(a) && isRecord(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((key) => deepEqual(a[key], b[key]));
  }
  return false;
}

/**
 * Apunta que hay que subir el registro local, con **una versión nueva**, emitida por el mismo reloj
 * que ya observó todo lo que había en el destino: así una subida nunca nace por detrás de algo que
 * ya estaba escrito. El resto de `sync` (id, huella, borrado, fecha de creación) viaja tal cual
 * traía el registro local — el motor solo re-estampa cuándo se escribe, no qué ni si está borrado.
 */
function pushLocal<TValues extends object>(decision: Decision<TValues>): void {
  const { data, clock, now, plan } = decision;
  if (!data) {
    // No puede pasar —todas las ramas que llegan aquí tienen registro local—, pero subir uno que no
    // existe escribiría un vacío sobre el del destino, así que se calla en vez de arriesgarlo.
    return;
  }
  plan.push.push({
    ...omitSync(data),
    sync: {
      id: data.sync.id,
      keyfinder: data.sync.keyfinder,
      deleted: data.sync.deleted,
      createdAt: data.sync.createdAt,
      updatedAt: clock.next(now).toString(),
      // Sin syncedValues: este plan de escritura no lleva ancestro — el adaptador lo guarda tras escribir.
    },
  } as Registro<TValues>);
}

function pullOf<TValues extends object>(
  base: Registro<TValues>,
  version: LogicalVersion,
): Registro<TValues> {
  return {
    ...omitSync(base),
    sync: {
      id: base.sync.id,
      keyfinder: base.sync.keyfinder,
      deleted: base.sync.deleted,
      createdAt: base.sync.createdAt,
      updatedAt: version.toString(),
      // Sin syncedValues: el destino no tiene ancestro propio (ver README) — el adaptador lo guarda tras escribir.
    },
  } as Registro<TValues>;
}

/**
 * Con qué versión cuenta un registro del destino.
 *
 * Una versión **del futuro** se re-estampa en vez de respetarse — si el destino expone la versión de
 * forma editable, un valor corrupto la dejaría ganando para siempre, sin forma de volver. Se aplica
 * a TODO `pull`, sea por ausencia local, por borrado incondicional, o por conflicto — nunca se
 * escribe aquí una versión que no se pueda confiar.
 */
function effectiveVersion<TValues extends object>(
  base: Registro<TValues>,
  clock: HybridClock,
  now: number,
): LogicalVersion {
  const parsed = versionOf(base);
  if (parsed === null || parsed.isFromTheFuture(now)) {
    return clock.next(now);
  }
  return parsed;
}
