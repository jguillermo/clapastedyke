/**
 * Clapastedyke · Web App de sincronización con Google Sheets
 * ===========================================================
 *
 * Único responsable de escribir en la hoja de cálculo. La app web NUNCA habla con las APIs de
 * Sheets o Drive: manda un POST a este script y este hace el resto.
 *
 * AISLAMIENTO POR USUARIO (lo más importante de este fichero)
 * ----------------------------------------------------------
 * El despliegue es «Ejecutar como: YO» + «Quién tiene acceso: cualquiera», porque un navegador no
 * puede mandar la cabecera `Authorization` a un Web App (dispara el preflight CORS, que Apps Script
 * no atiende). Eso NO significa que el script trabaje con el Drive del propietario:
 *
 *   1. La autorización es el `accessToken` del usuario, que viaja en el CUERPO del POST.
 *   2. Se valida contra `tokeninfo`: el `aud` del token tiene que estar en ALLOWED_CLIENT_IDS y el
 *      scope tiene que incluir `drive.file`. Si no, se rechaza (falla cerrado: propiedad vacía =
 *      todo rechazado).
 *   3. Todas las escrituras salen por `UrlFetchApp` contra las APIs REST de Sheets/Drive **con el
 *      token del usuario**. Aquí NO se usa `SpreadsheetApp` ni `DriveApp` a propósito: usarían la
 *      identidad del propietario del script y romperían el aislamiento.
 *
 * Consecuencia: la hoja se crea y se escribe en el Drive de quien llama, y el mapeo
 * `sub → spreadsheetId` vive en las propiedades del script, una entrada por usuario.
 *
 * IDEMPOTENCIA (tres cerrojos)
 * ----------------------------
 *   1. `LockService` serializa toda escritura → sin carreras entre pestañas o reintentos.
 *   2. `CacheService` recuerda `requestId` por usuario 6 h → reenviar el mismo lote devuelve el
 *      resultado anterior sin volver a escribir.
 *   3. Cada tabla se reescribe por clave (upsert por `id`; las líneas de receta se reemplazan por
 *      receta entera) → mandar datos equivalentes converge siempre al mismo estado.
 *
 * Guía de despliegue y puesta en marcha: `manual/appscript.md`.
 */

/** Versión del esquema de la hoja. Se escribe en la pestaña `_meta`. */
var SCHEMA_VERSION = 1;

/** Nombre por defecto del fichero en Drive (sobrescribible con la propiedad SPREADSHEET_NAME). */
var DEFAULT_SPREADSHEET_NAME = 'Clapastedyke — Recetario';

/** Scope obligatorio: sin él el token no puede crear ni escribir la hoja. */
var REQUIRED_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/** Minutos que se recuerda un `requestId` ya aplicado (CacheService admite hasta 6 h). */
var REQUEST_CACHE_SECONDS = 6 * 60 * 60;

/**
 * Esquema de las pestañas. `fields` va en paralelo a `headers`: la app manda objetos y el script
 * los convierte en filas con este orden, así que cambiar el orden de las columnas de la hoja no
 * rompe nada mientras esta tabla y la app coincidan en los nombres de campo.
 *
 * `key`       → upsert por esa columna (una fila por id).
 * `parentKey` → reemplazo por padre: se borran todas las filas del padre y se reinsertan.
 */
