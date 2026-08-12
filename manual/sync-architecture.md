# Sincronización bidireccional con Google Sheets

Cómo la app y la hoja del usuario se mantienen iguales, **por qué está hecho así**, qué límites tiene
aceptados y cómo se diagnostica cuando algo no cuadra.

El «cómo se configura» está en [google-setup.md](google-setup.md); el «por qué Google Sheets y no otra
cosa» y las alternativas medidas y descartadas, en
[google-integration.md](google-integration.md).

## Lo que cambió

La integración empezó siendo un **espejo de una sola vía**: la app escribía su recetario en una hoja y
nunca la leía. Ahora la hoja es la **fuente de la verdad**: se lee, se fusiona con lo local y se escribe
solo lo que gana. Eso permite dos cosas que antes no existían: **usar la app desde varios dispositivos**
y **editar la hoja a mano**.

## Las tres copias

Con dos copias no se puede saber *quién* cambió algo. Si un insumo vale 2,50 aquí y 3,00 allí, ¿lo subió
alguien en la hoja o lo bajé yo aquí? Son cosas opuestas y se ven igual. Por eso hay tres:

| Copia | Dónde | Qué es |
|---|---|---|
| `local` | Los stores de `recipe-book` | Lo que el usuario ve y edita aquí |
| `base` | El store `sync_shadow` | La última fila remota **conocida** |
| `remote` | Leído fresco en cada ciclo | Lo que hay ahora en la hoja |

`local` vs `base` = cambió aquí. `remote` vs `base` = cambió allí. Los dos = conflicto.

La base es además **lo único que detecta un borrado a mano**: si un id está en la base y ya no está en la
hoja, alguien borró esa fila. Sin ella, «lo borraron allí» y «esto nunca llegó aquí» son indistinguibles.

**La base es por cuenta.** Se vacía al entrar y al salir, igual que la cola: una base de la hoja de otra
persona haría que las filas propias parecieran cambios remotos.

## Las columnas de servicio

Cada pestaña con clave lleva cuatro columnas al final (esquema **v4**):

| Columna | Para qué |
|---|---|
| `version` | Reloj lógico: decide quién gana un conflicto |
| `origen` | Qué dispositivo la escribió (desempate y diagnóstico) |
| `huella` | Detectar que una persona editó la fila |
| `borrado` | La lápida |

Las columnas rotuladas **`(auto)`** las recalcula la app a partir de un id: `Categoría (auto)`,
`Sabor (auto)`, `Nº de insumos (auto)`, `Insumo (auto)`… **Editarlas no hace nada** y se regeneran. Para
cambiar la categoría de una receta se cambia `categoriaId`; para cambiar el nombre de la categoría, su
fila en la pestaña `Categorias`.

**El `id` no se edita.** De él depende que las referencias entre pestañas signifiquen algo. Si se cambia,
la app lo devuelve a su sitio.

## El reloj lógico, y por qué tiene tope

`version` es `instante-contador-dispositivo`, acolchado para que **comparar cadenas sea comparar
versiones** (y para que ordenar la columna en la hoja no engañe).

Es un reloj *lógico* y no una marca de tiempo porque cada dispositivo tiene su propia hora: con marcas a
secas, un móvil atrasado perdería *siempre*. El reloj se pone al día con lo que lee de la hoja.

Y tiene **tope de cinco minutos** hacia el futuro. La columna está visible y sin proteger: alguien puede
teclear el año 3000, o arrastrarla al ordenar. Sin tope, esa fila ganaría para siempre **y envenenaría el
reloj de todos los dispositivos** al leerla. Con tope, se re-estampa y desaparece el problema.

## Lo que hace una persona en la hoja

Cuatro detecciones, y sin ellas la edición manual se pierde en silencio:

1. **Editó una fila** → se recalcula la huella de las celdas de datos; si no coincide con la celda
   `huella`, lo tocó un humano (la app escribe contenido y huella **juntos**). Se le da versión de *ahora*,
   así que **gana**. Sin esto, la resolución por versión pisaría su corrección: quien edita una celda no
   actualiza la columna de versión.
