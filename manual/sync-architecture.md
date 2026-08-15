# Sincronización bidireccional con Google Sheets

Cómo la app y la hoja del usuario se mantienen iguales, **por qué está hecho así**, qué límites tiene
aceptados y cómo se diagnostica cuando algo no cuadra.

El «cómo se configura» está en [google-setup.md](google-setup.md); el «por qué Google Sheets y no otra
cosa» y las alternativas medidas y descartadas, en
[google-integration.md](google-integration.md).

## Lo que cambió

La integración empezó siendo un **espejo de una sola vía**: la app escribía su recetario en una hoja y
nunca la leía. Después la hoja pasó a ser la **fuente de la verdad**, con un motor propio que sabía de
pestañas, columnas y posiciones.

Ahora la decisión vive en un **motor genérico** (`core/external-sync/domain/services/engine/`) que no
sabe qué es una hoja de cálculo, y todo lo que sí sabe está en un **adaptador**
(`infrastructure/sheets/`). Eso trae tres cosas que antes no existían:

- **Se fusionan campos no solapados.** Dos dispositivos que cambian cosas distintas del mismo insumo
  ya no se pisan: sobreviven los dos cambios. Antes ganaba un lado entero y el otro se perdía sin
  aviso.
- **La hoja es un espejo de las tablas.** Una pestaña por tabla, columnas deducidas de los datos.
  Replicar algo nuevo es añadir su nombre a un array; no hay esquema que mantener.
- **Un ciclo escribe una vez.** Todo lo que se escribe pasa por un solo lote.

## Las tres copias

Con dos copias no se puede saber *quién* cambió algo. Si un insumo vale 2,50 aquí y 3,00 allí, ¿lo
subió alguien en la hoja o lo bajé yo aquí? Son cosas opuestas y se ven igual. Por eso hay tres:

| Copia | Dónde | Qué es |
|---|---|---|
| local | Los stores de IndexedDB que dice el array | Lo que el usuario ve y edita aquí |
| base | El store `sync_shadow` | La última fila remota **conocida**, con sus valores |
| remoto | Leído fresco en cada ciclo | Lo que hay ahora en la hoja |

La base guarda **los valores, no solo la huella**, y eso es lo que hace posible la fusión: con una
huella se sabe *que* la fila cambió; con los valores se sabe **qué** cambió, y entonces el precio se
puede atribuir a la hoja y el nombre a la app en vez de descartar un lado completo.

También es **lo único que detecta un borrado a mano**: si un id está en la base y ya no está en la
hoja, alguien borró esa fila. Sin ella, «lo borraron allí» y «esto nunca llegó aquí» son
indistinguibles.

**La base es por cuenta.** Se vacía al entrar y al salir, igual que la cola: una base de la hoja de
otra persona haría que las filas propias parecieran cambios remotos.

## Qué tablas se replican

Un array, en el caso de uso (`application/use-cases/synchronize-tables.use-case.ts`):

```ts
export const SYNCED_TABLES: readonly StoreName[] = [
  'ingredients', 'recipes', 'recipe_categories', 'flavors', 'conversion_options',
];
```

Son nombres de **object store de IndexedDB**, tipados con `StoreName`, así que una errata no compila.
Añadir una tabla es añadir su nombre; quitarla es borrarlo (sus filas se quedan donde estén, en los dos
sitios, sin tocarse más). Los stores de servicio (`sync_*`, `seed_state`, `auth_session_hint`) no están
y no deben estar: son el andamiaje del propio sincronizador.

## Cómo se ve una fila en la hoja

Seis columnas fijas, siempre las mismas, y **todas texto**:

| Columna | Contenido |
|---|---|
| `id` | La identidad. **Manda esta**, no el `id` que vaya dentro del JSON |
| `datos` | El registro entero, en JSON canónico |
| `version` | Reloj lógico: decide quién gana un conflicto |
| `origen` | Qué dispositivo la escribió (desempate y diagnóstico) |
| `huella` | Hash del JSON canónico: detecta que una persona editó la fila |
| `borrado` | La lápida. Se lee **estricta**: ver abajo |

