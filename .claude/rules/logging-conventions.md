# Logging Conventions

Applies to **todo el código de la app** que registra: `src/app/core/`, `src/app/features/` y
`src/app/platform/`. El puerto vive en `src/app/core/_common/logger/`.

> **Regla dura.** Nada llama a `console`. Se registra por el puerto `Logger`, **siempre**, y hay que
> poner un `debug` en cada paso importante de cada flujo. `warn` y `error` **se ven siempre, también
> en producción**, y llevan la traza del error.

## CRITICAL: quién registra y quién no

| Capa | Registra | Por qué |
|---|---|---|
| `core/` (los tres contextos y `_common/`) | **Sí** | Es donde ocurre el negocio |
| `features/` | **Sí** | Es donde empieza y acaba lo que hizo el usuario |
| `platform/` | **Sí** | Excepción de import documentada en [platform-conventions.md](platform-conventions.md) |
| **`components/`** | **NUNCA** | La librería de diseño **no importa nada de la app**, y el `Logger` es de la app. Un `migo-button` no tiene nada que contar: el flujo se ve desde la feature que lo usa. Ver [components-conventions.md](components-conventions.md) |

El puerto vive en `core/_common/` —junto al `EventBus`— y no en `platform/` porque **`core/` también
registra y no puede importar de `platform/`**. La dependencia inversa sí es posible, y por eso
`eslint.config.mjs` abre una grieta explícita para `@core/_common/logger` en el bloque de `platform/`.

## Los tres niveles

```typescript
private readonly log = inject(Logger).scoped('recipe-book/save-recipe');

this.log.debug('guardando receta', { id, ingredientes: lines.length });
this.log.warn('no se pudo sembrar la receta', error, { id });
this.log.error('no se pudo leer el catálogo', error);
```

| Nivel | Cuándo | Visibilidad |
|---|---|---|
| `debug` | El detalle del flujo: cada paso importante | **Si `public/config.json` dice `"debug": true`** |
| `info` | Un hito que hay que poder reconstruir también fuera de desarrollo | **Siempre**, también en producción |
| `warn` | Degradación: el usuario recibe menos de lo que pidió y no se entera | **Siempre**, también en producción |
| `error` | Invariante rota, algo falló de verdad | **Siempre**, también en producción |

**`info` se usa con cuentagotas.** Se ve siempre, así que se paga en la consola del usuario: solo va
ahí lo que haya que poder reconstruir en su máquina aunque todo fuera bien. Si solo interesa mientras
desarrollas, es `debug`; si el usuario recibió menos de lo que pidió, es `warn`. **Ante la duda,
`debug`**: un `info` por paso convierte la consola de producción en ruido y entierra el `warn` que
importa.

### La firma es asimétrica a propósito

`debug` lleva **datos**; `warn` y `error` llevan **la cosa que falló**, en su propia ranura:

```typescript
debug(message: string, context?: LogContext): void;
info (message: string, context?: LogContext): void;
warn (message: string, cause?: unknown, context?: LogContext): void;
error(message: string, cause?: unknown, context?: LogContext): void;
```

No es cosmética. Meter el error dentro del objeto de contexto lo degrada a propiedad anidada: la
consola lo pinta como texto plano y **se pierden los frames pinchables y la cadena `cause`**. Con la
ranura propia, el adaptador lo pasa como argumento suelto y devtools lo despliega entero.

Y de paso mete la regla en el sistema de tipos: una revisión ve la infracción sin leer el cuerpo.

```typescript
// MAL — el error acaba anidado y sin pila navegable
this.log.error('no se pudo guardar', { error, id });

// BIEN — el error en su ranura, el dato en la suya
this.log.error('no se pudo guardar', error, { id });
```

## CRITICAL: un `catch` nunca es mudo

Un `catch` vacío, o que solo pinta un mensaje en pantalla, **borra la única pista** de por qué algo
no funcionó. Cada `catch` hace **una** de estas dos cosas:

1. **Registra** con el error capturado en la ranura de causa, o
2. **relanza** (y entonces lo registra quien decide qué ve el usuario).

