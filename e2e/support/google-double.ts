/**
 * Un doble de Google: Identity Services, la API de Sheets y la de Drive, servidas desde el propio test.
 *
 * ## Por qué existe
 *
 * La sincronización es la única parte de la app que habla con un servidor, y es justo la que más
 * necesita un E2E: el ciclo entero —bajar, fusionar, subir— solo se puede ver de punta a punta si al
 * otro lado hay una hoja de verdad que responda. Contra la Google de verdad no se puede probar (haría
 * falta una cuenta, un consentimiento y una hoja por test, y el resultado dependería de la red), así
 * que se intercepta con `page.route` y se contesta desde Node.
 *
 * El estado vive **aquí, en el proceso del test**, no en el navegador. Eso es lo que permite que un
 * spec *edite una celda a mano* y luego compruebe qué escribió la app: `google.sheet` es la hoja del
 * usuario, y se lee y se escribe como la leería y escribiría una persona.
 *
 * ## Lo que emula a propósito, porque es donde están los fallos de verdad
 *
 * | Comportamiento de Sheets | Por qué importa |
 * |---|---|
 * | **`RAW` convierte a número lo que parece un número** | La app escribe `'2.5'` (texto) y lo lee de vuelta como `2.5` (número). Si la canonización no diera la misma cadena en los dos casos, cada fila parecería editada a mano en cada ciclo. Un doble que devolviera el texto tal cual **esconderría** ese fallo, que es el peor del motor |
 * | **`TRUE`/`FALSE` se vuelven booleanos** | La lápida se escribe como texto `TRUE` y vuelve como `true` |
 * | **Recorta por la derecha y por abajo** | Una fila con las últimas celdas vacías vuelve corta, y las filas finales vacías no vuelven. El lector depende de eso |
 * | **La cuadrícula no crece sola** | Escribir fuera de ella falla. Es lo que hace que `grow()` tenga sentido |
 * | **Borrar una fila desplaza las de abajo** | Es lo que obliga a purgar de abajo arriba |
 *
 * Lo que **no** emula, y se declara: las fechas no se convierten en número de serie. La app las lee con
 * `FORMATTED_STRING` precisamente para no verlas nunca así, y la única columna de fecha (`Sincronizado`)
 * es metadato — está fuera de la huella y fuera de la fusión, así que no puede cambiar ninguna decisión.
 * Emular el análisis de fechas de Sheets, que depende del idioma de la hoja, añadiría una ficción propia
 * sin cubrir nada.
 *
 * ## Cómo se usa
 *
 * ```typescript
 * test('…', async ({ google, account }) => {
 *   await account.goto();
 *   await account.connect();               // ← la app crea la hoja EN ESTE doble
 *   const insumos = google.sheet.tab('Insumos');
 *   insumos.setCell(insumos.rowOf('id', 'ing-harina'), 'Nombre', 'Harina E2E');  // edición a mano
 * });
 * ```
 */
import type { Page, Route } from '@playwright/test';

/** El permiso sin el que la app no considera válido el token. */
const DRIVE_FILE = 'https://www.googleapis.com/auth/drive.file';
const SCOPES = `openid email profile ${DRIVE_FILE}`;

/** El `client_id` que se le sirve a la app en `config.json`; sin uno, la integración está apagada. */
const CLIENT_ID = 'e2e-client-id.apps.googleusercontent.com';

const TOKEN = 'e2e-access-token';

/** La cuenta que el doble dice que ha entrado. `sub` es lo que la app usa como id de cuenta. */
export const E2E_ACCOUNT = {
  sub: 'e2e-account-1',
  email: 'cocina.e2e@example.com',
  name: 'Cocina E2E',
} as const;

/**
 * Cuántas filas ocupa la cabecera. Vale también como índice (0-based) de la primera fila de datos, que
 * para quien mira la hoja es la fila 2.
 */
const HEADER_ROW = 1;

interface ParsedRange {
  title: string;
  firstColumn: number;
  firstRow: number;
  /** `null` = abierto por la derecha o por abajo (`A2:M` no acota filas). */
  lastColumn: number | null;
  lastRow: number | null;
}