var TABLES = [
  {
    name: 'supplies',
    sheet: 'Insumos',
    key: 'id',
    fields: [
      'id',
      'name',
      'baseUnit',
      'usage',
      'priceAmount',
      'pricePerValue',
      'pricePerUnit',
      'currency',
      'syncedAt',
    ],
    headers: [
      'id',
      'Nombre',
      'Unidad base',
      'Uso',
      'Precio de compra',
      'Presentación (cantidad)',
      'Presentación (unidad)',
      'Moneda',
      'Sincronizado',
    ],
  },
  {
    name: 'recipes',
    sheet: 'Recetas',
    key: 'id',
    fields: [
      'id',
      'name',
      'categoryId',
      'categoryName',
      'flavorId',
      'flavorLabel',
      'portionsCapacityId',
      'portionsCapacityLabel',
      'moldCapacityId',
      'moldCapacityLabel',
      'lineCount',
      'syncedAt',
    ],
    headers: [
      'id',
      'Nombre',
      'categoriaId',
      'Categoría',
      'saborId',
      'Sabor',
      'capacidadPorcionesId',
      'Porciones',
      'capacidadMoldeId',
      'Molde',
      'Nº de insumos',
      'Sincronizado',
    ],
  },
  {
    name: 'recipeLines',
    sheet: 'RecetaInsumos',
    parentKey: 'recipeId',
    fields: ['recipeId', 'recipeName', 'supplyId', 'supplyName', 'quantity', 'unit', 'syncedAt'],
    headers: [
      'recetaId',
      'Receta',
      'insumoId',
      'Insumo',
      'Cantidad',
      'Unidad',
      'Sincronizado',
    ],
  },
  {
    name: 'categories',
    sheet: 'Categorias',
    key: 'id',
    fields: ['id', 'name', 'syncedAt'],
    headers: ['id', 'Nombre', 'Sincronizado'],
  },
  {
    name: 'flavors',
    sheet: 'Sabores',
    key: 'id',
    fields: ['id', 'label', 'syncedAt'],
    headers: ['id', 'Sabor', 'Sincronizado'],
  },
  {
    name: 'capacities',
    sheet: 'Capacidades',
    key: 'id',
    fields: ['id', 'group', 'label', 'factor', 'syncedAt'],
    headers: ['id', 'Grupo', 'Etiqueta', 'Factor', 'Sincronizado'],
  },
];

var META_SHEET = '_meta';

// ───────────────────────────────────────────────────────────────────────────────
// Puntos de entrada
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Comprobación de salud: abrir la URL `/exec` en el navegador debe devolver este JSON. Si en su
 * lugar sale una pantalla de login de Google, el despliegue no es «cualquiera».
 */
function doGet() {
  return json_({
    ok: true,
    service: 'clapastedyke-sheet-sync',
    schemaVersion: SCHEMA_VERSION,
    ops: ['hello', 'upsert'],
  });
}

/**
 * Única entrada de escritura. El cuerpo llega como `text/plain` a propósito (es un "simple
 * request": así el navegador no manda preflight CORS, que Apps Script no sabe responder).
 *
 * Cuerpo: `{ op, requestId, accessToken, sentAt, payload }`.
 * Respuesta: siempre HTTP 200 — el resultado va en `ok` / `error` (Apps Script no expone bien los
 * códigos de estado, así que el cliente comprueba el cuerpo).
 */
function doPost(e) {
  try {
    var request = parseRequest_(e);
    var identity = authenticate_(request.accessToken);

    var cached = cachedResult_(identity.sub, request.requestId);
    if (cached) {
      cached.cached = true;
      return json_(cached);
    }

    var result = withLock_(function () {
      var target = ensureSpreadsheet_(request.accessToken, identity);
      var applied =
        request.op === 'upsert'
          ? applyPayload_(request.accessToken, target.spreadsheetId, request.payload, request.sentAt)
          : {};
      return {
        ok: true,
        schemaVersion: SCHEMA_VERSION,
        account: identity.account,
        spreadsheetId: target.spreadsheetId,
        spreadsheetUrl: target.spreadsheetUrl,
        created: target.created,
        applied: applied,
        cached: false,
      };
    });

    rememberResult_(identity.sub, request.requestId, result);
    return json_(result);
  } catch (error) {
    return json_(errorBody_(error));
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Petición y autenticación
// ───────────────────────────────────────────────────────────────────────────────

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw fail_('BAD_REQUEST', 'Falta el cuerpo de la petición.');
  }
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (parseError) {
    throw fail_('BAD_REQUEST', 'El cuerpo no es JSON válido.');
  }
  var op = body.op || 'hello';
  if (op !== 'hello' && op !== 'upsert') {
    throw fail_('BAD_REQUEST', 'Operación desconocida: ' + op);
  }
  if (!body.accessToken) {
    throw fail_('UNAUTHENTICATED', 'Falta el accessToken.');
  }
  if (op === 'upsert' && !body.payload) {
    throw fail_('BAD_REQUEST', 'La operación upsert necesita un payload.');
  }
  return {
    op: op,
    requestId: body.requestId || '',
    accessToken: body.accessToken,
    sentAt: body.sentAt || new Date().toISOString(),
    payload: body.payload || {},
  };
}