```
id            datos                                                          version  origen  huella  borrado
ing-harina    {"baseUnit":"g","id":"ing-harina","name":"Harina",…}             …        …       …
```

### Por qué el registro entero en una celda

Porque **una celda no tiene tipo**. Hubo una versión de esto con una columna por campo
(`purchasePrice.amount`, `purchasePrice.per.unit`…), y como se escribe con `valueInputOption: RAW`
—que guarda tal cual— un precio subía como número y volvía como texto. Y lo que baja se guarda **tal
cual** en la base de datos: con `purchasePrice.amount: '4.5'` en vez de `4.5`, el repositorio del
recetario descartaba ese insumo como documento sin precio y desaparecía del catálogo, sin más rastro
que un aviso en consola.

Se llegó a construir una capa que **adivinaba** el tipo de cada columna a partir del valor local para
compensarlo. Era un parche sobre un formato que pierde información. Con JSON el tipo viaja dentro del
dato: un número es un número porque el JSON lo dice.

### Lo único que se transforma

```
registro local ──(quitar updatedAt/deletedAt)──▶ payload ──JSON──▶ celda
celda ──JSON──▶ payload ──(id de su columna)──▶ lo que ve el motor
lo que decidió el motor ──(añadir updatedAt/deletedAt)──▶ registro local
```

1. **`updatedAt` y `deletedAt` no viajan.** Su información ya va en `version` y `borrado`; al bajar se
   sintetizan, y `updatedAt` sale del instante que lleva dentro la versión, no de «ahora», así que la
   fecha guardada es la del cambio y el ciclo siguiente deriva de ella la misma versión que hay en la
   hoja. Se quitan **en los dos lados**: si el registro local los llevara y el remoto no, el motor los
   vería como campos que solo existen aquí y subiría esa fila para siempre.
2. **El `id` sale de su columna.** Al escribir, columna y JSON salen del mismo registro.

Ni se aplana, ni se tipa, ni se reconstruye: lo que hay en la celda es, parseado, exactamente lo que se
le pasa al motor.

### El JSON canónico

De su determinismo depende que la huella signifique «esto lo escribí yo»: claves **ordenadas** en todos
los niveles, textos en **NFC**, sin nulos y sin espacios. Al leer se parsea y se vuelve a serializar
canónicamente antes de comparar, así que reformatear el JSON o reordenar sus claves **no** cuenta como
edición; cambiar un valor, sí.

La lápida es la única columna de servicio que no se lee de forma permisiva. Para un sí/no cualquiera
vale lo que teclee una persona, pero aquí el daño es asimétrico: un falso «no borrado» no se nota, y un
falso «borrado» hace desaparecer el dato en todos los dispositivos a la vez. Solo borra lo que se
reconoce como una orden de borrar.

**El `id` no se edita.** De él depende que las referencias entre pestañas signifiquen algo. Si se
cambia, la app lo devuelve a su sitio.

## El reloj lógico, y por qué tiene tope

`version` es `instante-contador-dispositivo`, acolchado para que **comparar cadenas sea comparar
versiones** (y para que ordenar la columna en la hoja no engañe).

Es un reloj *lógico* y no una marca de tiempo porque cada dispositivo tiene su propia hora: con marcas
a secas, un móvil atrasado perdería *siempre*. El reloj se pone al día con **los dos lados** antes de
emitir nada.

Y tiene **tope de cinco minutos** hacia el futuro, en los dos lados. La columna está visible y sin
proteger: alguien puede teclear el año 3000, o arrastrarla al ordenar. Sin tope, esa fila ganaría para
siempre **y envenenaría el reloj de todos los dispositivos** al leerla.

## Lo que hace una persona en la hoja

Cinco detecciones, todas en el adaptador (`infrastructure/sheets/remote-registros.ts`). Sin ellas la
edición manual se pierde en silencio:

1. **Editó el JSON** → se recalcula la huella del contenido; si no coincide con la celda `huella`, lo
   tocó un humano (la app escribe contenido y huella **juntos**). Se le da versión de *ahora*, así que
   **gana**. Sin esto, la resolución por versión pisaría su corrección: quien edita un dato no
   actualiza la columna de versión.