/**
 * Una pestaña de la hoja: su cuadrícula tal cual, y las operaciones que haría **una persona**.
 *
 * Los métodos de mano (`setCell`, `setHeader`, `appendRow`, `deleteRow`) tocan **solo** lo que se les pide: no
 * actualizan la versión ni la huella, que es exactamente lo que las convierte en una edición manual a
 * ojos del motor. Localizar por rótulo de cabecera (`'Nombre'`) y no por índice es deliberado: la
 * cabecera es el contrato observable de la hoja, igual que un nombre accesible en el DOM, y la suite no
 * puede importar el esquema de `src/`.
 */
export class FakeTab {
  /** Filas de la cuadrícula, la 0 es la cabecera de la hoja (fila 1). */
  readonly grid: unknown[][] = [];

  constructor(
    readonly sheetId: number,
    public title: string,
    headers: readonly string[],
    public rowCount: number,
  ) {
    this.grid.push([...headers]);
  }

  /** Los rótulos de la fila 1, tal como están ahora en la hoja. */
  get headers(): string[] {
    return (this.grid[0] ?? []).map(asText);
  }

  /** Índice de columna (desde 0) de un rótulo. `-1` si no está. */
  columnOf(header: string): number {
    return this.headers.indexOf(header);
  }

  /** Cuántas filas de datos tienen algo escrito. */
  get dataRowCount(): number {
    return this.dataRows().length;
  }

  /**
   * Número de fila (como lo ve la persona: la 2 es la primera de datos) donde una columna vale algo.
   * `-1` si no está. Compara como texto recortado, que es lo que hace quien mira la hoja.
   */
  rowOf(header: string, value: string): number {
    const index = this.columnOf(header);
    for (let row = HEADER_ROW; row < this.grid.length; row += 1) {
      if (asText(this.grid[row]?.[index]).trim() === value) {
        return row + 1;
      }
    }
    return -1;
  }

  cell(row: number, header: string): unknown {
    return this.grid[row - 1]?.[this.columnOf(header)] ?? '';
  }

  /** Edita **una celda**, como quien la teclea: nada más se toca. */
  setCell(row: number, header: string, value: string): void {
    const column = this.columnOf(header);
    if (column < 0) {
      throw new Error(`La pestaña «${this.title}» no tiene la columna «${header}».`);
    }
    this.write(row - 1, column, coerce(value));
  }

  /** Cambia un rótulo de la cabecera: es lo que hace que las columnas dejen de estar donde deberían. */
  setHeader(header: string, replacement: string): void {
    const column = this.columnOf(header);
    if (column < 0) {
      throw new Error(`La pestaña «${this.title}» no tiene la columna «${header}».`);
    }
    this.write(0, column, replacement);
  }

  /**
   * Escribe una fila nueva debajo de la última con datos, rellenando **solo** las columnas que se le
   * pasen: es un alta a mano, así que no lleva id, ni versión, ni huella. Devuelve su número de fila.
   */
  appendRow(values: Record<string, string>): number {
    const row = this.dataRows().length + HEADER_ROW;
    for (const [header, value] of Object.entries(values)) {
      const column = this.columnOf(header);
      if (column < 0) {
        throw new Error(`La pestaña «${this.title}» no tiene la columna «${header}».`);
      }
      this.write(row, column, coerce(value));
    }
    return row + 1;
  }

  /** Borra una fila entera, desplazando hacia arriba las de debajo (como el menú de la hoja). */
  deleteRow(row: number): void {
    this.grid.splice(row - 1, 1);
  }

  /**
   * Copia de la cuadrícula. Sirve para que un test pueda **deshacer un estropicio** —restaurar las
   * filas que borró a mano— y comprobar que, arreglada la hoja, el ciclo vuelve a converger. Sin eso,
   * un caso de barrera acabaría en un error permanente y no se podría llevar a un estado terminal.
   */
  snapshot(): unknown[][] {
    return this.grid.map((row) => [...row]);
  }

  restore(rows: readonly unknown[][]): void {
    this.grid.length = 0;
    for (const row of rows) {
      this.grid.push([...row]);
    }
  }

  /** Las filas de datos con algo escrito, en orden. */
  private dataRows(): unknown[][] {
    return this.grid.slice(HEADER_ROW).filter((row) => row.some((cell) => asText(cell) !== ''));
  }