/**
 * Valida el token del usuario y devuelve su identidad. Dos comprobaciones en una sola tanda de
 * peticiones (`fetchAll`): `tokeninfo` dice PARA QUIÉN se emitió el token (lo que impide que un
 * token de otra app sirva aquí) y `userinfo` da los datos de presentación.
 */
function authenticate_(accessToken) {
  var allowed = allowedClientIds_();
  if (allowed.length === 0) {
    throw fail_(
      'CLIENT_MISMATCH',
      'El script no tiene ALLOWED_CLIENT_IDS configurado, así que rechaza todas las peticiones. Ver manual/appscript.md, paso 6.',
    );
  }

  var responses = UrlFetchApp.fetchAll([
    {
      url:
        'https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(accessToken),
      method: 'get',
      muteHttpExceptions: true,
    },
    {
      url: 'https://openidconnect.googleapis.com/v1/userinfo',
      method: 'get',
      headers: { Authorization: 'Bearer ' + accessToken },
      muteHttpExceptions: true,
    },
  ]);

  if (responses[0].getResponseCode() !== 200) {
    throw fail_('UNAUTHENTICATED', 'El token no es válido o ha caducado. Vuelve a conectar.');
  }
  var info = JSON.parse(responses[0].getContentText());

  if (allowed.indexOf(String(info.aud)) === -1) {
    throw fail_(
      'CLIENT_MISMATCH',
      'El token se emitió para otro Client ID (' + info.aud + '). Revisa ALLOWED_CLIENT_IDS.',
    );
  }
  if (String(info.scope || '').indexOf(REQUIRED_SCOPE) === -1) {
    throw fail_(
      'SCOPE_MISSING',
      'El token no incluye el permiso ' + REQUIRED_SCOPE + '. Revoca el acceso y vuelve a conectar.',
    );
  }
  var sub = info.sub || info.user_id;
  if (!sub) {
    throw fail_('UNAUTHENTICATED', 'El token no identifica a ningún usuario.');
  }

  var profile = responses[1].getResponseCode() === 200
    ? JSON.parse(responses[1].getContentText())
    : {};

  return {
    sub: String(sub),
    account: {
      sub: String(sub),
      email: profile.email || info.email || '',
      name: profile.name || '',
      picture: profile.picture || '',
    },
  };
}

function allowedClientIds_() {
  var raw = PropertiesService.getScriptProperties().getProperty('ALLOWED_CLIENT_IDS') || '';
  return raw
    .split(',')
    .map(function (value) {
      return value.trim();
    })
    .filter(function (value) {
      return value.length > 0;
    });
}

// ───────────────────────────────────────────────────────────────────────────────
// La hoja del usuario: localizar o crear (idempotente)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve la hoja de este usuario, creándola en la RAÍZ de su Drive si hace falta.
 *
 * Tres pasos, en orden de coste: la referencia recordada → buscarla entre los ficheros que esta
 * app creó → crearla. Con eso, borrar la hoja a mano no rompe nada (se recrea) y llamar dos veces
 * seguidas no crea dos hojas.
 *
 * Nota sobre `drive.file`: el permiso solo alcanza los ficheros que la app creó. Por eso la
 * búsqueda no puede encontrar una hoja que el usuario haya creado a mano — es intencional, es lo
 * que mantiene el permiso «no sensible».
 */
function ensureSpreadsheet_(accessToken, identity) {
  var props = PropertiesService.getScriptProperties();
  var propKey = 'sheet:' + identity.sub;
  var remembered = props.getProperty(propKey);

  if (remembered) {
    var file = driveFile_(accessToken, remembered);
    if (file && !file.trashed) {
      return spreadsheetTarget_(remembered, false);
    }
    props.deleteProperty(propKey);
  }

  var name = props.getProperty('SPREADSHEET_NAME') || DEFAULT_SPREADSHEET_NAME;

  var found = driveFindByName_(accessToken, name);
  if (found) {
    props.setProperty(propKey, found);
    return spreadsheetTarget_(found, false);
  }

  var createdId = createSpreadsheet_(accessToken, name);
  props.setProperty(propKey, createdId);
  return spreadsheetTarget_(createdId, true);
}