**Un mensaje de error en pantalla NO sustituye al registro.** El usuario ve una frase amable; el
registro conserva la cadena entera con su pila.

```typescript
// MAL — la causa desaparece
} catch {
  this.errorMessage.set('No se pudo guardar la receta.');
}

// BIEN — se conserva la causa Y se informa al usuario
} catch (error) {
  this.log.warn('no se pudo guardar la receta', error, { editando });
  this.errorMessage.set('No se pudo guardar la receta.');
}
```

### Un dueño por fallo

Registrar el mismo fallo tres veces es tan malo como no registrarlo: la consola se llena de ecos y
no se sabe cuál es el de verdad.

- La capa que **traduce y relanza** (mappers, transportes, `IndexedDbStore`) **no registra**: conserva
  el fallo original en `{ cause }` del error que lanza.
- La capa que **decide el resultado visible** (marca un estado, pinta un mensaje, publica un evento
  de fallo) lo registra **una sola vez**, con la cadena entera.

```typescript
// infrastructure/apps-script-endpoint.ts — traduce y calla, pero NO pierde la causa
throw new SyncError('NETWORK', 'No se ha podido contactar…', { cause: error });

// application/synchronize.use-case.ts — decide, y AQUÍ se registra una vez
this.log.warn('sincronización fallida, los cambios vuelven a la cola', error, { code });
```

## CRITICAL: un `void promesa` lleva su `catch`

Una promesa flotante que se rompe es un rechazo no capturado: no lo ve nadie salvo el
`GlobalErrorHandler`, y sin scope no se sabe de dónde salió.

Dos formas válidas, en este orden de preferencia:

```typescript
// 1. MEJOR — el método absorbe su propio fallo, y entonces `void` es honesto
private async load(): Promise<void> {
  try { … } catch (error) { this.log.error('no se pudo leer el catálogo', error); }
}
void this.load();   // ya no puede rechazar

// 2. Si no, un `.catch` explícito en la llamada
this.engine.flyIn().catch((error: unknown) => this.log.error('la entrada ha fallado', error));
```

La primera es mejor cuando el método se llama desde varios sitios: un solo dueño del fallo en vez de
siete `catch` que hay que acordarse de poner.

## Qué merece un `debug` — las nueve categorías

La instrucción es poner un `debug` en cada paso importante **para poder saber si un flujo funciona o
no sin tocar el código**. Estas nueve categorías son la lista revisable. Cada una es una pregunta de
sí/no que se responde sin leer la implementación.

**1. Arranque y composición.** Una línea por app-initializer: qué hizo y cómo se resolvió.
El dato decisivo como **booleano o cuenta**, nunca el valor.
> `config/public-file` → `debug('configuración cargada', { appsScript: true, oauth: false })`

**2. Caso de uso: entrada + una salida por rama.** Un `debug` al entrar con los discriminantes de la
petición, y **uno por cada `return`**, nombrando la rama.
> El caso bandera es `Synchronize.execute`: tiene cinco salidas. Sin esto, desde fuera «no había nada
> pendiente» y «la sesión caducó» se ven exactamente igual.

**3. Repositorio: escritura siempre; lectura solo si agrega.**
> `supply-repo` → `debug('insumo guardado', { id })` y `debug('insumos leídos', { count })`.
> **`byId()` NO se registra**: el seed lo llama una vez por ingrediente y ahogaría la consola.

**4. Evento publicado y entregado.** Publicar lo cubre `TraceEvents` (`[events]`); la entrega la
cubre el dispatcher, **incluido el caso de que no lo escuche nadie**.
> `[eventbus/dispatcher] RecipeSaved no lo escucha nadie` — sin esta línea, «no se publicó» y «no hay
> suscriptor» son indistinguibles.

**5. Acción de feature: empezada y terminada.** Solo si **invoca un caso de uso o cambia estado
persistido**.
> `ui/recipe-form` → `debug('guardar receta ▶', { editando, lineas })` … `debug('guardar receta ✔', { id })`.
> **Nunca** abrir/cerrar un diálogo, foco, scroll, hover, swipe.