  private write(row: number, column: number, value: unknown): void {
    while (this.grid.length <= row) {
      this.grid.push([]);
    }
    const target = this.grid[row];
    while (target.length <= column) {
      target.push('');
    }
    target[column] = value;
  }
}

/** Una hoja de cálculo del Drive del usuario. */
export class FakeSpreadsheet {
  private readonly tabs: FakeTab[] = [];
  /** La app pregunta a Drive si sigue viva; una hoja en la papelera cuenta como que no. */
  trashed = false;

  constructor(
    readonly id: string,
    readonly title: string,
  ) {}

  get url(): string {
    return `https://docs.google.com/spreadsheets/d/${this.id}/edit`;
  }

  get titles(): string[] {
    return this.tabs.map((tab) => tab.title);
  }

  /** La pestaña por su nombre. Lanza con un mensaje útil si no está: es un error del test. */
  tab(title: string): FakeTab {
    const found = this.tabs.find((tab) => tab.title === title);
    if (!found) {
      throw new Error(
        `La hoja no tiene la pestaña «${title}». Tiene: ${this.titles.join(', ') || '(ninguna)'}.`,
      );
    }
    return found;
  }

  find(title: string): FakeTab | undefined {
    return this.tabs.find((tab) => tab.title === title);
  }

  addTab(title: string, headers: readonly string[], rowCount: number, sheetId: number): FakeTab {
    const tab = new FakeTab(sheetId, title, headers, rowCount);
    this.tabs.push(tab);
    return tab;
  }

  /**
   * Quita una pestaña, como el «Eliminar hoja» del menú contextual, y **la devuelve** para que el test
   * pueda volver a ponerla con {@link attachTab} y comprobar que la sincronización se recupera.
   */
  removeTab(title: string): FakeTab {
    const tab = this.tab(title);
    this.tabs.splice(this.tabs.indexOf(tab), 1);
    return tab;
  }

  /** Devuelve a la hoja una pestaña que se había quitado, con su contenido intacto. */
  attachTab(tab: FakeTab): void {
    this.tabs.push(tab);
  }

  tabById(sheetId: number): FakeTab | undefined {
    return this.tabs.find((tab) => tab.sheetId === sheetId);
  }
}

/** Un error de la API, con la forma que la app sabe leer (`error.message`). */
interface ApiError {
  status: number;
  message: string;
}

/**
 * El doble completo. Una instancia por test (la crea el fixture `google`).
 */
export class GoogleDouble {
  private readonly files: FakeSpreadsheet[] = [];
  private nextFileId = 1;
  private nextSheetId = 1;

  /** Puerta para retener las respuestas de Google (ver {@link hold}). */
  private gate: Promise<void> | null = null;
  private release: (() => void) | null = null;

  /** La hoja viva más reciente. Es la que la app está usando. */
  get sheet(): FakeSpreadsheet {
    const live = this.files.filter((file) => !file.trashed);
    const last = live[live.length - 1];
    if (!last) {
      throw new Error(
        'Todavía no hay ninguna hoja: la app la crea al conectar la cuenta (`account.connect()`).',
      );
    }
    return last;
  }

  /** Todas las hojas creadas, incluidas las que están en la papelera. */
  get sheets(): readonly FakeSpreadsheet[] {
    return this.files;
  }

  /** Manda la hoja a la papelera, como haría el usuario desde su Drive. */
  trash(): void {
    this.sheet.trashed = true;
  }

  /**
   * Retiene las respuestas de Google hasta {@link resume}.
   *
   * **Retener, no fallar.** Un `route.abort()` o un 503 dejarían en la consola del navegador un error
   * de recurso, y la suite falla el test ante cualquier `console.error` (fixture `consoleErrors`).
   * Retener consigue lo mismo que hace falta —el ciclo no termina, así que los cambios locales siguen
   * sin salir— sin inventar un fallo que la app no ha producido.
   */
  hold(): void {
    this.gate ??= new Promise<void>((resolve) => {
      this.release = resolve;
    });
  }

  /** Suelta lo retenido y vuelve a contestar al instante. */
  resume(): void {
    this.release?.();
    this.gate = null;
    this.release = null;
  }