function spreadsheetTarget_(spreadsheetId, created) {
  return {
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/edit',
    created: created,
  };
}

function driveFile_(accessToken, fileId) {
  var response = fetchJson_(
    accessToken,
    'get',
    'https://www.googleapis.com/drive/v3/files/' +
      encodeURIComponent(fileId) +
      '?fields=id,name,trashed',
    null,
    true,
  );
  return response.code === 200 ? response.body : null;
}

function driveFindByName_(accessToken, name) {
  var query =
    "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false and name = '" +
    String(name).replace(/'/g, "\\'") +
    "'";
  var url =
    'https://www.googleapis.com/drive/v3/files?q=' +
    encodeURIComponent(query) +
    '&spaces=drive&orderBy=createdTime&pageSize=10&fields=files(id,name)';
  var response = fetchJson_(accessToken, 'get', url, null);
  var files = response.body.files || [];
  return files.length > 0 ? files[0].id : null;
}

/**
 * Crea la hoja con TODAS las pestañas de una vez (`spreadsheets.create` las acepta en la misma
 * llamada) y escribe las cabeceras. Sheets la deja en la raíz del Drive del usuario, que es
 * exactamente donde se quiere; no hay forma de pedir otra carpeta desde esta API.
 */
function createSpreadsheet_(accessToken, name) {
  var sheets = TABLES.map(function (table) {
    return { properties: { title: table.sheet } };
  });
  sheets.push({ properties: { title: META_SHEET } });

  var created = fetchJson_(
    accessToken,
    'post',
    'https://sheets.googleapis.com/v4/spreadsheets?fields=spreadsheetId',
    { properties: { title: name }, sheets: sheets },
  ).body;

  var spreadsheetId = created.spreadsheetId;
  var data = TABLES.map(function (table) {
    return { range: quoteRange_(table.sheet, 'A1'), values: [table.headers] };
  });
  data.push({ range: quoteRange_(META_SHEET, 'A1'), values: [['Clave', 'Valor']] });
  valuesBatchUpdate_(accessToken, spreadsheetId, data);
  freezeHeaders_(accessToken, spreadsheetId);

  return spreadsheetId;
}

/** Congela la primera fila de cada pestaña — cosmético, pero la hoja se vuelve usable a mano. */
function freezeHeaders_(accessToken, spreadsheetId) {
  var meta = fetchJson_(
    accessToken,
    'get',
    'https://sheets.googleapis.com/v4/spreadsheets/' +
      spreadsheetId +
      '?fields=sheets(properties(sheetId,title))',
    null,
  ).body;

  var requests = (meta.sheets || []).map(function (sheet) {
    return {
      updateSheetProperties: {
        properties: {
          sheetId: sheet.properties.sheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    };
  });
  if (requests.length > 0) {
    fetchJson_(
      accessToken,
      'post',
      'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + ':batchUpdate',
      { requests: requests },
    );
  }
}

/**
 * Prepara la hoja para la escritura y devuelve cuántas filas tiene cada pestaña.
 *
 * Hace dos cosas de una sola pasada, porque ambas necesitan la misma lectura:
 * añade las pestañas que falten (hoja creada por una versión anterior del esquema) y devuelve el
 * `rowCount` de cada una, que es lo que permite ampliarla antes de que una escritura se salga de la
 * cuadrícula (Sheets crea 1000 filas por defecto y rechaza los rangos que se pasen).
 */
function ensureLayout_(accessToken, spreadsheetId, wanted) {
  var meta = fetchJson_(
    accessToken,
    'get',
    'https://sheets.googleapis.com/v4/spreadsheets/' +
      spreadsheetId +
      '?fields=sheets(properties(title,gridProperties/rowCount))',
    null,
  ).body;

  var capacity = {};
  (meta.sheets || []).forEach(function (sheet) {
    var grid = sheet.properties.gridProperties || {};
    capacity[sheet.properties.title] = grid.rowCount || 0;
  });

  var missing = wanted.filter(function (title) {
    return capacity[title] === undefined;
  });
  if (missing.length === 0) {
    return capacity;
  }

  fetchJson_(
    accessToken,
    'post',
    'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + ':batchUpdate',
    {
      requests: missing.map(function (title) {
        return { addSheet: { properties: { title: title } } };
      }),
    },
  );

  var data = missing.map(function (title) {
    var table = tableBySheet_(title);
    capacity[title] = 1000; // el valor por defecto de una pestaña nueva
    return {
      range: quoteRange_(title, 'A1'),
      values: [table ? table.headers : ['Clave', 'Valor']],
    };
  });
  valuesBatchUpdate_(accessToken, spreadsheetId, data);

  return capacity;
}

/** Amplía la cuadrícula de una pestaña cuando el bloque a escribir no cabe. */
function ensureRows_(accessToken, spreadsheetId, sheetName, needed, capacity) {
  var current = capacity[sheetName] || 0;
  if (needed <= current) {
    return;
  }

  var meta = fetchJson_(
    accessToken,
    'get',
    'https://sheets.googleapis.com/v4/spreadsheets/' +
      spreadsheetId +
      '?fields=sheets(properties(sheetId,title))',
    null,
  ).body;

  var sheetId = null;
  (meta.sheets || []).forEach(function (sheet) {
    if (sheet.properties.title === sheetName) {
      sheetId = sheet.properties.sheetId;
    }
  });
  if (sheetId === null) {
    return;
  }

  // Se pide holgura (200 filas de más) para no repetir esta llamada en cada sincronización.
  var extra = needed - current + 200;
  fetchJson_(
    accessToken,
    'post',
    'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + ':batchUpdate',
    {
      requests: [
        { appendDimension: { sheetId: sheetId, dimension: 'ROWS', length: extra } },
      ],
    },
  );
  capacity[sheetName] = current + extra;
}

function tableBySheet_(sheetName) {
  for (var i = 0; i < TABLES.length; i++) {
    if (TABLES[i].sheet === sheetName) {
      return TABLES[i];
    }
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Escritura: upsert por clave y reemplazo por padre
// ───────────────────────────────────────────────────────────────────────────────

function applyPayload_(accessToken, spreadsheetId, payload, sentAt) {
  var pending = TABLES.filter(function (table) {
    return Array.isArray(payload[table.name]) && payload[table.name].length > 0;
  });
  if (pending.length === 0) {
    return {};
  }

  var capacity = ensureLayout_(
    accessToken,
    spreadsheetId,
    pending
      .map(function (table) {
        return table.sheet;
      })
      .concat([META_SHEET]),
  );

  var applied = {};
  for (var i = 0; i < pending.length; i++) {
    var table = pending[i];
    var rows = payload[table.name];
    applied[table.name] = table.parentKey
      ? replaceByParent_(accessToken, spreadsheetId, table, rows, capacity)
      : upsertByKey_(accessToken, spreadsheetId, table, rows, capacity);
  }

  writeMeta_(accessToken, spreadsheetId, sentAt);
  return applied;
}

/**
 * Lee la pestaña entera, fusiona en memoria y la vuelve a escribir. Es una llamada de lectura y
 * una de escritura por pestaña, y el resultado no depende del estado previo — que es justo lo que
 * hace la operación idempotente. Con decenas o cientos de filas esto es de sobra; si algún día el
 * recetario creciera a miles, tocaría paginar.
 */
function upsertByKey_(accessToken, spreadsheetId, table, rows, capacity) {
  var existing = readRows_(accessToken, spreadsheetId, table);
  var keyIndex = table.fields.indexOf(table.key);
  var order = [];
  // Sin prototipo: un id que se llamara «constructor» o «toString» daría un falso positivo con
  // un objeto normal.
  var byKey = Object.create(null);

  existing.forEach(function (row) {
    var key = String(row[keyIndex] === undefined ? '' : row[keyIndex]);
    if (!key) {
      return;
    }
    if (!byKey[key]) {
      order.push(key);
    }
    byKey[key] = row;
  });

  rows.forEach(function (incoming) {
    var row = toRow_(table, incoming);
    var key = String(row[keyIndex]);
    if (!byKey[key]) {
      order.push(key);
    }
    byKey[key] = row;
  });

  var matrix = order.map(function (key) {
    return byKey[key];
  });
  writeRows_(accessToken, spreadsheetId, table, matrix, existing.length, capacity);
  return rows.length;
}

/**
 * Reemplazo por padre: se quitan TODAS las filas de las recetas que llegan y se reinsertan las
 * nuevas. Evita tener que inventar una clave compuesta (receta+insumo) y borra sola las líneas que
 * el usuario haya eliminado de una receta.
 */
function replaceByParent_(accessToken, spreadsheetId, table, rows, capacity) {
  var existing = readRows_(accessToken, spreadsheetId, table);
  var parentIndex = table.fields.indexOf(table.parentKey);

  var touched = Object.create(null);
  var incoming = rows.map(function (row) {
    var values = toRow_(table, row);
    touched[String(values[parentIndex])] = true;
    return values;
  });

  var kept = existing.filter(function (row) {
    return !touched[String(row[parentIndex] === undefined ? '' : row[parentIndex])];
  });

  writeRows_(accessToken, spreadsheetId, table, kept.concat(incoming), existing.length, capacity);
  return rows.length;
}

function toRow_(table, source) {
  return table.fields.map(function (field) {
    var value = source[field];
    if (value === null || value === undefined) {
      return '';
    }
    return value;
  });
}

/** Filas de datos (sin la cabecera). */
function readRows_(accessToken, spreadsheetId, table) {
  var range = quoteRange_(table.sheet, 'A2:' + columnLetter_(table.fields.length));
  var response = fetchJson_(
    accessToken,
    'get',
    'https://sheets.googleapis.com/v4/spreadsheets/' +
      spreadsheetId +
      '/values/' +
      encodeURIComponent(range) +
      '?majorDimension=ROWS',
    null,
    true,
  );
  if (response.code !== 200) {
    return [];
  }
  var values = response.body.values || [];
  return values
    .filter(function (row) {
      return row.some(function (cell) {
        return String(cell).trim() !== '';
      });
    })
    .map(function (row) {
      var padded = row.slice(0, table.fields.length);
      while (padded.length < table.fields.length) {
        padded.push('');
      }
      return padded;
    });
}

/** Escribe el bloque completo y limpia la cola que sobra si la tabla se ha encogido. */
function writeRows_(accessToken, spreadsheetId, table, matrix, previousCount, capacity) {
  var lastColumn = columnLetter_(table.fields.length);

  ensureRows_(accessToken, spreadsheetId, table.sheet, matrix.length + 1, capacity);

  if (matrix.length > 0) {
    valuesBatchUpdate_(accessToken, spreadsheetId, [
      {
        range: quoteRange_(table.sheet, 'A2:' + lastColumn + (matrix.length + 1)),
        values: matrix,
      },
    ]);
  }

  if (previousCount > matrix.length) {
    var from = matrix.length + 2;
    var to = previousCount + 1;
    fetchJson_(
      accessToken,
      'post',
      'https://sheets.googleapis.com/v4/spreadsheets/' +
        spreadsheetId +
        '/values/' +
        encodeURIComponent(quoteRange_(table.sheet, 'A' + from + ':' + lastColumn + to)) +
        ':clear',
      {},
    );
  }
}

function writeMeta_(accessToken, spreadsheetId, sentAt) {
  valuesBatchUpdate_(accessToken, spreadsheetId, [
    {
      range: quoteRange_(META_SHEET, 'A1:B4'),
      values: [
        ['Clave', 'Valor'],
        ['schemaVersion', SCHEMA_VERSION],
        ['lastSyncAt', sentAt],
        ['generadoPor', 'Clapastedyke · sincronización automática'],
      ],
    },
  ]);
}

function valuesBatchUpdate_(accessToken, spreadsheetId, data) {
  if (!data || data.length === 0) {
    return;
  }
  fetchJson_(
    accessToken,
    'post',
    'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values:batchUpdate',
    { valueInputOption: 'RAW', data: data },
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Idempotencia: lock + caché de requestId
// ───────────────────────────────────────────────────────────────────────────────

function withLock_(operation) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    throw fail_('QUOTA', 'El script está ocupado atendiendo otra sincronización. Reinténtalo.');
  }
  try {
    return operation();
  } finally {
    lock.releaseLock();
  }
}

function cachedResult_(sub, requestId) {
  if (!requestId) {
    return null;
  }
  var raw = CacheService.getScriptCache().get(requestKey_(sub, requestId));
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function rememberResult_(sub, requestId, result) {
  if (!requestId) {
    return;
  }
  try {
    CacheService.getScriptCache().put(
      requestKey_(sub, requestId),
      JSON.stringify(result),
      REQUEST_CACHE_SECONDS,
    );
  } catch (error) {
    // La caché es una optimización: si el resultado no cabe, el upsert por clave ya garantiza
    // que repetir el lote converge al mismo estado.
  }
}

function requestKey_(sub, requestId) {
  return 'req:' + sub + ':' + requestId;
}

// ───────────────────────────────────────────────────────────────────────────────
// HTTP y utilidades
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Llamada REST con el token DEL USUARIO. Todo el acceso a Sheets y Drive pasa por aquí, y por eso
 * el aislamiento no depende de acordarse de comprobar nada en cada sitio.
 */
function fetchJson_(accessToken, method, url, body, tolerate) {
  var options = {
    method: method,
    headers: { Authorization: 'Bearer ' + accessToken },
    muteHttpExceptions: true,
  };
  if (body !== null && body !== undefined) {
    options.contentType = 'application/json; charset=utf-8';
    options.payload = JSON.stringify(body);
  }

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var text = response.getContentText();
  var parsed = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      parsed = { raw: text };
    }
  }

  if (code >= 200 && code < 300) {
    return { code: code, body: parsed };
  }
  if (tolerate) {
    return { code: code, body: parsed };
  }
  if (code === 401 || code === 403) {
    throw fail_(
      'UNAUTHENTICATED',
      'Google rechazó la operación (' + code + '): ' + apiMessage_(parsed),
    );
  }
  if (code === 429) {
    throw fail_('QUOTA', 'Google está limitando las peticiones. Reinténtalo en un momento.');
  }
  throw fail_('INTERNAL', 'Error de la API de Google (' + code + '): ' + apiMessage_(parsed));
}

function apiMessage_(parsed) {
  if (parsed && parsed.error) {
    return parsed.error.message || JSON.stringify(parsed.error);
  }
  return parsed && parsed.raw ? String(parsed.raw).slice(0, 300) : 'sin detalle';
}

/** `'RecetaInsumos'!A2:G` — las comillas son obligatorias si el nombre lleva `_` o espacios. */
function quoteRange_(sheetName, range) {
  return "'" + String(sheetName).replace(/'/g, "''") + "'!" + range;
}

function columnLetter_(count) {
  var letters = '';
  var n = count;
  while (n > 0) {
    var remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function fail_(code, message) {
  var error = new Error(message);
  error.syncCode = code;
  return error;
}

function errorBody_(error) {
  return {
    ok: false,
    error: {
      code: error && error.syncCode ? error.syncCode : 'INTERNAL',
      message: error && error.message ? error.message : String(error),
    },
  };
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

// ───────────────────────────────────────────────────────────────────────────────
// Prueba manual desde el editor (ver manual/appscript.md, paso 11)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Ejecuta esta función desde el editor de Apps Script para probar el script SIN la app web.
 * Pega en TEST_ACCESS_TOKEN un token del usuario (lo imprime la consola del navegador al conectar
 * en `/cuenta`, o se obtiene en https://developers.google.com/oauthplayground con el scope
 * `drive.file`). El resultado sale en Registros (Ver → Registros).
 */
function test_() {
  var TEST_ACCESS_TOKEN = 'PEGA_AQUI_UN_ACCESS_TOKEN';

  var response = doPost({
    postData: {
      contents: JSON.stringify({
        op: 'upsert',
        requestId: 'prueba-manual-' + new Date().getTime(),
        accessToken: TEST_ACCESS_TOKEN,
        sentAt: new Date().toISOString(),
        payload: {
          supplies: [
            {
              id: 'ing-prueba',
              name: 'Insumo de prueba',
              baseUnit: 'g',
              usage: 'recipe',
              priceAmount: 4.5,
              pricePerValue: 1000,
              pricePerUnit: 'g',
              currency: 'PEN',
              syncedAt: new Date().toISOString(),
            },
          ],
        },
      }),
    },
  });

  Logger.log(response.getContent());
}
