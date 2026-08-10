# El motor de sincronización

Qué es, qué no es, y cómo conectarle un destino nuevo.

## Qué es

Una función pura — `reconcile(input): EnginePlan` — que decide qué hay que subir, bajar o borrar
para que "aquí" y "el destino" digan lo mismo. **El destino (`base`) es la fuente de verdad**: el
motor compara `data` (lo que hay aquí) directamente contra `base` (lo que hay en el destino), sin
necesitar una tercera copia ni un ancestro persistido aparte.

```
reconcile({ base, data, now, originId }) → { push, apply, remove, tombstones, purge, conflicts, duplicates, aborted }
```

Mismas entradas, mismo plan, siempre. No hace ninguna llamada de red, no toca ninguna base de datos,
no espera a nada — así que se puede probar con cientos de casos (una colección ausente, un id
duplicado, una versión corrupta) sin necesitar un destino real. Ver `reconcile.ts` para el algoritmo
y `reconcile.spec.ts` (en esta misma carpeta) para el catálogo de casos que ya cubre.

## Qué NO es

- **No sabe qué es Google, ni Sheets, ni HTTP.** Nunca hace una petición de red.
- **No sabe qué es una tabla, una celda, una columna ni una posición.** Un registro remoto tiene un
  `id` y un `value` opaco — nada más. Si el destino es una hoja de cálculo con filas y columnas, esa
  traducción vive en el adaptador, no aquí.
- **No canonicaliza ni hashea contenido.** Recibe las huellas (`fingerprint`) ya calculadas. Compara
  cadenas de texto, nunca interpreta qué significan los campos de un registro.
- **No decide cuándo ejecutarse.** No hay temporizadores, ni debounce, ni intervalo — eso es
  responsabilidad de quien lo llama (en esta app, `SyncScheduler`).
- **No recuerda nada entre llamadas.** No tiene memoria propia ni persiste nada — ni siquiera un
  ancestro: cada ciclo compara `data` contra el `base` que le pasen, sin más estado que ese.

## El contrato, con ejemplos

### Entrada

```ts
interface EngineInput<TValue> {
  base: CollectionSnapshot<TValue>[];         // lo que hay en el destino, por colección — la verdad
  data: Record<string, LocalItem<TValue>[]>;  // lo que hay aquí, por colección
  now: number;
  originId: string;                           // quién es "aquí", para desempatar conflictos
  tombstoneTtlMs?: number;                     // opcional, 90 días por defecto
}
```

Un `LocalItem` y un `RemoteItem` llevan lo mismo en espíritu — un `id`, un `value` opaco y una
`fingerprint` — con un añadido del lado de `base`: `ref`, dónde está este registro en el destino, en
los términos del adaptador. El motor nunca la mira, solo la devuelve intacta para que el adaptador
sepa qué reescribir.

### Salida

Un `EnginePlan` con listas de qué hacer: `push` (subir), `apply` (traer), `remove` (borrar aquí
porque el destino dice que está borrado), `tombstones` (marcar como borrado en el destino porque se
borró aquí), `purge` (tirar una lápida vieja del destino), `conflicts` (diagnóstico de quién ganó y
por qué) y `duplicates` (ids que aparecen más de una vez y no se tocan). O `aborted`, si una barrera
saltó — en ese caso las demás listas están vacías: no se aplica nada a medias.

## La tabla de decisión

Por cada id, comparando `data` (si existe) contra `base` (si existe):

| en `base` | en `data` | qué se hace |
|---|---|---|
| no | sí | se creó aquí → **subir** |
| sí, viva | no | se borró aquí → **marcar lápida** en el destino |
| sí, ya borrada | no | nada — ya está borrado en los dos lados |
| sí, borrada | sí | el destino manda → **se quita aquí** también |
| sí, viva, misma huella | sí | nada — coinciden |
| sí, viva, huella distinta | sí | **conflicto**: gana quien tenga la fecha más reciente |

Un registro solo en `data` y ausente en `base` siempre se sube: no hay ninguna otra copia contra la
que compararlo, así que no puede ser más que un alta. Simétricamente, un registro que desapareció de
`data` mientras sigue vivo en `base` siempre se interpreta como "se borró aquí" — no hay ancestro que
distinga esa ausencia de "nunca llegó a este dispositivo": la regla de negocio es que ausencia local
es borrado local, punto.

## Las piezas que hacen esto universal

1. **Reloj lógico híbrido (HLC) con tope de reloj futuro.** Decide quién es "más reciente" sin
   fiarse de relojes físicos que pueden estar desincronizados entre orígenes, y sin que un valor
   corrupto pueda envenenar el reloj para siempre.
2. **Tombstones con TTL.** Propagar un borrado entre réplicas que no están siempre conectadas, sin
   que resucite, es un problema de sistemas distribuidos — no de ningún backend en particular.
3. **Detección de ids duplicados.** Dos registros con el mismo id puede pasar en cualquier almacén
   con clave, por la razón que sea — el motor no confía en ninguno hasta que se resuelva a mano.
4. **Barrera de colección ausente.** Una colección que el adaptador esperaba y no llegó invalida el
   ciclo entero, en vez de tratar su ausencia como "se borró todo".

## Cómo conectar un destino nuevo (el trabajo de un adaptador)

El motor no sabe nada de "cómo se ve" un destino — eso es enteramente trabajo del adaptador, que:

1. **Lee el destino** y lo traduce a `CollectionSnapshot[]` (el `base` de la entrada): un `id` por
   registro (nunca `null`; si el destino permite escrituras sin identidad, el adaptador le asigna
   una antes de construir el snapshot), un `value` con el contenido íntegro, y la huella/versión ya
   calculadas.
2. **Calcula las huellas** con el criterio que tenga sentido para ese destino (qué campos cuentan,
   cómo se serializa un número, qué se excluye — p. ej. los campos de auditoría nunca deben entrar en
   la huella, para que escribirlos no parezca una edición). El motor no tiene opinión sobre esto.
3. **Llama a `reconcile(...)`** con eso más los datos locales (`data`).
4. **Aplica el plan**: escribe lo que `push`/`tombstones` dicen, trae lo que `apply` dice, quita
   localmente lo que `remove` dice.
5. Cualquier peculiaridad del destino que no encaje en "un registro con id" —posiciones, cabeceras,
   edición humana sin pasar por una API— se resuelve **antes o después** de llamar al motor, nunca
   dentro de él. Un destino tipo API de recursos (donde cada escritura ya trae su id) no necesita
   nada de esto: su adaptador es más simple, no más pobre.

En este repo, hoy el único destino es Google Sheets. Su adaptador todavía vive integrado en
`infrastructure/reconcile.ts` (el motor anterior a este, con toda la lógica de posición de columnas y
edición humana de una grilla mezclada con la decisión); moverlo a un adaptador que traduzca hacia este
motor genérico es trabajo pendiente, documentado en el plan de esta refactorización.