2. **Borró una fila** → estaba en la base, no está en la hoja ⇒ lápida incondicional.
3. **Añadió una fila sin id** (con su JSON tecleado en `datos`) → se **adopta**: se le asigna identidad, se importa, y se le **escriben
   de vuelta** el id, la huella y la versión *en su propia fila* (sin moverla: el usuario la puso donde
   quería). Sin ese último paso el ciclo siguiente le inventaría otra identidad — un agregado nuevo
   cada dos minutos.
4. **Le cambió el id a una fila** → se le **devuelve el suyo**. Es el desenlace más silencioso de
   todos si no se corrige: el id viejo desaparece (⇒ se daría por borrado el agregado), el nuevo parece
   un alta, y todo lo que apuntaba al viejo queda colgando mientras la hoja parece perfecta. Se
   reconoce comparando el contenido **sin su id**, que es lo único que sobrevive al cambio.
5. **Escribió una versión imposible** → se re-estampa, y el conflicto queda marcado `restamped`.

> **Una fila sin id se conserva aunque tarde en adoptarse.** Al reescribir una pestaña se copian tal
> cual, y en su sitio, las filas que no tienen id — y también las que están en blanco. Quitar una fila
> vacía compactaría la tabla, y todo lo que hubiera debajo subiría un sitio: las posiciones que ese
> mismo ciclo acaba de resolver apuntarían a la fila del vecino.

## La regla que evita la tormenta: huella vacía = adoptar

Una fila **sin huella** es una fila que este motor nunca escribió: o la hoja es anterior a que
existiera la columna, o la añadió una persona. En los dos casos se **adopta** y la comparación normal
decide después.

Sin esta regla, el primer ciclo contra una hoja que ya existía vería *todas* las filas sin huella, las
tomaría por ediciones manuales, les pondría versión nueva a todas, y a la vez las vería como cambios
locales porque la base está vacía: el catálogo entero colisionaría en el mismo ciclo y se resolvería
por desempate de dispositivo, o sea **al azar**.

## El ciclo

Siempre **bajar → decidir → subir**. Nunca se sube a ciegas: subir sin haber leído es lo que pisa el
trabajo de otro dispositivo.

1. **Puerta**: ¿credenciales? ¿hoja? Si no, para.
2. **Leer los dos lados a la vez**: la hoja entera en dos peticiones, la base, las tablas locales y la
   identidad del dispositivo.
3. **Comprobar que la hoja sigue siendo la de la cuenta** (ver abajo).
4. **Traducir** cada pestaña a los registros que el motor entiende, resolviendo aquí todo lo que una
   persona pudo hacer en la hoja.
5. **Barreras**: si algo no cuadra, no se toca nada — ni aquí ni allí.
6. **Decidir**, tabla por tabla, con el motor genérico.
7. **Bajar** lo que ganó la hoja, con **una transacción por tabla**.
8. **Subir** lo que ganó aquí, todo en **una sola escritura**.
9. **Apuntar la base** con lo que ya está confirmado en los dos lados.

El 7 antes que el 8 importa: si se subiera primero y el proceso muriera, la hoja tendría cambios que
aquí no están y la base no lo sabría. Y el 9 al final, por la misma razón: la base es el **ancestro**
del ciclo siguiente, y un ancestro que describe una escritura que no ocurrió hace que el motor
atribuya al destino cambios que fueron locales — perdiéndolos en silencio.

### La hoja puede cambiar entre el paso 2 y el 8

Entre bajar y escribir hay `await`s, y en ese hueco la hoja de la cuenta **puede dejar de ser la
misma**: la pantalla de cuenta la reemplaza cuando la anterior ya no está (borrada, en la papelera, o
porque el usuario pidió otra), y al conectar se dispara un ciclo en paralelo. Así que el ciclo
comprueba, después de leer y antes de escribir, que la hoja sigue siendo la de la cuenta; si no, **se
descarta sin escribir nada** y quien lo pidió recibe un ciclo nuevo contra la hoja nueva.

Sin eso, el ciclo escribía en la hoja abandonada y dejaba la base describiendo filas que la hoja nueva
no tiene — y entonces el tope de borrado masivo abortaba **todos** los ciclos siguientes. Por eso,
además, **reemplazar la hoja vacía la base**.

