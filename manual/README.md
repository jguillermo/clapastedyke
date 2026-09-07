# Manual técnico

Documentación **técnica** del proyecto: cómo funciona, por qué está hecho así y cómo se pone en
marcha. Aquí no hay nada de producto ni de negocio — eso vive en [`.claude/doc/`](../.claude/doc/)
(marca, historia, capítulos del juego, sistema de diseño como concepto).

## Documentos

| Documento | Qué es |
|---|---|
| [`firebase-deploy.md`](firebase-deploy.md) | **Cómo se publica.** Los ambientes (hoy `dev` y `prod`, un proyecto de Firebase cada uno) declarados cada uno en su *environment* de GitHub, dónde vive cada valor y cuál es secreto, el alta manual paso a paso, cómo añadir un ambiente nuevo y cómo lanzar el despliegue, que es manual a propósito. Incluye qué hace cada clave de `firebase.json` y el diagnóstico de los fallos típicos. |
| [`google-integration.md`](google-integration.md) | **El porqué.** Modelo mental de la integración con Google, las restricciones de la plataforma que la fuerzan (sin refresh token en un navegador, el alcance real de `drive.file`), las arquitecturas descartadas y los datos medidos que respaldan cada decisión. |
| [`functions.md`](functions.md) | **El backend.** La carpeta `firebase/functions`: un paquete npm independiente de la app (sus dependencias, su `tsc`, su ESLint), cómo se añade una función, por qué es un solo codebase, el desarrollo con el emulador, el despliegue manual y los cinco requisitos que el proyecto de Firebase tiene que cumplir ya. |
| [`sync-architecture.md`](sync-architecture.md) | **Cómo se mantienen iguales la app y la hoja.** Las tres copias y por qué no bastan dos, el reloj lógico y su tope, qué pasa cuando alguien edita la hoja a mano, las barreras que impiden que un clic derecho borre el catálogo, cuándo se sincroniza, los límites aceptados y qué mirar en la consola cuando algo no cuadra. |

## Documentación que NO está aquí, y por qué

Parte de la documentación técnica vive **junto al código que describe**, y ahí se queda: separarla la
condena a desactualizarse, porque nadie la ve al tocar el fichero de al lado.

| Documento | Qué cubre |
|---|---|
| [`src/app/components/README.md`](../src/app/components/README.md) | Catálogo vivo de la librería de componentes: qué existe, cómo se usa cada pieza y qué falta por construir. Se actualiza en el mismo commit que añade un componente. |
| [`src/app/core/_common/eventbus/README.md`](../src/app/core/_common/eventbus/README.md) | Especificación del bus de eventos: cola persistente, entrega *at-least-once*, y por qué los manejadores tienen que tolerar ejecutarse dos veces. |
| [`src/app/core/_common/logger/README.md`](../src/app/core/_common/logger/README.md) | El puerto de registro y su configuración. |
| [`firebase/functions/README.md`](../firebase/functions/README.md) | El contrato de la función `auth`: sus tres rutas, los códigos de error, cómo viaja la sesión (cookie + `session_token`), qué guarda en Firestore y los detalles de OAuth que cuesta deducir del código. |

> ### ⚠️ Falta un documento: el alta del cliente de Google
>
> Había un `firebase/README.md` con el mapa de la carpeta `firebase/` y, sobre todo, con **los pasos
> para crear el Client ID y el client secret** (proyecto de Cloud, pantalla de consentimiento,
> orígenes autorizados). **Ese fichero se borró y no se sustituyó**, así que ese procedimiento hoy no
> está escrito en ninguna parte. Lo que sobrevive, repartido:
>
> | Lo que sí está | Dónde |
> |---|---|
> | Dónde acaba cada mitad del cliente y en qué *environment* se declara | [`firebase-deploy.md`](firebase-deploy.md) |
> | Qué orígenes hay que registrar, y por qué son dos listas distintas | [`firebase-deploy.md`](firebase-deploy.md) |
> | Los detalles de OAuth que muerden (consentimiento «En producción», `invalid_grant`, `redirect_uri: postmessage`) | [`firebase/functions/README.md`](../firebase/functions/README.md) |
> | El porqué de la integración y las alternativas descartadas | [`google-integration.md`](google-integration.md) |
>
> Si alguien rehace ese procedimiento, este es el sitio: un documento nuevo en `manual/`, enlazado
> desde la tabla de arriba. Mientras no exista, **no enlaces `firebase/README.md`**.

Las **convenciones de código** son otra categoría y viven en
[`.claude/rules/`](../.claude/rules/), una por área (componentes, core/DDD, features, plataforma,
tests unitarios, E2E, mobile-first, registro, alias de imports…). Están ahí porque
[`CLAUDE.md`](../CLAUDE.md) las carga por ruta; moverlas rompería el sistema.

## Añadir un documento

Va aquí si describe **cómo funciona o cómo se opera algo del proyecto** y no tiene un fichero de
código evidente al lado: integraciones externas, decisiones de arquitectura, procedimientos de
despliegue, diagnóstico.

Va **junto al código** si describe una pieza concreta y se actualiza con ella.

Va en `.claude/rules/` si es una **regla** que hay que seguir al escribir código, no una explicación.

En todos los casos: enlázalo desde la tabla de arriba y, si es un punto de entrada, desde el
[`README.md`](../README.md) de la raíz.
