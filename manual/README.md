# Manual técnico

Documentación **técnica** del proyecto: cómo funciona, por qué está hecho así y cómo se pone en
marcha. Aquí no hay nada de producto ni de negocio — eso vive en [`.claude/doc/`](../.claude/doc/)
(marca, historia, capítulos del juego, sistema de diseño como concepto).

## Documentos

| Documento | Qué es |
|---|---|
| [`firebase-deploy.md`](firebase-deploy.md) | **Cómo se publica.** Los ambientes (hoy `dev` y `prod`, un proyecto de Firebase cada uno) declarados en un único `deploy/environments.json` (de donde se copia todo lo generado, que ya no se versiona), dónde vive cada valor y cuál es secreto, el alta manual paso a paso, cómo añadir un ambiente nuevo y cómo lanzar el despliegue, que es manual a propósito. Incluye qué hace cada clave de `firebase.json` y el diagnóstico de los fallos típicos. |
| [`google-integration.md`](google-integration.md) | **El porqué.** Modelo mental de la integración con Google, las restricciones de la plataforma que la fuerzan (sin refresh token en un navegador, el alcance real de `drive.file`), las arquitecturas descartadas y los datos medidos que respaldan cada decisión. |
| [`api.md`](api.md) | **El backend.** La carpeta `api/`, su regla de organización (una carpeta = un paquete = un despliegue independiente), cómo se comparte `api/_common/` sin bundler, cómo se añade una función, el desarrollo con el emulador y el despliegue manual por función. |
| [`sync-architecture.md`](sync-architecture.md) | **Cómo se mantienen iguales la app y la hoja.** Las tres copias y por qué no bastan dos, el reloj lógico y su tope, qué pasa cuando alguien edita la hoja a mano, las barreras que impiden que un clic derecho borre el catálogo, cuándo se sincroniza, los límites aceptados y qué mirar en la consola cuando algo no cuadra. |

## Documentación que NO está aquí, y por qué

Parte de la documentación técnica vive **junto al código que describe**, y ahí se queda: separarla la
condena a desactualizarse, porque nadie la ve al tocar el fichero de al lado.

| Documento | Qué cubre |
|---|---|
| [`deploy/README.md`](../deploy/README.md) | **La carpeta que publica.** El mapa de `deploy/` (el único sitio del repo que conoce Firebase), la forma de `environments.json` —`front`/`back`/`secretos`, qué significa `destino`, por qué el Client ID está escrito dos veces—, qué hace cada script, cómo se compila y se sube, a dónde va cada secreto, y las tres cosas que parecen errores y no lo son. Incluye **los pasos para crear el Client ID y el client secret de Google**, el **único** sitio con ese procedimiento. |
| [`api/auth/README.md`](../api/auth/README.md) | **La función `auth`**: sus tres rutas, qué guarda en Firestore y qué nunca sale de ahí, su configuración, y los cinco detalles de OAuth que cuesta deducir leyendo el código (`redirect_uri: 'postmessage'`, el refresh token que Google no reemite, `invalid_grant`, la pantalla de consentimiento en producción). |
| [`src/app/components/README.md`](../src/app/components/README.md) | Catálogo vivo de la librería de componentes: qué existe, cómo se usa cada pieza y qué falta por construir. Se actualiza en el mismo commit que añade un componente. |
| [`src/app/core/_common/eventbus/README.md`](../src/app/core/_common/eventbus/README.md) | Especificación del bus de eventos: cola persistente, entrega *at-least-once*, y por qué los manejadores tienen que tolerar ejecutarse dos veces. |
| [`src/app/core/_common/logger/README.md`](../src/app/core/_common/logger/README.md) | El puerto de registro y su configuración. |

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
