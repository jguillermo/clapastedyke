# Manual técnico

Documentación **técnica** del proyecto: cómo funciona, por qué está hecho así y cómo se pone en
marcha. Aquí no hay nada de producto ni de negocio — eso vive en [`.claude/doc/`](../.claude/doc/)
(marca, historia, capítulos del juego, sistema de diseño como concepto).

## Documentos

| Documento | Qué es |
|---|---|
| [`firebase-deploy.md`](firebase-deploy.md) | **Cómo se publica.** Los ambientes (hoy `dev` y `prod`, un proyecto de Firebase cada uno) declarados en un único `deploy/firebase/environments.json` (que además genera `public/config.json`), dónde vive cada valor y cuál es secreto, el alta manual paso a paso, cómo añadir un ambiente nuevo y cómo lanzar el despliegue, que es manual a propósito. Incluye qué hace cada clave de `firebase.json` y el diagnóstico de los fallos típicos. |
| [`google-setup.md`](google-setup.md) | **El cómo.** Lo que hay que montar una vez para que la integración con Google Sheets funcione: proyecto de Cloud, pantalla de consentimiento, Client ID y la única clave de `config.json`. Incluye la lista de comprobación y el diagnóstico de fallos. La hoja de cada usuario la crea la app sola. |
| [`google-integration.md`](google-integration.md) | **El porqué.** Modelo mental de la integración con Google, las restricciones de la plataforma que la fuerzan (sin refresh token en un navegador, el alcance real de `drive.file`), las arquitecturas descartadas y los datos medidos que respaldan cada decisión. |
| [`sync-architecture.md`](sync-architecture.md) | **Cómo se mantienen iguales la app y la hoja.** Las tres copias y por qué no bastan dos, el reloj lógico y su tope, qué pasa cuando alguien edita la hoja a mano, las barreras que impiden que un clic derecho borre el catálogo, cuándo se sincroniza, los límites aceptados y qué mirar en la consola cuando algo no cuadra. |

## Documentación que NO está aquí, y por qué

Parte de la documentación técnica vive **junto al código que describe**, y ahí se queda: separarla la
condena a desactualizarse, porque nadie la ve al tocar el fichero de al lado.

| Documento | Qué cubre |
|---|---|
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
