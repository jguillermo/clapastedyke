# El motor de sincronización

Qué es, qué no es, y cómo conectarle un destino nuevo.

## Qué es

Una función pura — `reconcile(input): EnginePlan` — que decide qué hay que subir o traer para que
"aquí" y "el destino" digan lo mismo, **de una sola colección** por llamada. **El destino (`base`) es
la fuente de verdad**: el motor compara `data` (lo que hay aquí) directamente contra `base` (lo que
hay en el destino), sin necesitar una tercera copia ni un ancestro persistido aparte.

```
reconcile({ base, data, now, originId }) → { push, apply, conflicts, duplicates }
```

Mismas entradas, mismo plan, siempre. No hace ninguna llamada de red, no toca ninguna base de datos,
no espera a nada — así que se puede probar con decenas de casos (un id duplicado, una versión
corrupta, un borrado local frente a uno remoto) sin necesitar un destino real. Ver `reconcile.ts`
para el algoritmo y `reconcile.spec.ts` (en esta misma carpeta) para el catálogo de casos que ya
cubre.

## Qué NO es

- **No sabe qué es Google, ni Sheets, ni HTTP.** Nunca hace una petición de red.
- **No sabe qué es una tabla, una fila ni una posición.** Un registro tiene un identificador (leído
  de `values`, ver más abajo) y un contenido opaco. El destino se asume un almacén con clave real —
  no hace falta un puntero de ubicación (fila, ETag…) aparte del propio id.
- **No canonicaliza ni hashea contenido.** Recibe la huella (`auditoria.keyfinder`) ya calculada.
  Compara cadenas de texto, nunca interpreta qué significan los campos de `values`.
- **No decide cuándo ejecutarse.** No hay temporizadores, ni debounce, ni intervalo — eso es
  responsabilidad de quien lo llama (en esta app, `SyncScheduler`).
- **No recuerda nada entre llamadas.** No tiene memoria propia ni persiste nada — ni siquiera un
  ancestro: cada ciclo compara `data` contra el `base` que le pasen, sin más estado que ese.
- **No reconcilia varias colecciones a la vez.** Quien tenga varias (recetas, insumos…) llama a
  `reconcile()` una vez por cada una.

## El contrato, con ejemplos

### Forma de un registro

Tanto `base` como `data` son arrays de **registros con la misma forma** — la misma que ya tienen en
el almacén (IndexedDB, lo que sea), sin envoltorio aparte:

```ts
interface Registro<TValues> {
  values: TValues;   // el contenido de negocio, opaco para el motor
  auditoria: {
    id?: string;        // nombre del campo de `values` que es el identificador; por defecto 'id'
    keyfinder: string;  // huella/hash de `values`, para saber si el contenido cambió
    deleted: boolean;    // borrado lógico — nunca se elimina físicamente el dato
    createdAt: string;   // formato de reloj lógico híbrido, ver hybrid-clock.ts
    updatedAt?: string;  // mismo formato; se usa antes que createdAt si está
  };
}
```

`auditoria.id` **no es el valor del identificador**: es el nombre del campo de `values` donde vive.
Con el default (`'id'`), un registro `{ values: { id: 'r1', nombre: 'Bizcocho' }, auditoria: {...} }`
tiene identificador `'r1'`. Si el identificador vive en otro campo (`values.sku`, por ejemplo),
`auditoria.id: 'sku'` se lo dice al motor.

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
aquí sigue apareciendo en `data`, con `auditoria.deleted: true`. No hay ninguna regla de "ausencia
implica borrado" — un id de `base` que no aparece en `data` significa simplemente que aquí todavía
no se tiene, y el motor lo trae.

```ts
reconcile({
  base: [
    { values: { id: 'r1', nombre: 'Bizcocho' }, auditoria: { keyfinder: 'fp', deleted: false, createdAt: '…' } },
  ],
  data: [
    { values: { id: 'r1', nombre: 'Bizcocho E2E' }, auditoria: { keyfinder: 'fp2', deleted: false, createdAt: '…', updatedAt: '…' } },
  ],
  now: Date.now(),
  originId: 'este-dispositivo',
});
```

### Salida

Un `EnginePlan` con dos listas de acción y dos de diagnóstico:

- **`push`** — registros que hay que escribir en el destino porque ganó lo local. Incluye los
  borrados: un registro con `auditoria.deleted: true` en `push` se escribe tal cual, el adaptador no
  distingue "contenido" de "borrado".
- **`apply`** — registros que hay que escribir aquí porque ganó el destino (por ausencia local, por
  borrado incondicional del destino, o por conflicto). Misma regla: si trae `deleted: true`, se
  escribe tal cual.
- **`conflicts`** — diagnóstico de quién ganó y por qué, por id.
- **`duplicates`** — ids que aparecen más de una vez en `base` y no se tocan hasta que se arreglen a
  mano.

No hay `remove`, `tombstones`, `purge` ni `aborted`: borrar es solo otro `push`/`apply` con
`deleted: true` dentro, y el motor siempre decide algo con lo que reciba.

## La tabla de decisión

Por cada id, resuelto en `base` y en `data` leyendo `values[auditoria.id ?? 'id']`:

| en `base` | en `data` | qué se hace |
|---|---|---|
| no | sí | se creó aquí → **`push`** |
| sí | no | aquí no se tiene todavía → **`apply`** |
| sí, `deleted: true` | sí o no | el destino manda de forma INCONDICIONAL → **`apply`**, sin comparar nada |
| sí, activo | sí, misma huella y sin borrar aquí | nada — convergido |
| sí, activo | sí, huella distinta o borrado aquí | **conflicto**: gana quien tenga la fecha más reciente |

Dos asimetrías deliberadas:

- **El borrado del destino no se discute.** Si `base.auditoria.deleted` es `true`, gana siempre, sin
  mirar fechas ni huellas — el destino es la fuente de verdad y su borrado es un hecho consumado.
- **El borrado local sí compite por fecha**, como cualquier otro cambio de contenido: si aquí se
  borró pero el destino cambió después (lo revivió, lo editó), el destino gana y el registro vuelve
  a estar activo aquí.

## Las piezas que hacen esto universal

1. **Reloj lógico híbrido (HLC) con tope de reloj futuro.** Decide quién es "más reciente" sin
   fiarse de relojes físicos que pueden estar desincronizados entre orígenes, y sin que un valor
   corrupto pueda envenenar el reloj para siempre. Ver `hybrid-clock.ts`.
2. **Detección de ids duplicados.** Dos registros con el mismo id puede pasar en cualquier almacén
   con clave, por la razón que sea — el motor no confía en ninguno hasta que se resuelva a mano.
3. **Borrado lógico, siempre.** Nunca se elimina físicamente un registro: se marca `deleted: true` y
   se sincroniza como cualquier otro cambio. No hay lápidas aparte ni TTL de purga — el propio
   registro, con su flag, es la lápida.

## Cómo conectar un destino nuevo (el trabajo de un adaptador)

El motor no sabe nada de "cómo se ve" un destino — eso es enteramente trabajo del adaptador, que:

1. **Lee el destino** y lo traduce a `Registro[]` (el `base` de la entrada): cada registro con su
   `values` y su `auditoria` (`keyfinder`, `deleted`, `createdAt`/`updatedAt`) ya resueltos.
2. **Calcula la huella** (`keyfinder`) con el criterio que tenga sentido para ese destino (qué campos
   cuentan, cómo se serializa un número, qué se excluye — los campos de auditoría nunca deben entrar
   en la huella, para que escribirlos no parezca una edición). El motor no tiene opinión sobre esto.
3. **Llama a `reconcile(...)`** con eso más el snapshot local completo (`data`), una vez por cada
   colección.
4. **Aplica el plan**: escribe en el destino lo que diga `push` (usando el id de cada registro para
   ubicarlo — el motor asume que basta con eso), y escribe aquí lo que diga `apply`.
5. Cualquier peculiaridad del destino que no encaje en "un registro con id" —posiciones, cabeceras,
   edición humana sin pasar por una API— se resuelve **antes o después** de llamar al motor, nunca
   dentro de él.

En este repo, hoy el único destino es Google Sheets. Su adaptador todavía vive integrado en
`infrastructure/reconcile.ts` (el motor anterior a este, con toda la lógica de posición de columnas y
edición humana de una grilla mezclada con la decisión); moverlo a un adaptador que traduzca hacia este
motor genérico es trabajo pendiente.
