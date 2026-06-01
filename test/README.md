# Pruebas

Dos carpetas:

## `unitarios/` — tests automáticos en Node (sin Google)
Corren todo el código de `src/` (los `.js` del servidor y el JS embebido en los
`.html`) bajo mocks de Google Apps Script.

```bash
npm test          # o: node test/unitarios/run.js
```

Cómo está armado:
- `helpers/mockGas.js` — spreadsheet en memoria + globales de GAS (SpreadsheetApp,
  LockService, Session, Utilities, ScriptApp). Las **fórmulas no se evalúan** (se
  guardan como texto); por eso, para probar cálculos que en la hoja real son
  fórmula (p. ej. precio por unidad base) se siembran números directamente.
- `helpers/mockBrowser.js` — `document`, `google.script.run`, `window` mínimos para
  cargar el `<script>` de los formularios.
- `helpers/loader.js` — carga `src/*.js` en un contexto `vm` (estilo GAS: scope
  global compartido), extrae el `<script>` de los `.html`, y siembra hojas.
- `helpers/microtest.js` — micro framework (test/assert/run), sin dependencias.
- `*.test.js` — un archivo por área. `run.js` los corre todos.

Para añadir un test: crea `algo.test.js` aquí; `run.js` lo toma solo.

## `e2e/` — despliegue a un proyecto de prueba + guion manual
- `.env` (en la raíz, copiado de `.env.example`) — los Script ID por entorno:
  `SCRIPT_ID_PROD` y `SCRIPT_ID_TEST`.
- `publish.js` — lee el `.env`, escribe SOLO el `scriptId` en `src/.clasp.json`
  (sin tocar lo demás) y corre `npm run push`.

```bash
npm run publish:test   # despliega al proyecto/hoja de PRUEBA
npm run publish:prod   # despliega a PRODUCCIÓN
```

- `flujos.txt` — guion paso a paso de TODOS los flujos del sistema, en orden de
  dependencia (desde una hoja en blanco), con qué hacer y qué comprobar. Pensado
  para ejecutarlo en el navegador sobre la hoja de prueba después de `publish:test`
  e **Instalar o reparar**.

> Requisito e2e: tener un proyecto Apps Script de prueba (enlazado a OTRA hoja),
> con su Script ID en `.env -> SCRIPT_ID_TEST`, y haber hecho `clasp login`.