  /**
   * Engancha el doble a la página. **Antes de cualquier navegación**: lo garantiza el fixture, que
   * resuelve `google` antes de que el test pueda llamar a un `goto`.
   */
  async install(page: Page): Promise<void> {
    // 1 · La configuración del despliegue. Sin `googleClientId` la integración está apagada y el
    //     botón de conectar no puede hacer nada, así que se sirve uno.
    await page.route('**/config.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ debug: true, googleClientId: CLIENT_ID }),
      }),
    );

    // 2 · Google Identity Services. La app inyecta este script y usa `window.google`.
    await page.route('https://accounts.google.com/gsi/client', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/javascript; charset=utf-8',
        body: GIS_STUB,
      }),
    );

    // 3 · El perfil (OIDC). Es de donde sale el id de cuenta con el que se recuerda la hoja.
    await page.route('https://openidconnect.googleapis.com/v1/userinfo', (route) =>
      this.answer(route, () => ({ ...E2E_ACCOUNT, picture: null })),
    );

    // 4 · Drive: buscar la hoja de la cuenta (la colección) y preguntar si una sigue viva (un fichero).
    await page.route('https://www.googleapis.com/drive/v3/files?*', (route) =>
      this.answer(route, () => this.driveSearch(route)),
    );
    await page.route('https://www.googleapis.com/drive/v3/files/**', (route) =>
      this.answer(route, () => this.drive(route)),
    );

    // 5 · Sheets. Dos patrones y no uno con `**` al final: la creación va contra la colección, sin
    //     nada detrás, y no conviene depender de que el glob acepte cero caracteres.
    const onSheets = (route: Route): Promise<void> =>
      this.answer(route, () => this.sheetsApi(route));
    await page.route('https://sheets.googleapis.com/v4/spreadsheets', onSheets);
    await page.route('https://sheets.googleapis.com/v4/spreadsheets/**', onSheets);
  }

  /** Envuelve cada respuesta: la puerta de retención y la traducción de errores. */
  private async answer(route: Route, handle: () => unknown): Promise<void> {
    if (this.gate) {
      await this.gate;
    }

    let body: unknown;
    try {
      body = handle();
    } catch (error) {
      const api = error as Partial<ApiError>;
      const status = typeof api.status === 'number' ? api.status : 500;
      const message = api.message ?? 'El doble de Google no ha sabido responder.';
      await route
        .fulfill({
          status,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({ error: { code: status, message } }),
        })
        .catch(ignore);
      return;
    }

    await route
      .fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(body ?? {}),
      })
      .catch(ignore);
  }

  /**
   * La búsqueda de Drive, acotada a lo que **esta app creó** — que es todo lo que hay en este doble, y
   * también todo lo que `drive.file` alcanza de verdad.
   *
   * Se devuelven **en orden de creación**: es lo que hace que, si hubiera varias, todos los dispositivos
   * elijan la misma (la más antigua) en vez de repartirse.
   */
  private driveSearch(route: Route): unknown {
    const query = new URL(route.request().url()).searchParams.get('q') ?? '';
    const name = /name\s*=\s*'((?:[^']|\\')*)'/.exec(query)?.[1]?.replace(/\\'/g, "'");

    const files = this.files
      .filter((file) => !file.trashed)
      .filter((file) => name === undefined || file.title === name)
      .map((file) => ({ id: file.id, webViewLink: file.url }));

    return { files };
  }

  private drive(route: Route): unknown {
    const id = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop() ?? '');
    const file = this.files.find((candidate) => candidate.id === id);
    if (!file) {
      throw notFound(`No existe el fichero ${id}.`);
    }
    return { id: file.id, trashed: file.trashed };
  }

  /** El enrutado de Sheets, por la forma de la ruta. */
  private sheetsApi(route: Route): unknown {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname.replace('/v4/spreadsheets', '').replace(/^\//, '');

    if (path === '') {
      if (method !== 'POST') {
        throw badRequest('Solo se puede crear con POST.');
      }
      return this.create(json(route));
    }

    // `{id}:batchUpdate` — la llamada estructural (crear pestaña, ampliar, borrar filas).
    const [head, ...rest] = path.split('/');
    const [rawId, structural] = head.split(':');
    const file = this.fileOf(decodeURIComponent(rawId));

    if (structural === 'batchUpdate') {
      return this.structural(file, json(route));
    }
    if (rest.length === 0) {
      return this.metadata(file);
    }

    // El verbo va pegado al recurso con dos puntos y **en el mismo segmento** de la ruta:
    // `values:batchGet`, `values:batchUpdate`, `values:batchClear`. Sin verbo, lo que sigue es el
    // rango de una lectura suelta: `values/{rango}`.
    const [resource, operation] = (rest[0] ?? '').split(':');
    if (resource !== 'values') {
      throw badRequest(`Ruta no soportada por el doble: ${path}`);
    }

    if (operation === 'batchGet') {
      return this.batchGet(file, url.searchParams.getAll('ranges'));
    }
    if (operation === 'batchUpdate') {
      return this.batchUpdate(file, json(route));
    }
    if (operation === 'batchClear') {
      return this.batchClear(file, json(route));
    }
    if (operation !== undefined) {
      throw badRequest(`Operación no soportada por el doble: ${operation}`);
    }

    const range = decodeURIComponent(rest[1] ?? '');
    return { range, values: readRange(file, range) };
  }

  private create(body: Record<string, unknown>): unknown {
    const properties = (body['properties'] ?? {}) as { title?: string };
    const file = new FakeSpreadsheet(
      `e2e-sheet-${this.nextFileId++}`,
      properties.title ?? 'Sin título',
    );

    const sheets = (body['sheets'] ?? []) as SheetSpec[];
    for (const spec of sheets) {
      const title = spec.properties?.title ?? '';
      const rowCount = spec.properties?.gridProperties?.rowCount ?? 1000;
      const headers = (spec.data?.[0]?.rowData?.[0]?.values ?? []).map((cell) =>
        asText(cell.userEnteredValue?.stringValue),
      );
      file.addTab(title, headers, rowCount, this.nextSheetId++);
    }

    this.files.push(file);
    return { spreadsheetId: file.id, spreadsheetUrl: file.url };
  }

  private metadata(file: FakeSpreadsheet): unknown {
    return {
      spreadsheetId: file.id,
      spreadsheetUrl: file.url,
      sheets: file.titles.map((title) => {
        const tab = file.tab(title);
        return {
          properties: {
            sheetId: tab.sheetId,
            title: tab.title,
            gridProperties: { rowCount: tab.rowCount },
          },
        };
      }),
    };
  }

  private batchGet(file: FakeSpreadsheet, ranges: readonly string[]): unknown {
    return {
      spreadsheetId: file.id,
      valueRanges: ranges.map((range) => ({ range, values: readRange(file, range) })),
    };
  }

  private batchUpdate(file: FakeSpreadsheet, body: Record<string, unknown>): unknown {
    const data = (body['data'] ?? []) as { range?: string; values?: unknown[][] }[];
    let cells = 0;
    for (const entry of data) {
      cells += writeRange(file, entry.range ?? '', entry.values ?? []);
    }
    return { spreadsheetId: file.id, totalUpdatedCells: cells };
  }

  private batchClear(file: FakeSpreadsheet, body: Record<string, unknown>): unknown {
    const ranges = (body['ranges'] ?? []) as string[];
    for (const range of ranges) {
      clearRange(file, range);
    }
    return { spreadsheetId: file.id, clearedRanges: ranges };
  }

  /**
   * La llamada estructural. `deleteDimension` **desplaza** las filas de debajo, que es justo lo que
   * obliga a la app a purgar de abajo arriba: si lo hiciera al revés, aquí se borrarían filas ajenas.
   */
  private structural(file: FakeSpreadsheet, body: Record<string, unknown>): unknown {
    const requests = (body['requests'] ?? []) as StructuralRequest[];
    const replies: unknown[] = [];

    for (const request of requests) {
      if (request.addSheet) {
        const title = request.addSheet.properties?.title ?? '';
        const rowCount = request.addSheet.properties?.gridProperties?.rowCount ?? 1000;
        const tab = file.addTab(title, [], rowCount, this.nextSheetId++);
        replies.push({ addSheet: { properties: { sheetId: tab.sheetId, title } } });
        continue;
      }
      if (request.appendDimension) {
        const tab = file.tabById(request.appendDimension.sheetId);
        if (tab) {
          tab.rowCount += request.appendDimension.length;
        }
        replies.push({});
        continue;
      }
      if (request.updateSheetProperties?.properties) {
        // Renombrar una pestaña: es lo que hace la migración de esquema con las de la versión
        // anterior — se apartan con un sufijo en vez de borrarse.
        const { sheetId, title } = request.updateSheetProperties.properties;
        const tab = file.tabById(sheetId);
        if (tab && title !== undefined) {
          tab.title = title;
        }
        replies.push({});
        continue;
      }

      if (request.deleteDimension) {
        const { sheetId, startIndex, endIndex } = request.deleteDimension.range;
        const tab = file.tabById(sheetId);
        if (tab) {
          tab.grid.splice(startIndex, Math.max(0, endIndex - startIndex));
        }
        replies.push({});
        continue;
      }
      throw badRequest('El doble no soporta esa petición estructural.');
    }

    return { spreadsheetId: file.id, replies };
  }

  private fileOf(id: string): FakeSpreadsheet {
    const file = this.files.find((candidate) => candidate.id === id);
    if (!file) {
      throw notFound(`No existe la hoja ${id}.`);
    }
    return file;
  }
}

