# El motor de sincronización

Qué es, qué no es, y cómo conectarle un destino nuevo.

## Qué es

Una función pura — `reconcile(input): EnginePlan` — que decide qué hay que subir o traer para que
"aquí" y "el destino" digan lo mismo, **de una sola colección** por llamada. **El destino (`base`) es
la fuente de verdad**: el motor compara `data` (lo que hay aquí) directamente contra `base` (lo que
hay en el destino), sin necesitar una tercera copia ni un ancestro persistido aparte.

```
reconcile({ base, data, now, originId }) → { push, pull, conflicts, duplicates, ignored }
```

Mismas entradas, mismo plan, siempre. No hace ninguna llamada de red, no toca ninguna base de datos,
no espera a nada — así que se puede probar con decenas de casos (un id duplicado, una versión
corrupta, un borrado local frente a uno remoto) sin necesitar un destino real. Ver `reconcile.ts`
para el algoritmo y `reconcile.spec.ts` (en esta misma carpeta) para el catálogo de casos que ya
cubre.

## Qué NO es

- **No sabe qué es Google, ni Sheets, ni HTTP.** Nunca hace una petición de red.
- **No sabe qué es una tabla, una fila ni una posición.** Un registro tiene un identificador (leído
  de sus propios campos, ver más abajo) y un contenido de negocio opaco. El destino se asume un
  almacén con clave real — no hace falta un puntero de ubicación (fila, ETag…) aparte del propio id.
- **No canonicaliza ni hashea contenido.** Recibe la huella (`sync.keyfinder`) ya calculada. Compara
  cadenas de texto, nunca interpreta qué significan los campos de negocio.
- **No decide cuándo ejecutarse.** No hay temporizadores, ni debounce, ni intervalo — eso es
  responsabilidad de quien lo llama (en esta app, `SyncScheduler`).
- **No recuerda nada entre llamadas.** No tiene memoria propia ni persiste nada: cada ciclo compara
  `data` contra el `base` que le pasen, sin más estado que ese. El único "recuerdo" posible —el
  ancestro que hace falta para fusionar (ver más abajo)— no lo guarda el motor: viaja embebido en el
  propio registro de `data` que lo necesite (`sync.syncedValues`), y es responsabilidad de quien
  llama mantenerlo actualizado entre ciclos.
- **No reconcilia varias colecciones a la vez.** Quien tenga varias (recetas, insumos…) llama a
  `reconcile()` una vez por cada una.

## El contrato, con ejemplos

### Forma de un registro

Tanto `base` como `data` son arrays de **registros con la misma forma** — la misma que ya tienen en
el almacén (IndexedDB, lo que sea). Los campos de negocio van **aplanados al nivel superior** del
objeto (nada de un envoltorio `values` aparte); lo único que el motor añade es un campo `sync` con
los metadatos de sincronización:

```ts
type Registro<TValues> = TValues & {  // TValues: los campos de negocio, opacos para el motor
  sync: {
    id: string;          // nombre del campo de negocio que es el identificador — OBLIGATORIO, sin default
    keyfinder: string | null;  // huella/hash del contenido; `null` = hay que recalcularla
    deleted: boolean;    // borrado lógico — nunca se elimina físicamente el dato
    createdAt: string;   // formato de reloj lógico híbrido, ver hybrid-clock.ts
    updatedAt?: string;  // mismo formato; se usa antes que createdAt si se puede leer
    syncedValues?: Record<string, unknown>; // el ancestro — opcional; ausente = sin ancestro todavía
  };
};
```

`updatedAt` se usa antes que `createdAt` **si se puede leer**: vacío o ilegible, se cae a `createdAt`
en vez de quedarse sin versión (quedarse sin versión, en un registro local, significa perder su
edición frente al destino).

`sync` y no "auditoría": estos campos no llevan un historial de quién hizo qué, existen para que el
motor pueda **comparar y versionar**.

`sync.id` **no es el valor del identificador**: es el nombre del campo de negocio donde vive. Es
**obligatorio, sin valor por defecto**: quien construye el registro tiene que decir explícitamente
qué campo leer, porque un default silencioso escondería el error de una colección cuyo identificador
vive en otro campo y nadie se acuerda de decírselo al motor. El valor que haya en ese campo tiene que
ser un **texto no vacío**: cualquier otra cosa (un número, que es justo lo que devuelve una hoja de
cálculo si el adaptador no lo convierte) no es una identidad utilizable, así que ese registro se
ignora — y se reporta en `ignored`, con motivo `no-id`. El caso común se escribe explícito —
`{ id: 'r1', nombre: 'Bizcocho', sync: { id: 'id', ... } }` tiene identificador `'r1'`, leído de
`registro.id` porque `sync.id` así lo dice. Si el identificador vive en otro campo (`sku`, por
ejemplo), `sync.id: 'sku'` se lo dice al motor.