## Las barreras

Un ciclo se **niega a seguir entero** —sin aplicar ni escribir nada— en dos casos:

| Barrera | Por qué |
|---|---|
| Falta una pestaña **que la base conocía** | «No hay filas» + «lo que no está, se borró» = borrar la tabla entera en todos los dispositivos. Un clic derecho en «Eliminar hoja» no puede costar eso. Una pestaña que nunca existió no cuenta: la crea la primera escritura |
| La **cabecera** no es la nuestra | Con seis columnas fijas, comprobarlo es comparar. Una pestaña cuya cabecera no coincide no se toca: sus filas no se pueden interpretar, y escribir sobre ellas destruiría lo que haya puesto quien la tenga así |
| Se borrarían más de 20 filas o más del 30 % de una tabla | Una lectura a medias es indistinguible de un borrado real. El tope no distingue el accidente, pero convierte la pérdida total en una pregunta |

Un **id repetido** ya no aborta el ciclo: se pone en cuarentena **ese id** y el resto de la colección
sincroniza con normalidad. El motivo de la barrera (no se sabe cuál de las dos filas es la buena) se
cumple igual sin castigar al catálogo entero.

Y la barrera de «columna conocida que ha desaparecido» se fue con el esquema deducido: con una cabecera
fija, la comprobación es directa y no depende de lo que la base recuerde.

## Una celda mal escrita no atasca nada

Una fila que no se puede leer —una cantidad que no es un número, una celda de lista con un JSON roto—
se aparta y **no se sobrescribe nunca**: escribirle nuestro valor encima borraría el intento de
corrección de una persona. El resto de la tabla entra igual.

## El lote: un ciclo, una escritura

Todo lo que un ciclo escribe pasa por `infrastructure/sheets/sheet-write-batch.ts`, que lo descarga en
**tres peticiones como mucho**: una estructural (crear pestaña, ampliar, borrar filas), una de valores
con todos los rangos, y una de limpieza. Antes eran hasta cinco llamadas separadas.

Tres detalles que el lote resuelve, y que son la razón de que sea una pieza con nombre:

- **Solapamientos.** Un estampado que cae dentro de un bloque que también se reescribe se aplica sobre
  el bloque **en memoria**: nunca se mandan dos rangos que toquen la misma celda, porque cuál gana
  dependería del orden en que Google los aplique.
- **Troceo.** Lo que no cabe se parte por filas, y **se registra**: un lote partido en silencio parece
  atómico y no lo es.
- **Contenido y huella juntos**, siempre en el mismo rango de la misma petición. Es lo único que hace
  cierta la regla «la huella no cuadra ⇒ lo tocó una persona».

En local pasa lo mismo: bajar N filas es **una transacción por tabla**, no N. Además de costar N veces
menos, es atómico — una caída a la mitad no deja unas filas sí y otras no.

## Borrar desde la app

Se borra una receta desde su formulario y un insumo desde su fila de la lista; los dos **preguntan en
el sitio** antes.

- **Un insumo que una receta usa no se borra**: se dice qué receta lo usa.
- **Se borra con lápida, no se olvida**: el documento se queda con fecha de borrado y deja de
  entregarse. Es lo que permite que el borrado **viaje** — si desapareciera, sería indistinguible de
  «esto nunca llegó a este dispositivo» y el primer dispositivo desconectado lo resucitaría.
- **Las lápidas se tiran de la hoja a los ~90 días.**

## Cuándo se sincroniza

| Disparador | Cuándo |
|---|---|
| Arranque | Con plazo de 8 s: con conexión se trabaja sobre la hoja; sin ella, se entra con lo local |
| Cambio local | ~5 s después del último (se reinicia con cada cambio) |
| Intervalo | Cada N, configurable (`syncPollSeconds` en `public/config.json`, por defecto 120 s) |
| Foco, vuelve la conexión | Al recuperarlos |
| Entrar / reanudar sesión | Inmediato |