// ── Rangos ─────────────────────────────────────────────────────────────────────────────────────

/** `'Insumos'!A2:M` · `'_meta'!A1:B4` · `'Insumos'!J7`. Las comillas las pone siempre la app. */
function parseRange(range: string): ParsedRange {
  const match = /^'((?:[^']|'')*)'!([A-Z]+)(\d+)(?::([A-Z]+)(\d*))?$/.exec(range.trim());
  if (!match) {
    throw badRequest(`Rango que el doble no sabe leer: ${range}`);
  }
  const [, quoted, firstColumn, firstRow, lastColumn, lastRow] = match;
  return {
    title: quoted.replace(/''/g, "'"),
    firstColumn: columnIndex(firstColumn),
    firstRow: Number(firstRow),
    lastColumn: lastColumn ? columnIndex(lastColumn) : null,
    lastRow: lastRow ? Number(lastRow) : null,
  };
}

/** `A` → 0, `Z` → 25, `AA` → 26. */
function columnIndex(letters: string): number {
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + (letter.charCodeAt(0) - 64);
  }
  return index - 1;
}

/**
 * Lee un rango **como lo devuelve Sheets**: recortado por abajo (las filas finales vacías no vuelven)
 * y por la derecha (las últimas celdas vacías de cada fila tampoco). Los huecos de en medio sí vuelven,
 * como `[]`, y eso es lo que mantiene alineados los índices de fila.
 */
