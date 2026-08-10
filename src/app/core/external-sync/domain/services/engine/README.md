# El motor de sincronización

Qué es, qué no es, y cómo conectarle un destino nuevo.

## Qué es

Una función pura — `reconcile(input): EnginePlan` — que decide qué hay que subir, bajar o borrar
para que "aquí" y "el destino" digan lo mismo, comparando los dos contra una tercera copia: la
**base** (la última vez que se supo que coincidían).

```
reconcile({ remote, base, local, now, originId }) → { push, apply, remove, adopt, tombstones, purge, conflicts, duplicates, aborted }
```

Mismas entradas, mismo plan, siempre. No hace ninguna llamada de red, no toca ninguna base de datos,
no espera a nada — así que se puede probar con cientos de casos (una colección ausente, un id
duplicado, una versión corrupta) sin necesitar un destino real. Ver `reconcile.ts` para el algoritmo
y `testing/domain/services/engine/reconcile.spec.ts` (en este mismo repo) para el catálogo de casos
que ya cubre.

## Qué NO es

- **No sabe qué es Google, ni Sheets, ni HTTP.** Nunca hace una petición de red.
- **No sabe qué es una tabla, una celda, una columna ni una posición.** Un registro remoto tiene un
  `id` y un `value` opaco — nada más. Si el destino es una hoja de cálculo con filas y columnas, esa
  traducción vive en el adaptador, no aquí.
- **No canonicaliza ni hashea contenido.** Recibe las huellas (`fingerprint`) ya calculadas. Compara
  cadenas de texto, nunca interpreta qué significan los campos de un registro.
- **No decide cuándo ejecutarse.** No hay temporizadores, ni debounce, ni intervalo — eso es
  responsabilidad de quien lo llama (en esta app, `SyncScheduler`).
- **No recuerda nada entre llamadas.** No tiene memoria propia ni persiste nada — la "base" que
  necesita para decidir se la pasan como entrada, y quien lo llama es quien la guarda para la
  siguiente vez.

## El contrato, con ejemplos

### Entrada

```ts
interface EngineInput<TValue> {
  remote: CollectionSnapshot<TValue>[]; // lo que hay en el destino, por colección
  base: BaseItem[];                     // la última huella+versión que se sabía coincidía
  local: Record<string, LocalItem<TValue>[]>; // lo que hay aquí, por colección
  now: number;
  originId: string;                     // quién es "aquí", para desempatar conflictos
  massDeleteGuard?: MassDeleteGuard;     // opcional, valores por defecto razonables
  tombstoneTtlMs?: number;               // opcional, 90 días por defecto
}
```

Un `LocalItem` y un `RemoteItem` llevan lo mismo en espíritu — un `id`, un `value` opaco y una
`fingerprint` — con dos añadidos del lado remoto:

- `writtenFingerprint`: la huella tal como estaba escrita **antes** de este ciclo. Si no coincide con
  `fingerprint` (recalculada del contenido actual), alguien tocó el contenido sin pasar por un
  escritor que mantenga las dos sincronizadas — ver más abajo.
- `ref`: dónde está este registro, en los términos del adaptador. El motor nunca la mira, solo la
  devuelve intacta para que el adaptador sepa qué reescribir.

### Salida

Un `EnginePlan` con listas de qué hacer: `push` (subir), `apply` (traer), `remove` (borrar aquí),
`adopt` (solo actualizar la base, sin mover datos), `tombstones` (marcar como borrado en el destino),
`purge` (tirar una lápida vieja del destino), `conflicts` (diagnóstico de quién ganó y por qué) y
`duplicates` (ids que aparecen más de una vez y no se tocan). O `aborted`, si una barrera saltó — en
ese caso las demás listas están vacías: no se aplica nada a medias.

## Las cinco piezas que hacen esto universal

1. **Three-way merge por huella y versión.** Comparar cada lado contra la base es lo único que
   distingue "cambió allí" de "cambié yo" cuando los dos ven el mismo valor final. No depende de cómo
   se transporten los datos — cualquier sincronización con más de un escritor lo necesita.
