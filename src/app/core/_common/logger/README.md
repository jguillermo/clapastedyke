# Logger (`@core/_common/logger`)

El **único** camino por el que este proyecto escribe en la consola. Nada más llama a `console`: lo
impone ESLint con una excepción declarada por ruta, así que no se puede saltar con un
`eslint-disable` suelto.

Es un puerto con un adaptador, como el `EventBus`. Cambiar a dónde van los registros —un panel dentro
del juego, un fichero, un servicio remoto— es escribir otro adaptador y tocar una línea de
`provideLogger()`.

> La regla que dice **qué** registrar (y qué no) vive en
> [`logging-conventions.md`](../../../../../.claude/rules/logging-conventions.md). Este README explica
> **cómo funciona la pieza**.

---

## Cuatro niveles y una sola decisión

```
error · warn · info    se ven SIEMPRE, en cualquier despliegue
debug                  se ve si public/config.json dice "debug": true
```

Eso es todo lo que hay que saber. **No hay umbral de nivel, ni interruptor de runtime, ni estado
guardado en el navegador**: el registro se comporta igual en la máquina de todo el mundo y lo que ves
depende solo del fichero de configuración que esté servido.

| `"debug"` en `public/config.json` | `debug` | `info` · `warn` · `error` |
|---|---|---|
| `true` (lo que trae el repo) | **se ve** | se ven |
| `false` o ausente | no se emite | **se ven** |
| el fichero no se puede leer | no se emite (+ un `warn` que lo dice) | **se ven** |

`debug` es la única llave porque es el único nivel que sobra fuera de desarrollo: es el detalle del
flujo. Los otros tres cuentan algo que hay que saber igual en la máquina de un usuario.

### Por qué un fichero servido y no un interruptor de consola

Hubo una versión con un `migoLog` en `window` y la posición guardada en `localStorage`. Se quitó, y
por dos motivos:

- **El registro dependía del navegador.** Uno lo tenía encendido, otro no, y el que acababa de clonar
  el proyecto no veía ninguna de las ~170 trazas que la regla obliga a poner. «Esto no registra» y
  «no lo he encendido» se veían exactamente igual — justo lo que el registro venía a evitar.
- **Era configuración escondida.** La configuración del proyecto vive en ficheros que se leen y se
  revisan, no en un global que hay que descubrir y en una clave de `localStorage`.

Y tampoco es un flag de build: **el build es uno solo**. Cambiar lo que se ve en un despliegue es
editar el `config.json` que está servido a su lado y recargar — sin recompilar, sin republicar, y sin
que el artefacto que corre deje de ser el que se probó.

---

## Las piezas

| Fichero | Qué es |
|---|---|
| `logger.ts` | El **puerto**: `Logger` abstracto, `LogLevel`, `LogContext` |
| `console-logger.ts` | El **adaptador** sobre la consola. **Único fichero del repo con `console.*`** |
| `logger.providers.ts` | `provideLogger(debug)` — va **el primero** en `app.config.ts` |
| `public/config.json` | La **única** configuración: `"debug": true \| false` |

Cuatro ficheros y ninguno más: **no hay doble de test, ni interruptor, ni almacén de líneas.**

Vive en el shared kernel —junto al `EventBus`— y **no** en `platform/`, porque `core/` también
registra y no puede importar de `platform/`. La dependencia inversa sí vale, así que la grieta se
abre en el lado de `platform/` (glob negativo en `eslint.config.mjs`).

---

## Cómo se usa

```typescript
private readonly log = inject(Logger).scoped('recipe-book/save-recipe');

this.log.debug('guardando receta', { id, ingredientes: lines.length });
this.log.warn('no se pudo sembrar la receta', error, { id });
this.log.error('no se pudo leer el catálogo', error);
```

`scoped()` prefija y **encadena**: `this.log.scoped('drain')` → `[3d/book][drain]`. El scope sigue
`área/pieza`, que es lo que hace la consola grepeable por los dos extremos.

### La firma es asimétrica a propósito

```typescript
debug(message: string, context?: LogContext): void;
info (message: string, context?: LogContext): void;
warn (message: string, cause?: unknown, context?: LogContext): void;
error(message: string, cause?: unknown, context?: LogContext): void;
```

`debug` lleva **datos**; `warn`/`error` llevan **la cosa que falló**, en su propia ranura. No es
cosmética: si el error va dentro del objeto de contexto, devtools lo pinta como una propiedad anidada
y **se pierden los frames pinchables y la cadena `cause`**. En su ranura, el adaptador lo pasa como
argumento suelto y el navegador lo despliega entero.

De paso, la asimetría mete la regla en el sistema de tipos: una revisión ve la infracción sin leer el
cuerpo.

```typescript
this.log.error('no se pudo guardar', { error, id });  // MAL — anidado, sin pila navegable
this.log.error('no se pudo guardar', error, { id });  // BIEN
```

### Cuándo `info` y no `debug`

`info` es un hito del que hay que dejar constancia **también fuera de desarrollo**, sin que nada vaya
mal. Como se ve siempre, se paga en la consola del usuario: úsalo con cuentagotas.

| | |
|---|---|
| `debug` | Solo interesa mientras desarrollas → se apaga en el `config.json` del despliegue |
| `info` | Hay que poder reconstruirlo en la máquina de un usuario, aunque todo fuera bien |
| `warn` | El usuario recibió menos de lo que pidió y no se entera |
| `error` | Invariante rota |