**6. Ciclo de vida del motor 3D.** Construcción, `setPages`, pausa, reanudación, dispose, WebGL
ausente. **Nunca por frame.**

**7. Llamada externa.** El límite, el resultado y la **forma**; nunca el cuerpo, nunca el token.
> `external-sync/apps-script` → `debug('POST upsert ▶', { requestId, filas })` / `debug('POST upsert ✔', { aplicadas })`.

**8. Degradación silenciosa → `warn`, no `debug`.** Si el usuario recibe menos de lo que pidió y no
se entera, es un `warn`.
> `config.json` ilegible, insumos legacy que se omiten del catálogo, WebGL que falla y cae al DOM,
> una autorización que no se pudo retirar.

**9. Invariante rota → `error`.** Lo no capturado (`[uncaught]`), una entrega de evento que falla,
un rechazo de IndexedDB.

### Qué NO se registra — la lista dura

1. **Nada por frame, por pulsación de tecla, por `valueChanges` ni por movimiento de puntero.**
   `supply-grid.recomputeCosts()` y `price-capture.recompute()` corren en **cada tecla**: solo
   registran si fallan.
2. **`components/`**, jamás. Sin excepciones.
3. **Getters, mappers, funciones puras y value objects.** `Quantity.of`, `*.mapper.ts`, `toPages`.
4. **Datos personales y secretos.** Nunca el token, nunca el `clientId`, nunca la URL del Apps
   Script, nunca el correo — registra `account.id.value` y booleanos (`{ oauth: true }`).
5. **Payloads íntegros.** Cuentas, no contenidos: `{ count: 42 }`, no las 42 filas. **Única excepción
   documentada**: `TraceEvents`, que es la herramienta de diagnóstico y solo existe en desarrollo.
6. **El mismo fallo dos veces** (ver «un dueño por fallo»).
7. **Dentro de `computed()` y `effect()`**, ni el camino feliz. Se reevalúan solos; el fallo sí.
8. **Un `debug` que solo repite el de la línea de arriba.** Si la entrada y la salida llevan el mismo
   dato, quédate con la salida.

## Convención de scopes — `área/pieza`

```typescript
private readonly log = inject(Logger).scoped('recipe-book/save-recipe');
// → [recipe-book/save-recipe] receta guardada { id: 'rec-9' }
```

Grepeable por los dos extremos: filtra la consola por `[recipe-book/` para un contexto entero, o por
`/save-recipe]` para una clase. `scoped()` encadena dentro de una clase: `[3d/book][drain]`.

| Área | De dónde sale | Piezas de ejemplo |
|---|---|---|
| `recipe-book` | `core/recipe-book/**` | `list`, `save-recipe`, `save-supply`, `save-property`, `seed`, `supply-repo`, `recipe-repo`, `export` |
| `auth` | `core/auth/**` | `sign-in`, `sign-out`, `google`, `settings-repo`, `credentials` |
| `external-sync` | `core/external-sync/**` | `synchronize`, `apps-script`, `outbox`, `on-auth-changed`, `on-book-changed` |
| `eventbus` | `core/_common/eventbus/**` | `bus`, `dispatcher` |
| `config` | `core/_common/infrastructure/config/**` | `public-file` |
| `ui` | `features/**` | `home`, `book`, `recipe-form`, `supply-list`, `supply-grid`, `price-capture`, `account` |
| `3d` | `platform/three/**` | `kitchen`, `book` |
| `viewport` | `platform/viewport/**` | — |

**Pieza** = el nombre de la clase en kebab-case, sin el sufijo de ceremonia:
`SaveRecipe` → `save-recipe` · `IndexedDbSupplyRepository` → `supply-repo` ·
`RecipeBookChangedSubscriber` → `on-book-changed`.

**Dos scopes de un solo segmento, a propósito:** `[events]` (el trazador — su formato está
documentado literal en `CLAUDE.md`) y `[uncaught]` (el handler global: no es de ningún área, es el
suelo).

## `platform/` y las clases planas