function readRange(file: FakeSpreadsheet, range: string): unknown[][] | undefined {
  const { title, firstColumn, firstRow, lastColumn, lastRow } = parseRange(range);
  const tab = file.find(title);
  if (!tab) {
    // Sheets responde 400 cuando el rango apunta a una pestaña que no existe. Es lo que permite a la
    // app distinguir «pestaña borrada» de «pestaña vacía» — y por eso pide antes los metadatos.
    throw badRequest(`Unable to parse range: ${range}`);
  }

  const end = lastRow ?? tab.grid.length;
  const rows: unknown[][] = [];
  for (let row = firstRow; row <= end; row += 1) {
    const source = tab.grid[row - 1] ?? [];
    const slice = source.slice(firstColumn, lastColumn === null ? undefined : lastColumn + 1);
    rows.push(trimTrailing(slice));
  }

  while (rows.length > 0 && rows[rows.length - 1].length === 0) {
    rows.pop();
  }
  return rows.length === 0 ? undefined : rows;
}

function writeRange(file: FakeSpreadsheet, range: string, values: readonly unknown[][]): number {
  const { title, firstColumn, firstRow } = parseRange(range);
  const tab = file.find(title);
  if (!tab) {
    throw badRequest(`Unable to parse range: ${range}`);
  }

  const needed = firstRow + values.length - 1;
  if (needed > tab.rowCount) {
    // Sheets no amplía la cuadrícula al escribir fuera de ella: falla. Es lo que hace que `grow()`
    // exista, y un doble complaciente escondería el día que dejara de llamarse.
    throw badRequest(
      `Range ('${title}') exceeds grid limits. Max rows: ${tab.rowCount}, requested: ${needed}`,
    );
  }

  let cells = 0;
  values.forEach((row, offset) => {
    row.forEach((value, column) => {
      setCell(tab, firstRow + offset - 1, firstColumn + column, coerce(value));
      cells += 1;
    });
  });
  return cells;
}