2. **Borró una fila** → estaba en la base, no está en la hoja ⇒ lápida.
3. **Añadió una fila sin id** → se **adopta**: se le asigna identidad, se importa como cualquier fila que
   ganó allí, y se le **escriben de vuelta** el id, la huella y la versión *en su propia fila* (una
   escritura por celda, para no moverla de sitio: el usuario la puso donde quería). Sin ese último paso el
   ciclo siguiente le inventaría otra identidad — un agregado nuevo cada dos minutos.
   Si la fila tiene una celda imposible **no se estampa**: se deja intacta para que su dueño la corrija, y
   se cuenta como ilegible.
4. **Le cambió el id a una fila** → se le **devuelve el suyo**. Es el desenlace más silencioso de todos si
   no se corrige: el id viejo desaparece (⇒ se daría por borrado el agregado), el nuevo parece un alta, y
   toda receta que apuntaba al viejo queda colgando mientras las columnas `(auto)` siguen mostrando el
   nombre correcto. La hoja parece perfecta y la app está rota. Se reconoce comparando el contenido **sin
   su id**, y se arregla escribiendo el id anterior en su celda.

> **Una fila sin id se conserva aunque tarde en adoptarse.** El upsert por clave copia tal cual, y en su
> sitio, las filas que no tienen id. Antes las descartaba, así que cualquier envío a esa pestaña ocurrido
> entre que alguien teclea la fila y el ciclo la adopta **se la llevaba por delante** sin aviso.

## Borrar desde la app

Se borra una receta desde su formulario y un insumo desde su fila de la lista; los dos **preguntan en el
sitio** antes (el pie del diálogo o la propia celda), sin diálogo encima del diálogo.

- **Un insumo que una receta usa no se borra**: se dice qué receta lo usa. Las otras dos salidas eran
  quitar la línea de cada receta (borrar datos que nadie pidió borrar) o dejarla colgando (una receta que
  la app no sabe costear).
- **Se borra con lápida, no se olvida**: el documento se queda con fecha de borrado y deja de entregarse.
  Es lo que permite que el borrado **viaje** — si desapareciera, sería indistinguible de «esto nunca llegó
  a este dispositivo» y el primer dispositivo desconectado lo resucitaría.
- **No hay evento de borrado**, y no hace falta: la lápida sale de comparar lo que hay aquí con la base. La
  única consecuencia es de cadencia — sin evento no hay rebote de cinco segundos, así que sube con el ciclo
  siguiente (≤ el intervalo configurado, 2 min por defecto, o antes si se toca cualquier otra cosa).

## La regla que evita la tormenta: huella vacía = adoptar

Una fila **sin huella** es una fila que este motor nunca escribió: o la hoja es anterior a que existiera
la columna, o la añadió una persona. En los dos casos se **adopta como base** y la comparación normal
decide después.

Sin esta regla, el primer ciclo contra una hoja que ya existía vería *todas* las filas sin huella, las
tomaría por ediciones manuales, les pondría versión nueva a todas, y a la vez las vería como cambios
locales porque la base está vacía: el catálogo entero colisionaría en el mismo ciclo y se resolvería por
desempate de dispositivo, o sea **al azar**.

Es también lo que hace que la migración de v3 a v4 no necesite tocar ni una fila: solo se reescriben las
cabeceras.

## El ciclo

Siempre **bajar → fusionar → subir**. Nunca se sube a ciegas: subir sin haber leído es lo que pisa el
trabajo de otro dispositivo.

1. **Puerta**: ¿credenciales? ¿hoja? Si no, para.
2. **Bajar** la hoja entera en una petición (`values:batchGet`, sin formatear).
3. **Fusionar**: decide sin tocar nada — y **abortar** si salta una barrera (ver abajo).
4. **Poner al día la forma** de la hoja si es de una versión anterior. Después de la barrera y antes de
   escribir datos: ver «El orden entre la barrera y la forma».
5. **Aplicar** aquí lo que ganó allí, apuntando la base **fila a fila**.
6. **Adoptar** las altas a mano y **devolver** los ids cambiados.
7. **Subir** lo que ganó aquí, con su huella y su versión.
8. **Marcar borrado** en la hoja lo que se borró aquí, y **tirar** las lápidas viejas.

El paso 6 antes del 7 importa: si se subiera primero y el proceso muriera, la hoja tendría cambios que
aquí no están y la base no lo sabría. Y la base se apunta fila a fila, no al final, porque una muerte
entre «apliqué 40 filas» y «apunté la base» haría que esas 40 se subieran de vuelta **con contenido viejo
y versión nueva**, ganándole a un cambio legítimo.

### La hoja puede cambiar entre el paso 2 y el 4