### Entrada

```ts
interface EngineInput<TValues> {
  base: Registro<TValues>[];   // lo que hay en el destino — la fuente de verdad
  data: Registro<TValues>[];   // snapshot local COMPLETO de esta colección (incluye los borrados marcados)
  now: number;
  originId: string;             // quién es "aquí", para desempatar conflictos y emitir versiones
}
```

`data` es el snapshot local **completo** en cada ciclo, no solo lo que cambió: un registro borrado
aquí sigue apareciendo en `data`, con `sync.deleted: true`. No hay ninguna regla de "ausencia implica
borrado" — un id de `base` que no aparece en `data` significa simplemente que aquí todavía no se
tiene, y el motor lo trae.

```ts
reconcile({
  base: [
    { id: 'r1', nombre: 'Bizcocho', sync: { id: 'id', keyfinder: 'fp', deleted: false, createdAt: '…' } },
  ],
  data: [
    { id: 'r1', nombre: 'Bizcocho E2E', sync: { id: 'id', keyfinder: 'fp2', deleted: false, createdAt: '…', updatedAt: '…' } },
  ],
  now: Date.now(),
  originId: 'este-dispositivo',
});
```

### Salida

Un `EnginePlan` con dos listas de acción y dos de diagnóstico:

- **`push`** — registros que hay que escribir en el destino porque ganó lo local, o porque son el
  resultado de una fusión (ver más abajo). Incluye los borrados: un registro con `sync.deleted: true`
  en `push` se escribe tal cual, el adaptador no distingue "contenido" de "borrado".
- **`pull`** — registros que hay que escribir aquí porque ganó el destino (por ausencia local, por
  borrado incondicional del destino, o por conflicto), o porque son el resultado de una fusión. Misma
  regla: si trae `deleted: true`, se escribe tal cual.
- **`conflicts`** — diagnóstico de quién ganó y por qué, por id. Solo hay entrada cuando de verdad
  hubo que decidir algo: una fusión en la que cambiaron los dos lados sale con `winner: 'merged'`;
  una edición normal, en la que solo cambió uno, **no es un conflicto** y no aparece aquí.
- **`duplicates`** — ids que aparecen más de una vez en `base` y no se tocan hasta que se arreglen a
  mano.
- **`ignored`** — registros que no se pudieron tener en cuenta, de cualquiera de los dos lados, con
  el motivo (`no-id`, `duplicate-local`). Existe porque descartar en silencio es la peor forma de
  fallar: sin esta lista, quien aplica el plan no tiene forma de saber que hay datos locales que no
  se van a subir nunca.