function clearRange(file: FakeSpreadsheet, range: string): void {
  const { title, firstColumn, firstRow, lastColumn, lastRow } = parseRange(range);
  const tab = file.find(title);
  if (!tab) {
    return;
  }
  const end = lastRow ?? tab.grid.length;
  const width = lastColumn ?? (tab.headers.length || 1) - 1;
  for (let row = firstRow; row <= end; row += 1) {
    for (let column = firstColumn; column <= width; column += 1) {
      setCell(tab, row - 1, column, '');
    }
  }
}

function setCell(tab: FakeTab, row: number, column: number, value: unknown): void {
  while (tab.grid.length <= row) {
    tab.grid.push([]);
  }
  const target = tab.grid[row];
  while (target.length <= column) {
    target.push('');
  }
  target[column] = value;
}

function trimTrailing(row: readonly unknown[]): unknown[] {
  const cells = [...row];
  while (cells.length > 0 && asText(cells[cells.length - 1]) === '') {
    cells.pop();
  }
  return cells;
}

/**
 * Lo que hace `valueInputOption: RAW` con un texto: si parece un número, **es** un número; si parece un
 * sí/no, es un booleano. Es la conversión que la app no ve venir y de la que depende su huella.
 */
function coerce(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const text = value.trim();
  if (text === '') {
    return '';
  }
  if (/^(TRUE|FALSE)$/i.test(text)) {
    return text.toUpperCase() === 'TRUE';
  }
  if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(text)) {
    return Number(text);
  }
  return value;
}

function asText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function json(route: Route): Record<string, unknown> {
  const body = route.request().postData() ?? '{}';
  return JSON.parse(body) as Record<string, unknown>;
}

function badRequest(message: string): ApiError {
  return { status: 400, message };
}

function notFound(message: string): ApiError {
  return { status: 404, message };
}

function ignore(): void {
  // La página pudo cerrarse mientras se contestaba: no es un fallo del test.
}

// ── Formas del cuerpo de las peticiones de Sheets ───────────────────────────────────────────────

interface SheetSpec {
  properties?: { title?: string; gridProperties?: { rowCount?: number } };
  data?: {
    rowData?: { values?: { userEnteredValue?: { stringValue?: string } }[] }[];
  }[];
}

interface StructuralRequest {
  addSheet?: { properties?: { title?: string; gridProperties?: { rowCount?: number } } };
  appendDimension?: { sheetId: number; length: number };
  deleteDimension?: { range: { sheetId: number; startIndex: number; endIndex: number } };
  updateSheetProperties?: { properties?: { sheetId: number; title?: string }; fields?: string };
}

/**
 * El sustituto de Google Identity Services que se le sirve a la página.
 *
 * Concede el token **siempre**, con o sin `prompt`, así que la reanudación silenciosa de una recarga
 * también funciona. Lo que **no** se puede montar desde aquí es el estado «se caducó el token, hay que
 * reconectar»: haría falta que la credencial de la sesión envejeciera en memoria, y eso no se puede
 * provocar desde fuera sin un reloj falso dentro de la app. Ese camino lo cubre el spec unitario del
 * ciclo, que sí puede quitar las credenciales a mitad.
 */
const GIS_STUB = `
(() => {
  const respond = (config) => {
    setTimeout(() => {
      config.callback({
        access_token: '${TOKEN}',
        expires_in: 3600,
        scope: '${SCOPES}',
      });
    }, 0);
  };

  window.google = {
    accounts: {
      oauth2: {
        initTokenClient: (config) => ({ requestAccessToken: () => respond(config) }),
        revoke: (token, done) => setTimeout(done, 0),
      },
    },
  };
})();
`;