Los motores 3D **no son servicios**: la feature los instancia con `new`, fuera de todo contexto de
inyección. Reciben el logger **por constructor, obligatorio** — así el compilador garantiza que
ningún motor futuro se quede mudo.

```typescript
// features/game/home/home-3d.ts
this.engine = new KitchenEngine(canvas, this.reducedMotion, this.log.scoped('3d/kitchen'));
```

Lo mismo vale para cualquier clase plana de `core/` o `platform/`. Lo que **no** se hace nunca es un
logger global de módulo: sería una dependencia invisible, dependiente del orden de arranque e
imposible de doblar en un test.

## La única configuración: `"debug"` en `public/config.json`

`ng serve` y ya se ve todo: el arranque, el seed, los eventos y cada paso de cada flujo. **No hay que
encender nada**, ni en un navegador nuevo ni en un perfil nuevo — el repo trae `"debug": true`.

```jsonc
// public/config.json — el MISMO build lo lee en todos los entornos
{ "debug": true, "appsScriptUrl": "", "googleClientId": "" }
```

**No hay nada más que configurar**: ni `environment.ts`, ni umbral de nivel, ni interruptor en
`window`, ni estado en `localStorage`. Y **el build es uno solo**: para callar el detalle del flujo en
un despliegue se edita **su** `config.json` y se recarga; no se recompila, no se republica, y el
artefacto que corre sigue siendo el que se probó.

El camino es: `main.ts` → `readConfigDocument()` (antes de `bootstrapApplication`) →
`appConfig(document)` → `provideLogger(document?.debug === true)` → el token `LOG_DEBUG`, que es lo
único que ve el adaptador. **El `Logger` no importa `AppConfig`**: recibe un booleano y no sabe de
dónde salió.

Se lee antes de arrancar, y no en un app-initializer, porque los initializers corren en paralelo: el
bus o el seed podrían registrar antes de que se supiera si `debug` está encendido, y se perderían
justo las trazas del arranque.

## Tests

**No hay doble de logger, y no se añade uno.** El `Logger` escribe cuando lo llaman y nada más: no
guarda, no acumula, no se puede consultar.

- **Todo `TestBed` que instancie algo que registre necesita un `Logger`**, o revienta con
  `NullInjectorError`. Se enchufa el adaptador real:
  `{ provide: Logger, useClass: ConsoleLogger }`. Ya viene incluido en `recipe-book-test-doubles.ts`,
  `external-sync-test-doubles.ts` y `auth-test-doubles.ts`. El token `LOG_DEBUG` vale `false` por
  defecto, así que en un test solo se ve lo que conviene leer.
- **Un test no asserta sobre lo que se registró**: se comprueba el efecto (el repositorio doble, el
  evento publicado, el valor devuelto). Si lo único que hace una clase es registrar, lo que hay que
  arreglar es la clase.
  La excepción son las piezas cuyo **único** efecto es registrar (`TraceEvents`, los `Notify*` de
  `external-sync`): su spec lleva un `LogSpy` **definido en el propio fichero**, que no se comparte
  ni se exporta.
- `no-console` está apagado en specs y stories.

## Checklist antes de dar por terminado un fichero

- [ ] Cada `catch` registra con el error en la ranura de causa, **o** relanza.
- [ ] Ningún mensaje de error en pantalla se queda sin su registro.
- [ ] Cada `void promesa` no puede rechazar (el callee absorbe) o lleva su `.catch`.
- [ ] Cada caso de uso tiene un `debug` de entrada y **uno por cada rama de salida**.
- [ ] Cada escritura de repositorio deja rastro; ningún `byId()` lo deja.
- [ ] Ninguna degradación silenciosa se queda sin `warn`.
- [ ] Nada se registra por frame, por tecla, ni dentro de `computed()`/`effect()`.
- [ ] Ningún token, correo, `clientId` ni payload íntegro aparece en un registro.
- [ ] El scope sigue `área/pieza` y la pieza es el nombre de la clase.
- [ ] Si es un fichero de `components/`: **no registra nada**.