Todos los disparadores **ambientales** comparten un mínimo de 20 s. El culpable es el **foco**, que
salta en *cada* cambio de pestaña: alguien alternando 30 veces por minuto dispararía 30 ciclos, por
encima de las 60 peticiones/min que Google da por usuario, y vería «error» sin haber hecho nada raro.
Los **deliberados** (cambio local, reintento, botón) no pasan por ese mínimo. Un fallo espera cada vez
más (5 s → 5 min).

## Varias pestañas

`navigator.locks` reparte el turno: **solo una pestaña sincroniza**. Al acabar, avisa por
`BroadcastChannel` y las demás releen de IndexedDB. Sin esas APIs, **todas las pestañas trabajan**: es
el comportamiento anterior (más cuota, posible pisarse), no uno peor.

## La sesión caduca, y no es un error

El token de Google dura ~1 h y **en un navegador no hay refresh token** — es una propiedad de la
plataforma, no un defecto. Primero se intenta renovar en silencio; si no se puede, el estado pasa a
**`reconnect`** y no a `error`, porque lo que hay que hacer es distinto y no se ha roto nada.

## Límites aceptados (se documentan, no se arreglan)

- **No hay escritura condicional en Sheets.** Una escritura de otro dispositivo entre nuestra bajada y
  nuestra subida (~1–2 s) puede quedar pisada. El sistema se cura al ciclo siguiente, pero el valor
  intermedio se pierde. La garantía es **convergencia, no exclusión**.
- **El mismo campo, cambiado en los dos lados a valores distintos.** La fusión se aborta entera y
  decide la fecha: uno de los dos pierde. Fusionar ahí perdería un cambio en silencio, que es peor.
- **Una `version` forjada a mano dentro del margen de 5 min gana.** Las columnas están visibles a
  propósito.
- **La fusión es de campos de primer nivel.** Dos personas editando `amount` y `per.unit` del mismo
  precio ya no se mezclan: gana una. Es una pérdida de granularidad y a la vez una ganancia de
  seguridad — mezclarlos fabricaría un precio que **nadie escribió** (4,5 «por kilo» cuando uno dijo
  4,5 por 1000 g y el otro 9 por 1 kg).
- **La hoja deja de ser cómoda de editar.** Corregir un precio es editar el JSON de su celda. Sigue
  funcionando —la huella lo detecta y esa fila gana— pero deja de hacerse de un vistazo. Es el precio
  de que el tipo viaje con el dato.
- **Una celda de Sheets aguanta 50.000 caracteres.** De sobra para una receta; queda dicho por si algún
  día una tabla guarda documentos grandes.
- **Un campo cuyo valor es la cadena vacía vuelve como ausente.** Una hoja no distingue «la celda está
  vacía» de «este campo no está»; se elige la interpretación que no inventa datos.
- **Se reescribe la pestaña entera al subir**, no fila a fila. Es lo que la hace idempotente y conserva
  el orden de filas del usuario. A cientos o pocos miles de filas sobra; con decenas de miles habría
  que paginar.
- **Un borrado hecho aquí tarda hasta dos minutos en salir.** No publica evento, así que espera al
  ciclo siguiente. Nada se pierde — la lápida ya está en local.

## Diagnóstico

En `/cuenta` hay dos botones. **«Comprobar la hoja» solo lee**: es el mismo ciclo con la mitad de abajo
cortada, así que cuenta exactamente lo que haría sin tocar nada. Es lo primero que hay que pulsar
cuando algo no cuadra.

Con `"debug": true` en `public/config.json`, la consola trae el detalle:

| Lo que se ve | Qué significa |
|---|---|
| la hoja se reescribe sola cada dos minutos | El JSON canónico no es determinista. Es el fallo más grave; lo cubre `record-json.spec.ts` |
| un insumo desaparece del catálogo y sale `insumos legacy sin precio` | Un número llegó como texto. Con JSON no puede pasar; si pasara, el spec de ida y vuelta de `record-json` es el que lo caza |
| `el ciclo se ha negado a seguir` | Una barrera. El motivo dice qué pestaña o qué columna |
| `el lote no cupo en una petición y se partió` | La escritura **no fue atómica**: si falló el segundo trozo, el primero ya está escrito |
| `ids repetidos`, `filas ilegibles` | Lo que hay que arreglar **a mano** en la hoja |
| conflictos con `blind: true` | Se eligió sin saber cuándo se cambió aquí |
| conflictos con `restamped: true` | La versión de la hoja no era fiable y se re-estampó: ganó con una versión inventada |
| `demasiado pronto para otro ciclo` | El mínimo ambiental haciendo su trabajo. No es un fallo |