Entre bajar y escribir hay `await`s, y en ese hueco la hoja de la cuenta **puede dejar de ser la misma**:
la pantalla de cuenta reemplaza la hoja cuando la anterior ya no está (borrada, en la papelera, o porque
el usuario pidió otra), y al conectar se dispara un ciclo en paralelo. Así que el ciclo comprueba, después
de leer y antes de escribir, que la hoja sigue siendo la de la cuenta; si no, **se descarta sin escribir
nada** y quien lo pidió recibe un ciclo nuevo contra la hoja nueva. Es la misma comprobación que se hace
con el `epoch` de la sesión, y por la misma razón: lo único cierto es lo que hay ahora.

Sin eso, el ciclo escribía en la hoja abandonada y dejaba la base describiendo filas que la hoja nueva no
tiene — y entonces el tope de borrado masivo abortaba **todos** los ciclos siguientes: hoja nueva vacía,
error permanente y las recetas sin subir. Por eso, además, **reemplazar la hoja vacía la base**: la base
dice «esto es lo que había en la hoja» y no apunta a cuál, así que sobrevivir al reemplazo la convierte en
una mentira.

## Las barreras

Un ciclo se **niega a seguir entero** —sin aplicar ni escribir nada— en tres casos:

| Barrera | Por qué |
|---|---|
| Falta una pestaña, o su cabecera no cuadra | «No hay filas» + «lo que no está, se borró» = borrar la tabla entera en todos los dispositivos. Un clic derecho en «Eliminar hoja» no puede costar eso. |
| Se borrarían más de 20 filas o más del 30 % de una tabla | Una lectura a medias es indistinguible de un borrado real. El tope no distingue el accidente, pero convierte la pérdida total en una pregunta. |
| Hay ids repetidos en una pestaña | No se sabe cuál es la de verdad; escribir en una dejaría la otra reapareciendo como un fantasma. |

### El orden entre la barrera y la forma

La migración **reescribe la fila de cabecera**, así que tiene que correr *después* de decidir. Si corriera
antes, una columna insertada a mano quedaría tapada: el ciclo abortaría (decide con la hoja tal como la
leyó) pero el siguiente encontraría cabeceras que cuadran sobre datos corridos una columna — leyendo el
precio donde está la moneda, sin que nada volviera a quejarse. La barrera duraría un ciclo y el daño sería
permanente y silencioso.

Después de la barrera se sabe que las columnas de datos están en su sitio, así que lo único que la
migración puede cambiar es lo suyo: los rótulos y las columnas de servicio.

## Una celda mal escrita no atasca nada

El dominio valida al entrar: una cantidad en cero, una unidad en blanco o una receta sin ingredientes no
se pueden construir. Si eso lanzara, el ciclo moriría — y como la celda seguiría en la hoja, moriría
**igual para siempre** y la convergencia se detendría del todo.

Así que se contesta **fila a fila**. Una fila que no se puede leer:

- se aparta y se apunta en la base **con la huella que tenía al fallar**, así que no se reintenta hasta
  que alguien cambie esa celda;
- **no se sobrescribe nunca** — escribirle nuestro valor encima borraría el intento de corrección;
- y el resto del lote entra igual.

## Cuándo se sincroniza

| Disparador | Cuándo |
|---|---|
| Arranque | Con plazo de 8 s: con conexión se trabaja sobre la hoja; sin ella, se entra con lo local |
| Cambio local | ~5 s después del último (se reinicia con cada cambio) |
| Intervalo | Cada N, configurable (`syncPollSeconds` en `public/config.json`, por defecto 120 s) |
| Foco, vuelve la conexión | Al recuperarlos |
| Entrar / reanudar sesión | Inmediato |

Todos los disparadores **ambientales** comparten un mínimo de 20 s. El culpable no es el intervalo: es el
**foco**, que salta en *cada* cambio de pestaña — alguien alternando 30 veces por minuto dispararía 30
ciclos, unas 90 peticiones, por encima de las 60/min que Google da por usuario, y vería «error» sin haber
hecho nada raro.

Los **deliberados** (cambio local, reintento, botón) no pasan por ese mínimo: ya vienen limitados por su
propio temporizador. Aplicárselo los descartaría sin reprogramarlos, y entonces un cambio local esperaría
al intervalo de dos minutos y un reintento programado a los 5 s no ocurriría nunca — los dos, fallos
silenciosos.

