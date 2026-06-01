# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Google Apps Script (GAS) business management system for a small food business, deployed as a Google Sheets add-on. All logic runs server-side in GAS; the UI is HTML modal dialogs. The entire data store is a single Google Sheets spreadsheet — each sheet tab is a data table.

The codebase is written in Spanish.

## Deployment

There are no build steps, no npm, no tests. Development is push-based via [clasp](https://github.com/google/clasp).

```bash
# Push all files to the bound Apps Script project
cd src
clasp push

# Watch and push on change
clasp push --watch

# Open the Apps Script editor in the browser
clasp open
```

`src/.clasp.json` is gitignored (contains the script ID). To set it up locally, create `src/.clasp.json`:
```json
{
  "scriptId": "ID",
  "rootDir": ""
}
```

After pushing, test by opening the bound Google Sheets file and running **Sistema > Mantenimiento > Instalar o reparar**.

## Architecture

### Data layer — `Esquema.js`
Single source of truth for all sheet definitions. Each entry declares: `archivo` (ignored now — single-file system), `nombre`, `headers`, `numericas`, `moneda`, `seed`, `validaciones`. The installer reads this to create missing sheets, add missing columns, apply formatting, and seed default data.

`HOJA` is a global constant object with all sheet names — always use `HOJA.NOMBRE` instead of string literals.

### Core utilities — `Util.js`
All modules share these helpers:
- `leerHoja(nombre)` → reads a sheet as `{ headers, filas: [{_fila, col: value}] }`
- `agregarFila(nombre, obj)` → appends a row respecting column order
- `actualizarFila(nombre, numFila, obj)` → updates specific cells in an existing row
- `siguienteId(nombreHoja)` → generates the next human-readable ID (e.g. `P-0001`)
- `conBloqueo(fn)` → wraps any write in a GAS script lock (prevents double-submit)
- `auditar(accion, entidad, id, campo, antes, despues, detalle)` → writes to the AUDITORIA sheet
- `abrirModal(archivoHtml, titulo, ancho, alto)` → opens an HtmlService dialog from a `.html` file
- `getConfig()` / `getConfigValor(param)` → reads the Config sheet as a key-value map

### Server ↔ HTML bridge
HTML files use `google.script.run.withSuccessHandler(...).withFailureHandler(...).functionName(args)` to call server-side functions. Server functions that serve data to forms follow a naming pattern: `datosXForm()` to load initial data, `guardarX(payload)` to write, and `listarX()` to list.

### Module structure
Each domain has a `.js` + one or more `.html` files:

| Module | Responsibility |
|---|---|
| `Archivos.js` | `ssOperacion()`, `hoja()`, `hojaReq()`, `buscarDef()`, `nombreNegocio()` |
| `Esquema.js` | Schema definition, `HOJA` constants, `prefijoId()` |
| `Instalador.js` | Idempotent installer — creates/repairs sheets, formats, validations, protections |
| `Menu.js` | `onOpen()` trigger, menu construction |
| `Inicio.js` | Dashboard panel refresh on `Inicio` sheet |
| `Presupuestos.js` | Quote lifecycle: calculate, save, approve, reject |
| `Pedidos.js` | Order lifecycle: create from quote, state transitions, stock discount |
| `Compras.js` | Purchase registration, stock credit |
| `Inventario.js` | Manual stock adjustments |
| `Insumos.js` | Ingredient/packaging catalog CRUD |
| `Recetas.js` | Recipe catalog CRUD |
| `ReglasEmpaque.js` | Packaging rules per recipe + size |
| `Clientes.js` | Client catalog CRUD |
| `Proveedores.js` | Supplier catalog CRUD |
| `Configuracion.js` | System parameters editor |
| `Util.js` | Shared helpers (see above) |

### Key business rules
- **Cost formula**: `costo_total = ingredientes + materiales + mano_obra + indirecto_fijo + depreciacion_fija`
- **Margin is over sale price**: `precio_con_margen = costo_total / (1 - margen/100)`
- **IGV** applied on top, then rounding up to nearest multiple of 5 (`MULTIPLO_5` mode)
- **Ingredient quantities scale by factor**; packaging quantities do not (manually set per quote)
- **Stock discount timing** is configurable: `APROBAR` (when quote is approved) or `PRODUCCION` (when order starts production)
- Quotes (presupuestos) snapshot all prices at creation time — changing ingredient prices later has no effect on saved quotes

### Documentation — `doc/`
Before implementing or modifying any UI or business logic, read the relevant doc:

- `doc/diseno_visual_interfaz.html` — visual style guide for HTML dialogs (colors, typography, components, spacing). All `.html` forms must follow this.
- `doc/plan_interfaz_ui.md` — UI/UX plan and interaction design for each screen.
- `doc/Manual_de_usuario.html` — end-user manual; describes expected business flows and behavior from the user's perspective.

### Installer invariant
The installer (`instalar()`) is idempotent: it never deletes sheets, rows, or columns with data. It only creates what is missing and reapplies formatting. Run it after any schema change in `Esquema.js`.