2. **Reloj lógico híbrido (HLC) con tope de reloj futuro.** Decide quién es "más reciente" sin fiarse
   de relojes físicos que pueden estar desincronizados entre orígenes, y sin que un valor corrupto
   pueda envenenar el reloj para siempre.
3. **Tombstones con TTL.** Propagar un borrado entre réplicas que no están siempre conectadas, sin que
   resucite, es un problema de sistemas distribuidos — no de ningún backend en particular.
4. **Guarda de borrado masivo.** Protege contra cualquier lectura parcial o corrupta que parezca "se
   borró todo": una paginación rota, un fallo de autenticación a medias, una lectura incompleta.
5. **Detección de ids duplicados.** Dos registros con el mismo id puede pasar en cualquier almacén con
   clave, por la razón que sea — el motor no confía en ninguno hasta que se resuelva a mano.

## La regla que evita la tormenta: huella vacía = adoptar

Un registro remoto **sin huella escrita** (`writtenFingerprint === ''`) es uno que este motor nunca
escribió — o el destino es anterior a que existiera el concepto de huella, o alguien lo creó por una
vía que no la puso. En los dos casos lo correcto es **adoptarlo como base** y dejar que la comparación
normal decida después, no tratarlo como una edición reciente.

Sin esta regla, el primer ciclo contra un destino que ya tenía datos vería *todos* sus registros sin
huella, los tomaría por ediciones simultáneas, y el conjunto entero colisionaría en el mismo ciclo
resolviéndose por desempate de origen — al azar, en la práctica.

Si al adoptar el contenido local difiere del remoto, **gana lo local**: hasta ese momento la app era
la única fuente de esos datos, así que el destino es como mucho una copia más vieja.

## Ediciones fuera de proceso

`writtenFingerprint !== fingerprint` (la huella escrita no coincide con la que da recalcular el
contenido actual) significa que alguien cambió el valor sin pasar por un escritor que mantenga las
dos sincronizadas — la definición exacta depende del destino: en una hoja de cálculo, es una persona
editando una celda a mano.

Cuando esto pasa, el motor **no se fía de la versión escrita** para ese registro: la sintetiza de
nuevo con su propio reloj. Si se fiara, la resolución por versión pisaría la corrección de esa persona
sin dejar rastro, porque quien edita un valor directamente no sabe que existe una columna de versión
que también tendría que actualizar.

## Cómo conectar un destino nuevo (el trabajo de un adaptador)

El motor no sabe nada de "cómo se ve" un destino — eso es enteramente trabajo del adaptador, que:

1. **Lee el destino** y lo traduce a `CollectionSnapshot[]`: un `id` por registro (nunca `null`;
   si el destino permite escrituras sin identidad, el adaptador le asigna una antes de construir el
   snapshot), un `value` con el contenido íntegro, y las huellas/versión ya calculadas.
2. **Calcula las huellas** con el criterio que tenga sentido para ese destino (qué campos cuentan,
   cómo se serializa un número, qué se excluye — p. ej. los campos de auditoría nunca deben entrar en
   la huella, para que escribirlos no parezca una edición). El motor no tiene opinión sobre esto.
3. **Llama a `reconcile(...)`** con eso más la base persistida y los datos locales.
4. **Aplica el plan**: escribe lo que `push`/`tombstones` dicen, trae lo que `apply` dice, actualiza
   la base con lo que `adopt`/`apply`/`push` decidieron.
5. Cualquier peculiaridad del destino que no encaje en "un registro con id" —posiciones, cabeceras,
   edición humana sin pasar por una API— se resuelve **antes o después** de llamar al motor, nunca
   dentro de él. Un destino tipo API de recursos (donde cada escritura ya trae su id) no necesita nada
   de esto: su adaptador es más simple, no más pobre.

En este repo, hoy el único destino es Google Sheets. Su adaptador todavía vive integrado en
`infrastructure/reconcile.ts` (el motor anterior a este, con toda la lógica de posición de columnas y
edición humana de una grilla mezclada con la decisión); moverlo a un adaptador que traduzca hacia este
motor genérico es trabajo pendiente, documentado en el plan de esta refactorización.