Un fallo espera cada vez más (5 s → 5 min).

## Varias pestañas

`navigator.locks` reparte el turno: **solo una pestaña sincroniza**. Se pide con una promesa que no se
resuelve, así que el turno se mantiene mientras la pestaña viva y el relevo al cerrarse lo hace el
navegador — sin detectar muertes ni reintentar. Al acabar, avisa por `BroadcastChannel` y las demás
releen de IndexedDB.

Sin esas APIs, **todas las pestañas trabajan**: es el comportamiento anterior (más cuota, posible
pisarse), no uno peor. Dar por hecho que nadie trabaja dejaría la app sin sincronizar en silencio.

## La sesión caduca, y no es un error

El token de Google dura ~1 h y **en un navegador no hay refresh token** — es una propiedad de la
plataforma, no un defecto (medido en [google-integration.md](google-integration.md)). Primero se intenta
renovar en silencio; si no se puede, el estado pasa a **`reconnect`** y no a `error`, porque lo que hay
que hacer es distinto y no se ha roto nada. Lo pendiente espera intacto.

## El seed no pisa datos de verdad

Si este navegador tuvo cuenta alguna vez, **no se siembra**: su catálogo está en su hoja y ahí manda.
Se pregunta en local y sin red (`AccountHistory`), porque con las credenciales no valdría: sin cobertura
diría «nunca hubo cuenta» y sembraría.

Queda un caso estrecho que lo cubren las lápidas: un dispositivo nuevo de alguien que ya tiene cuenta no
tiene pista todavía y siembra. Como los ids del seed son fijos, sus filas son *las mismas* que las de la
hoja y se emparejan sin duplicar nada; lo único que podría reaparecer es lo que esa persona hubiera
**borrado** en otro dispositivo, y para eso está la lápida.

## Límites aceptados (se documentan, no se arreglan)

- **No hay escritura condicional en Sheets.** Una escritura de otro dispositivo entre nuestra bajada y
  nuestra subida (~1–2 s) puede quedar pisada. El sistema se cura al ciclo siguiente, pero el valor
  intermedio se pierde. Es el límite que ya aceptaba el diseño anterior: la garantía es **convergencia, no
  exclusión**.
- **La granularidad es la receta, no la línea.** Su tabla no tiene id y `(receta, insumo)` no es único, así
  que la unidad de fusión es la receta entera — la misma con la que la app ya guarda. Dos dispositivos
  editando líneas distintas de la misma receta: uno pierde.
- **LWW de agregado completo.** Dos dispositivos editando campos distintos del mismo insumo: uno pierde.
  Límite del motor de Sheets (`infrastructure/reconcile.ts`), que esta nota no cambia: el motor genérico
  nuevo (`core/external-sync/domain/services/engine/`, ver su README) ya sabe fusionar campos no
  solapados en vez de descartar un lado entero, pero solo aplicará aquí cuando el adaptador de Sheets se
  mueva a ese motor — hoy sigue siendo trabajo pendiente.
- **Una `version` forjada a mano dentro del margen de 5 min gana.** Las columnas están visibles a propósito.
- **Las columnas `(auto)` no se pueden editar.**
- **Las lápidas se tiran a los ~90 días.** Un dispositivo que llevara más tiempo sin conectarse *y* que
  además hubiera perdido su base (datos del sitio borrados) resubiría cosas borradas hace mucho.
- **Se reescribe la pestaña entera al subir**, no fila a fila. Es lo que la hace idempotente y conserva el
  orden de filas del usuario. A cientos o pocos miles de filas sobra; con decenas de miles habría que
  paginar.
- **Un borrado hecho aquí tarda hasta dos minutos en salir.** No publica evento, así que no tiene el rebote
  de cinco segundos de un guardado: espera al ciclo siguiente. Nada se pierde — la lápida ya está en local.

## Diagnóstico

En `/cuenta` hay dos botones. **«Comprobar la hoja» solo lee**: compara y cuenta lo que haría, sin tocar
nada. Es lo primero que hay que pulsar cuando algo no cuadra.

Con `"debug": true` en `public/config.json`, la consola trae el detalle:

| Lo que se ve | Qué significa |
|---|---|
| `diferencias por campo` con **casi todo el catálogo en un mismo campo** | La canonización de ese campo no es determinista. Es el fallo más grave y el único que no se puede cazar con tests: los dos lados atraviesan el mismo código en un test y coinciden por accidente. Síntoma en producción: la hoja se reescribe sola cada dos minutos. |
| `N filas se adoptarían` en el primer ciclo | Normal: la hoja no tenía columna de huella. |
| `ids duplicados`, `filas ilegibles` | Lo que hay que arreglar **a mano** en la hoja: el motor no puede decidir por ti cuál de dos filas con el mismo id es la de verdad, ni qué querías escribir en una celda que no se puede leer. Salen con ejemplos. |
| `idsDevueltos`, `altasAMano` | Correcciones que el motor **ya hizo**: le devolvió el id a una fila a la que se lo cambiaron, o adoptó una que estaba sin id. |
| `el ciclo se ha negado a seguir` | Una barrera. El motivo dice qué pestaña. |
| `conflictos` con `blind: true` | Se eligió sin saber cuándo se cambió aquí. Solo debería pasar con filas guardadas antes de que existiera `updatedAt`. |
| `demasiado pronto para otro ciclo` | El mínimo ambiental haciendo su trabajo. No es un fallo. |

## Cómo se prueba

La decisión es pura y se prueba por unidad (`reconcile.spec.ts` lleva un caso por modo de fallo). Lo que
**no** se puede probar así es el ciclo completo, porque hace falta una hoja al otro lado: por eso la
suite E2E trae un **doble de Google** —Identity Services, Sheets y Drive— servido desde el propio test
en [`e2e/support/google-double.ts`](../e2e/support/google-double.ts), con su modelo de hoja en memoria.

El doble emula a propósito los comportamientos de Sheets de los que depende el motor: `RAW` convirtiendo
`'2.5'` en el número `2.5` (y `'TRUE'` en booleano), el recorte de filas y celdas vacías al leer, la
cuadrícula que no crece sola, y el desplazamiento de filas al borrar una. Eso es lo que hace que
`'todo está al día'` **después** de que cada valor haya ido y vuelto por una celda sea una aserción con
valor: cubre el viaje completo del dato, que es donde vive el fallo de canonización.

| Spec | Qué cubre |
|---|---|
| `e2e/specs/account/account.spec.ts` | Conectar crea la hoja y sube el recetario · la comprobación no encuentra nada que mover · el ciclo es **idempotente** · cerrar sesión · hoja en la papelera ⇒ se crea otra |
| `e2e/specs/account/sheet-authority.spec.ts` | Editar una celda a mano, marcar `borrado` y borrar una fila **bajan** a la app |
| `e2e/specs/account/guard-rails.spec.ts` | Las tres barreras: borrado masivo, pestaña que falta, cabecera movida — y que arreglar la hoja devuelve la convergencia |
| `e2e/specs/sync-badge/sync-badge.spec.ts` | El aviso: no existe al día, aparece con un cambio sin subir (el doble **retiene** la respuesta), desaparece al volver la red |

Lo que sigue siendo comprobación a mano, porque ningún doble lo cubre: dos navegadores contra la
**misma hoja de verdad**, y que la canonización coincida con los números reales de alguien.

## Dónde está cada cosa

| Pieza | Fichero |
|---|---|
| La decisión (sin red, sin IndexedDB) | `core/external-sync/infrastructure/reconcile.ts` |
| Canonización (el cimiento) | `…/infrastructure/sheet-canonical.ts` |
| Huella | `…/infrastructure/sheet-hash.ts` |
| Reloj lógico | `…/domain/value-objects/row-version.ts` |
| El ciclo | `…/application/use-cases/synchronize-with-remote.use-case.ts` |
| Simulación (solo lee) | `…/application/use-cases/reconcile-with-remote.use-case.ts` |
| Puerta de arranque | `…/application/use-cases/boot-sync.use-case.ts` |
| Cuándo | `…/infrastructure/sync-scheduler.ts` |
| Pestañas | `…/infrastructure/web-locks-sync-coordinator.ts` |
| Lectura / escritura de la hoja | `…/infrastructure/google-sheets.reader.ts`, `google-sheets.gateway.ts` |
| Esquema y migración | `…/infrastructure/sheet-schema.ts`, `schema-migration.ts` |
| Traer datos al recetario | `core/recipe-book/infrastructure/recipe-book-importable-data.ts` |
| Metadatos locales (`updatedAt`, lápidas) | `core/recipe-book/infrastructure/synced-record.ts` |
| El aviso | `components/sync-indicator/`, `features/sync-badge/` |