## Cómo se prueba

La decisión es pura y se prueba por unidad (`engine/reconcile.spec.ts` lleva un caso por regla). La
traducción de una pestaña —edición a mano, adopción, id devuelto, borrado a mano, fusión— tiene su
propio spec (`testing/infrastructure/sheets/remote-registros.spec.ts`), y el ciclo completo el suyo
(`testing/application/use-cases/synchronize-tables.use-case.spec.ts`).

Lo que **no** se puede probar así es el viaje completo del dato, porque hace falta una hoja al otro
lado: por eso la suite E2E trae un **doble de Google** —Identity Services, Sheets y Drive— servido
desde el propio test en [`e2e/support/google-double.ts`](../e2e/support/google-double.ts).

El doble emula a propósito los comportamientos de Sheets de los que depende el motor: `RAW`
convirtiendo `'2.5'` en el número `2.5`, el recorte de filas y celdas vacías al leer, la cuadrícula que
no crece sola, y el desplazamiento de filas al borrar una.

| Spec | Qué cubre |
|---|---|
| `e2e/specs/account/account.spec.ts` | Conectar crea la hoja y sube el recetario · la comprobación no encuentra nada que mover · el ciclo es **idempotente** · cerrar sesión · hoja en la papelera ⇒ se crea otra |
| `e2e/specs/account/sheet-authority.spec.ts` | Editar una celda a mano, marcar `borrado`, borrar una fila, teclear una fila sin id y cambiarle el id a otra |
| `e2e/specs/account/guard-rails.spec.ts` | Las barreras: borrado masivo, pestaña que falta, columna que desaparece — y que arreglar la hoja devuelve la convergencia |
| `e2e/specs/account/field-merge.spec.ts` | **La capacidad nueva**: renombrar aquí y repreciar en la hoja a la vez, y que sobrevivan los dos |
| `e2e/specs/sync-badge/sync-badge.spec.ts` | El aviso: no existe al día, aparece con un cambio sin subir, desaparece al volver la red |

Lo que sigue siendo comprobación a mano: dos navegadores contra la **misma hoja de verdad**.

## Dónde está cada cosa

| Pieza | Fichero |
|---|---|
| La decisión (sin red, sin IndexedDB, sin saber qué es una hoja) | `core/external-sync/domain/services/engine/` |
| El array de tablas y el ciclo | `…/application/use-cases/synchronize-tables.use-case.ts` |
| Las tablas de aquí | `…/domain/repositories/local.repository.ts` · `…/infrastructure/indexeddb-local.repository.ts` |
| Las tablas de la hoja | `…/domain/repositories/remote.repository.ts` · `…/infrastructure/sheets/google-sheets-remote.repository.ts` |
| Registro ⇄ celda (JSON canónico) | `…/infrastructure/sheets/record-json.ts` |
| La cabecera fija | `…/infrastructure/sheet-schema.ts` |
| Lo que hace una persona en la hoja | `…/infrastructure/sheets/remote-registros.ts` |
| Del plan a las escrituras | `…/infrastructure/sheets/plan-to-writes.ts` |
| El lote | `…/infrastructure/sheets/sheet-write-batch.ts` |
| Celdas de servicio y huella | `…/infrastructure/sheet-canonical.ts` · `sheet-hash.ts` |
| Ciclo de vida del fichero (crear, localizar, probar) | `…/infrastructure/google-sheets.gateway.ts` |
| Cuándo | `…/infrastructure/sync-scheduler.ts` |
| Pestañas del navegador | `…/infrastructure/web-locks-sync-coordinator.ts` |
| La base (ancestro y última fila conocida) | `…/domain/services/sync-shadow.ts` |
| El aviso | `components/sync-indicator/`, `features/sync-badge/` |