Ante la duda, `debug`. Un `info` por cada paso de un flujo convierte la consola de producción en
ruido, y entonces el `warn` que importa se pierde entre ellos.

---

## Qué garantiza

| Garantía | Cómo |
|---|---|
| Siempre hay una pila | `toError()` envuelve lo que no sea `Error` conservando el valor en `cause`; `error()` sin causa se sintetiza una |
| La cadena `cause` se ve entera | **No se aplana**: el navegador ya la despliega, y aplanarla perdería los frames pinchables |
| Un error en producción deja rastro | `error`/`warn`/`info` no tienen compuerta: no hay configuración que los apague |
| Lo que se ve no depende del navegador | La única llave es `"debug"` del fichero servido; nada se guarda en el cliente |
| Nada se cuela por fuera | `no-console: error` en todo el repo, con excepción por ruta solo para `console-logger.ts` |
| Lo no capturado también pasa por aquí | `GlobalErrorHandler` (`platform/error/`) lo saca con scope `[uncaught]` |

**El único hueco, y es inevitable:** el fallo de **arranque** ocurre antes de que exista el inyector,
así que no hay `Logger` que inyectar. Lo recoge `logBootstrapFailure()`, exportado desde
`console-logger.ts` y llamado desde `main.ts`. Registra siempre, también en producción: si eso pasa,
no hay aplicación.

---

## La configuración

Un booleano, en el fichero que ya configura el despliegue. **No hay nada más que configurar.**

```jsonc
// public/config.json — servido al lado del bundle, editable sin recompilar
{
  "debug": true,          // ¿se ve el detalle del flujo? Ausente = false
  "googleClientId": ""
}
```

El camino, de punta a punta:

```
main.ts  readConfigDocument()            ← fetch, ANTES de bootstrapApplication
   ↓
app.config.ts  appConfig(document)
   ↓
provideLogger(document?.debug === true)  → { provide: LOG_DEBUG, useValue: … }
   ↓
ConsoleLogger  inject(LOG_DEBUG)         ← un booleano; no conoce el fichero
```

**Se lee antes de arrancar**, y no en un app-initializer, porque los initializers corren en paralelo:
el bus, el seed o el mundo 3D podían registrar antes de que se supiera si `debug` está encendido, y se
perderían justo las trazas del arranque. Ese fue un fallo real.

**El `Logger` no importa `AppConfig`.** Recibe un booleano por el token `LOG_DEBUG` (defecto `false`),
así que se puede montar en un test sin arrastrar la configuración entera — y no hay ciclo con el
adaptador de configuración.

Si el fichero falta o es ilegible, `document` es `null`: `debug` apagado, integración apagada, y un
`warn` que lo dice.

---

## Comprobar que los eventos están llegando

`provideEventTracing()` engancha `TraceEvents`, que registra en `debug` **todos** los nombres del
Published Language, y el repartidor cuenta a quién le llegó cada uno:

```js
// con `ng serve` ya salen; solo hay que usar la app
// [events] RecipeSaved                      { aggregateId: 'rec-9', occurredOn: '…', data: { … } }
// [eventbus/dispatcher] RecipeSaved → external-sync   { aggregateId: 'rec-9' }
// [eventbus/dispatcher] RecipeSaved no lo escucha nadie
```

Esa última línea es la que faltaba: **un evento sin suscriptor es invisible** —se publica, se encola
y se entrega a nadie—, así que «no se publicó» y «no lo escucha nadie» se veían igual. Ver
[`../eventbus/README.md`](../eventbus/README.md).

---

## Tests

**No hay doble de logger, ni lo va a haber.** El `Logger` escribe cuando lo llaman y punto: no
guarda, no acumula, no se puede consultar. Un doble que grabe sería una segunda implementación que
mantener y un motivo para escribir tests que aserten sobre prosa.

- **Todo `TestBed` que instancie algo que registre necesita un `Logger`**, o revienta con
  `NullInjectorError`. Se enchufa el **adaptador real**:

  ```typescript
  providers: [{ provide: Logger, useClass: ConsoleLogger }];
  ```

  Ya viene en `recipe-book-test-doubles.ts`, `external-sync-test-doubles.ts` y `auth-test-doubles.ts`.
  El token `LOG_DEBUG` vale `false` por defecto, así que la traza del flujo no ensucia la salida de
  los tests; lo que se ve es un `warn` o un `error`, que conviene leer.

- **Un test no asserta sobre lo que se registró.** Se comprueba el efecto: el repositorio doble, el
  evento publicado, el valor devuelto. Si lo único que hace una clase es registrar, lo que hay que
  arreglar es la clase, no el test.

  La excepción son las dos piezas cuyo **único** efecto es registrar —`TraceEvents` y los
  `Notify*` de `external-sync`, que hoy son placeholders del envío remoto—. Sus specs llevan un
  `LogSpy` **definido en el propio fichero**, que no sale de ahí.

---

## Escribir otro adaptador

1. Implementa `Logger` (cinco miembros: `debug`, `info`, `warn`, `error`, `scoped`).
2. Cambia la línea de `logger.providers.ts`.
3. Nada más. Ningún sitio del código llama a `console` ni conoce el adaptador.

> Si el destino nuevo necesita la cadena `cause` aplanada (un servicio remoto, p. ej.), eso es trabajo
> **suyo**: el adaptador de consola no la aplana a propósito.