**Un mismo registro puede aparecer a la vez en `push` y en `pull`.** No es un error ni una
casualidad: es la señal de que hubo una fusión con cambios en los **dos** lados (ver "Fusión de
campos no solapados" más abajo) — al destino le falta lo que cambió aquí, y aquí falta lo que cambió
el destino, y el registro fusionado ya trae las dos partes, así que hace falta escribirlo en los dos
sitios.

No hay `remove`, `tombstones`, `purge` ni `aborted`: borrar es solo otro `push`/`pull` con
`deleted: true` dentro, y el motor siempre decide algo con lo que reciba.

## La tabla de decisión

Por cada id, resuelto en `base` y en `data` leyendo `registro[sync.id]`:

| en `base` | en `data` | qué se hace |
| --- | --- | --- |
| no | sí | se creó aquí → **`push`** |
| sí | no | aquí no se tiene todavía → **`pull`** |
| sí, `deleted: true` | sí o no | el destino manda de forma INCONDICIONAL → **`pull`**, sin comparar nada |
| sí, activo | sí, misma huella y sin borrar aquí | nada — convergido |
| sí, activo | sí, huella distinta, con ancestro embebido y sin campos solapados | **fusiona**: `push`, `pull` o los dos, según dónde falte |
| sí, activo | sí, huella distinta o borrado aquí (resto de casos) | **conflicto**: gana quien tenga la fecha más reciente |

Una huella `null` («hay que recalcularla») **nunca** cuenta como convergida, ni siquiera contra otra
`null`: dos registros que admiten no saber su huella no son una prueba de que coincidan.

Dos asimetrías deliberadas:

- **El borrado del destino no se discute.** Si `base.sync.deleted` es `true`, gana siempre, sin
  mirar fechas ni huellas — el destino es la fuente de verdad y su borrado es un hecho consumado.
- **El borrado local sí compite por fecha**, como cualquier otro cambio de contenido: si aquí se
  borró pero el destino cambió después (lo revivió, lo editó), el destino gana y el registro vuelve
  a estar activo aquí. Un borrado **nunca** se fusiona — es un evento de todo el registro, no de un
  campo — así que siempre cae en esta fila, ignorando cualquier ancestro que traiga.

## Las piezas que hacen esto universal

1. **Reloj lógico híbrido (HLC) con tope de reloj futuro.** Decide quién es "más reciente" sin
   fiarse de relojes físicos que pueden estar desincronizados entre orígenes, y sin que un valor
   corrupto pueda envenenar el reloj para siempre. Ver `hybrid-clock.ts`. El reloj observa **los dos
   lados** antes de emitir nada: un HLC solo cumple su promesa si tiene en cuenta todo lo que ha
   visto, incluida la propia historia ya persistida de este origen. Y el tope de futuro se aplica
   también a los dos: una fecha del año 3000 no se cree venga de donde venga — el destino se
   re-estampa (y el conflicto queda marcado `restamped`), y una versión local así se trata como
   ilegible y pierde.
2. **Detección de ids duplicados.** Dos registros con el mismo id puede pasar en cualquier almacén
   con clave, por la razón que sea. En `base` el motor no confía en ninguno hasta que se resuelva a
   mano (`duplicates`); en `data` sí hay criterio —gana la versión más alta, y a igualdad el último—
   y los perdedores se reportan en `ignored` en vez de desaparecer.
3. **Borrado lógico, siempre.** Nunca se elimina físicamente un registro: se marca `deleted: true` y
   se sincroniza como cualquier otro cambio. No hay lápidas aparte ni TTL de purga — el propio
   registro, con su flag, es la lápida.

## Fusión de campos no solapados

Cuando `base` y `data` divergen, antes de rendirse a "gana un lado entero" el motor intenta algo más
fino: si el destino cambió unos campos y local cambió otros campos **distintos**, se pueden combinar
los dos sin perder ninguno. Solo hace falta un tercer punto de referencia: el **ancestro común**, los
campos de negocio que los dos lados sabían que coincidían la última vez que convergieron — el mismo
papel que el *merge base* en `git merge`. Sin ese tercer punto, ver que un campo difiere entre `base`
y `data` no dice **quién** lo cambió, así que no se puede atribuir con seguridad.

### De dónde sale el ancestro: embebido en el propio registro local

El motor sigue sin tener memoria propia entre llamadas (ver más arriba). El ancestro no viaja como
una tercera lista aparte en `EngineInput` — viaja **dentro de `data`**, en `sync.syncedValues`:

```ts
interface Sync {
  // ...los campos de siempre (id, keyfinder, deleted, createdAt, updatedAt)...
  syncedValues?: Record<string, unknown>; // los campos que ESTE registro local sabía que coincidían con el destino
}
```

- Solo tiene sentido en un registro de `data`; el motor lo ignora si aparece en `base`.
- **Opcional, a diferencia de `sync.id`** (ver más arriba): su ausencia no es un descuido que haya
  que forzar a declarar, es el estado normal y más frecuente — la primera sincronización de cada
  registro, o cualquiera escrito antes de que este campo existiera. Se omite del todo, sin más.
- **Ausente** ⇒ el motor no puede fusionar y cae en el criterio de siempre: gana un lado entero por
  versión. 100% retrocompatible: ningún llamador que no rellene `syncedValues` nota ningún cambio
  de comportamiento.

### Cómo decide qué fusionar

Con el ancestro disponible, y solo cuando los campos de negocio de `base`/`data`/`syncedValues` son
los tres un objeto plano (si no, no hay "campos" que comparar y se cae al criterio de siempre), por
cada clave:

| `base` vs ancestro | `data` vs ancestro | qué pasa con esa clave |
| --- | --- | --- |
| igual | igual | se queda el valor del ancestro (los tres coinciden) |
| cambió | igual | se queda el valor de `base` — lo cambió el destino |
| igual | cambió | se queda el valor de `data` — lo cambió local |
| cambió | cambió, al MISMO valor nuevo | se queda ese valor — no hay nada que perder |
| cambió | cambió, a un valor DISTINTO | **solapamiento real**: se aborta la fusión ENTERA, no solo esta clave |

Ese último caso —el mismo campo, cambiado a valores distintos en los dos lados— es la única
situación en la que de verdad hay que elegir y perder algo. Ahí la fusión completa se cancela (no
solo esa clave) y se cae al criterio de fecha más reciente de siempre, exactamente como si no
hubiera ancestro.

### El resultado: se escribe donde falta algo

Una fusión con éxito no produce un solo registro "ganador": produce **uno o dos comandos de
escritura** con el mismo registro fusionado, según en qué lado falte contenido.

| cambió respecto al ancestro | qué se emite | ¿conflicto? |
| --- | --- | --- |
| los dos lados | `push` **y** `pull` — el mismo registro | sí, `winner: 'merged'` |
| solo local | solo `push` (al destino le falta) | no |
| solo el destino | solo `pull` (aquí falta) | no |
| ninguno (huellas distintas, valores iguales) | solo `pull` | no |

Cuando cambiaron los dos, un solo comando no basta: con solo `push`, local no vería hasta el ciclo
siguiente el campo que cambió el destino; con solo `pull`, el destino nunca recibiría el campo que
cambió local. Que el mismo id aparezca en las dos listas a la vez **es** la señal de que fue una
fusión de dos lados — no hace falta ningún campo booleano nuevo en `Registro` para saberlo.

Cuando solo cambió uno, escribir en el otro es **escribir de más**: ya tiene el contenido bueno. Y no
es un caso raro sino el normal — en cuanto el adaptador mantiene el ancestro, **cualquier edición
corriente** pasa por aquí, así que emitir siempre los dos comandos significaba mandar al destino
filas que no habían cambiado (cuota, latencia y una carrera con cualquier otro dispositivo) y llamar
«conflicto» a lo que no lo era.

La última fila es el caso raro de verdad: ningún campo cambió respecto al ancestro y aun así las
huellas no coinciden, o sea que una de las dos está mal calculada o rancia. No hay nada que mandar al
destino; se escribe **solo aquí** para que la huella local se recalcule y el ciclo siguiente converja
de verdad, en vez de repetir esa divergencia para siempre sin hacer nada.

`plan.conflicts` recibe entrada **solo** en la primera fila, con `winner: 'merged'`, `blind: false`, y
`mergedFrom: { remote: string[], local: string[] }` listando qué campos vinieron de cada lado (los
que ningún lado cambió, o que los dos cambiaron al mismo valor, no aparecen en ninguna de las dos
listas).

Un campo que desapareció de los dos lados desaparece **del todo** del registro fusionado, en vez de
quedarse como una clave con valor `undefined`: ese registro se escribe en el destino y se convierte
en el ancestro del ciclo siguiente, así que una clave fantasma se propagaría.

Y si los dos lados no están de acuerdo en **dónde** vive la identidad (`base.sync.id` distinto de
`data.sync.id`), no se fusiona: mezclar sus campos sacaría un registro con las dos identidades. Se
cae al criterio de siempre, que sube o trae un registro tal cual venía.

### La huella del registro fusionado viene `null` A PROPÓSITO

`merged.sync.keyfinder` es `null`, que significa **«hay que recalcularla»**. Los valores fusionados
son contenido **nuevo** que no coincide con la huella de ningún lado, y el motor no calcula huellas —
nunca lo ha hecho, no es su trabajo (ver "Qué NO es" más arriba). **Quien aplique el plan debe
recalcular la huella real antes de escribirla, en el destino y en local.**

Es `null` y no `''` porque una cadena vacía es indistinguible de una huella legítima: si alguien la
persistía, el ciclo siguiente veía `'' === ''`, **declaraba convergencia con contenidos distintos** y
la divergencia se quedaba congelada, sin conflicto y sin rastro. Con `null` el tipo obliga a mirarlo,
y aunque se persista igual, dos `null` no convergen.

### Lo que le toca al adaptador (trabajo nuevo, sobre lo que ya hacía)

Además de lo de siempre (leer el destino, calcular la huella, aplicar `push`/`pull`), un adaptador
que quiera aprovechar la fusión:

1. **Tras cada ciclo con éxito** —haya escrito por `push`, por `pull` o por una fusión—, guarda junto
   al registro local `nextSyncedValues(aplicado)` (exportada desde `reconcile.ts`) como su nuevo
   `sync.syncedValues`. La función solo le quita `sync` al registro que se acaba de aplicar — no hay
   que calcular nada a mano, y así ningún adaptador reinventa (o se equivoca) qué cuenta como
   ancestro. Ese es el ancestro que hará posible fusionar la próxima vez que algo diverja. Sin este
   paso, el ancestro nunca aparece y el motor sigue funcionando exactamente como antes de este
   feature (gana un lado entero). **Nunca antes de que la escritura se confirme**: guardarlo sobre un
   intento que no llegó a persistir congelaría un ancestro falso.
2. **Al recibir un registro con `keyfinder: null`** (viene de una fusión), recalcula la huella real
   antes de escribirla en cualquiera de los dos lados.
3. **Mira `plan.ignored`** y `plan.duplicates`: son los registros que el motor no pudo tener en
   cuenta. No hacer nada con ellos es tan válido como registrar un aviso, pero ignorarlos sin mirar
   equivale a perder datos locales sin enterarse.

Un borrado (de cualquiera de los dos lados) **nunca** pasa por aquí: sigue siendo un evento de todo
el registro, resuelto por fecha como siempre — la fusión ni se intenta.

## Cómo conectar un destino nuevo (el trabajo de un adaptador)

El motor no sabe nada de "cómo se ve" un destino — eso es enteramente trabajo del adaptador, que:

1. **Lee el destino** y lo traduce a `Registro[]` (el `base` de la entrada): cada registro con sus
   campos de negocio aplanados y su `sync` (`keyfinder`, `deleted`, `createdAt`/`updatedAt`) ya
   resueltos.
2. **Calcula la huella** (`keyfinder`) con el criterio que tenga sentido para ese destino (qué campos
   cuentan, cómo se serializa un número, qué se excluye — los campos de `sync` nunca deben entrar en
   la huella, para que escribirlos no parezca una edición). El motor no tiene opinión sobre esto.
3. **Llama a `reconcile(...)`** con eso más el snapshot local completo (`data`), una vez por cada
   colección — si quiere fusión de campos, cada registro de `data` lleva su propio
   `sync.syncedValues` (ver "Fusión de campos no solapados" arriba).
4. **Aplica el plan**: escribe en el destino lo que diga `push` (usando el id de cada registro para
   ubicarlo — el motor asume que basta con eso), y escribe aquí lo que diga `pull`. Si un registro
   trae `keyfinder: ''`, recalcula la huella real antes de escribirlo, en cualquiera de los dos
   lados; después de escribir con éxito, guarda `nextSyncedValues(aplicado)` como el `syncedValues`
   local de ese registro (ver más arriba).
5. Cualquier peculiaridad del destino que no encaje en "un registro con id" —posiciones, cabeceras,
   edición humana sin pasar por una API— se resuelve **antes o después** de llamar al motor, nunca
   dentro de él.

## Trabajo pendiente

Este motor **todavía no está conectado**: nadie fuera de esta carpeta lo importa. Faltan dos cosas, y
las dos están fuera de él a propósito:

1. **El adaptador de Google Sheets.** Hoy el único destino es Google Sheets, y su adaptador vive
   integrado en `infrastructure/reconcile.ts` — el motor anterior a este, con toda la lógica de
   posición de columnas y edición humana de una grilla mezclada con la decisión. Moverlo a un
   adaptador que traduzca la hoja a `Registro[]` y delegue aquí es lo que queda. Necesita además dos
   piezas que hoy no existen: fechas en formato de reloj lógico (las de `recipe-book` son ISO) y un
   sitio donde guardar `sync.syncedValues` (el `SyncShadow` actual solo guarda la huella, que no
   sirve de ancestro para fusionar).
2. **Un solo reloj.** `domain/value-objects/row-version.ts` (`RowVersion`/`RowClock`, el que usa
   producción) y `hybrid-clock.ts` (`LogicalVersion`/`HybridClock`, el de aquí) son dos
   implementaciones casi idénticas del mismo HLC. Cuando el adaptador exista, sobra una.
