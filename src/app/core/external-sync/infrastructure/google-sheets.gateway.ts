import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { SyncGateway } from '../domain/services/sync.gateway';
import {
  CredentialRequest,
  ProbeOutcome,
  ProbeRequest,
  SyncError,
  TargetRequest,
} from '../domain/services/sync.gateway.types';
import { SyncTarget } from '../domain/value-objects/sync-target';
import { googleFetch } from './google-api';
import {
  INITIAL_ROWS,
  META_TAB,
  PROBE_KEY,
  PROBE_ROW,
  rangeOf,
  SPREADSHEET_NAME,
} from './sheet-schema';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

/** Lo que Drive llama a una hoja de cálculo. Acota la búsqueda a hojas y no a cualquier fichero. */
const SPREADSHEET_MIME = 'application/vnd.google-apps.spreadsheet';

/**
 * Todo lo que se escribe va en crudo. Sin esto, Sheets interpreta las cadenas como si las tecleara
 * una persona: un insumo llamado «12/03» se convertiría en fecha y uno que empiece por `=`, en
 * **fórmula**.
 */
const RAW = 'RAW';

interface SheetProperties {
  sheetId: number;
  title: string;
  gridProperties?: { rowCount?: number };
}

interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets?: { properties: SheetProperties }[];
}

/** Lo que devuelve la búsqueda en Drive. `webViewLink` es la dirección que el usuario abre. */
interface DriveFile {
  id: string;
  webViewLink?: string;
}

interface ValueRange {
  range?: string;
  values?: string[][];
}

/**
 * Escribe la copia del usuario **directamente en su hoja de Google**, con las APIs de Sheets y
 * Drive y su propio token.
 *
 * Este fichero es el único del contexto que sabe que el destino es una hoja de cálculo. Cambiar de
 * destino es escribir otro `SyncGateway` y tocar una línea de `external-sync.providers.ts`.
 *
 * ## Por qué no hay nada instalado en la cuenta del usuario
 *
 * La app crea la hoja y la escribe ella misma. No hay script que desplegar, ni interruptor que
 * encender, ni secreto que custodiar: **una sola casilla de permiso** (`drive.file`) y ya. Y ese
 * permiso es el más estrecho que existe — alcanza *solo los ficheros que esta app ha creado*, así que
 * la hoja recién creada entra y el resto del Drive del usuario no.
 *
 * ## Lo que hay que saber antes de tocar esto
 *
 * **Fusionar es leer, mezclar y reescribir el bloque entero.** El resultado no depende del estado
 * previo, y eso es justo lo que hace la operación idempotente: mandar dos veces el mismo lote deja la
 * hoja igual. Con decenas o cientos de filas sobra; con miles habría que paginar.
 *
 * **Sheets no crece sola.** Escribir fuera de la cuadrícula no la amplía: falla. Por eso se mira
 * cuántas filas tiene cada pestaña antes de escribir y se amplía en la misma llamada estructural que
 * crea las pestañas que falten.
 *
 * **Todo va en `RAW`.** Ver la constante: es lo que impide que un nombre se vuelva fecha o fórmula.
 *
 * Lo único que se pierde frente a un script alojado en Google es el bloqueo entre pestañas del mismo
 * usuario escribiendo a la vez. La convergencia del upsert lo hace inofensivo: la última en escribir
 * deja la hoja consistente, no a medias.
 */
@Injectable()
export class GoogleSheetsGateway extends SyncGateway {
  private readonly log = inject(Logger).scoped('external-sync/google-sheets');

  /**
   * Crea la hoja del usuario con **solo la pestaña de servicio**.
   *
   * Las pestañas de datos no se crean aquí y no es un olvido: sus columnas se deducen de los datos, así
   * que hasta el primer ciclo no se sabe cuáles son. Crearlas ahora obligaría a mantener en este
   * fichero una lista de tablas y columnas —justo lo que este diseño quita— y dejaría al usuario una
   * hoja llena de pestañas vacías con cabeceras que igual no coinciden con lo que se escriba después.
   *
   * Las crea la primera escritura, cada una con sus columnas reales.
   */
  async create({ credential }: CredentialRequest): Promise<SyncTarget> {
    this.log.debug('creando la hoja del usuario ▶');
    const created = await googleFetch<SpreadsheetMetadata>(credential, 'POST', SHEETS_API, {
      properties: { title: SPREADSHEET_NAME },
      sheets: [
        {
          properties: {
            title: META_TAB,
            index: 0,
            gridProperties: { rowCount: INITIAL_ROWS, frozenRowCount: 1 },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [{ values: [cell('Clave'), cell('Valor')] }],
            },
          ],
        },
      ],
    });

    this.log.debug('hoja creada', { targetId: created.spreadsheetId });
    return SyncTarget.of(created.spreadsheetId, created.spreadsheetUrl);
  }

  /**
   * Busca en el Drive del usuario la hoja de esta app, por su nombre.
   *
   * ## Por qué se puede buscar con `drive.file`
   *
   * El permiso alcanza **los ficheros que esta app creó**, y esa asociación la guarda Drive por
   * aplicación —no por dispositivo ni por sesión—, así que la hoja que creó este mismo Client ID en otro
   * teléfono aparece aquí. La búsqueda no ve nada más del Drive del usuario: no hace falta ningún
   * permiso extra y no se puede tropezar con un fichero ajeno que se llame igual.
   *
   * ## Se coge la más antigua, a propósito
   *
   * Si ya hubiera varias —de una versión anterior que creaba una por dispositivo, o de dos dispositivos
   * conectando en el mismo instante—, todos los dispositivos eligen **la primera que se creó**, así que
   * convergen a la misma en vez de repartirse. Las demás **no se tocan**: son ficheros del usuario y
   * solo él decide si las tira.
   */
  async locate({ credential }: CredentialRequest): Promise<SyncTarget | null> {
    // Las comillas simples delimitan el valor en la sintaxis de búsqueda de Drive, así que las del
    // propio nombre habría que escaparlas. El nombre no lleva ninguna, pero se escapa igual: es una
    // constante que alguien puede cambiar.
    const name = SPREADSHEET_NAME.replace(/'/g, "\\'");
    const query = `name = '${name}' and mimeType = '${SPREADSHEET_MIME}' and trashed = false`;
    const url =
      `${DRIVE_API}?q=${encodeURIComponent(query)}` +
      '&fields=files(id,webViewLink)&orderBy=createdTime&pageSize=10&spaces=drive';

    this.log.debug('buscando la hoja de esta cuenta en Drive ▶');
    const found = await googleFetch<{ files?: DriveFile[] }>(credential, 'GET', url);
    const files = found.files ?? [];

    if (files.length === 0) {
      this.log.debug('la cuenta todavía no tiene hoja de esta app');
      return null;
    }
    if (files.length > 1) {
      // Que quede dicho: el usuario tiene copias de sobra en su Drive y conviene que lo sepa.
      this.log.warn('hay más de una hoja con este nombre; se usa la más antigua', undefined, {
        hojas: files.length,
      });
    }

    const [oldest] = files;
    this.log.debug('la cuenta ya tenía su hoja', { targetId: oldest.id });
    return SyncTarget.of(oldest.id, oldest.webViewLink ?? sheetUrlOf(oldest.id));
  }

  /**
   * Se lo pregunta a **Drive**, no a Sheets, porque es Drive quien sabe de papeleras: una hoja en la
   * papelera sigue respondiendo a Sheets, y escribir en ella sería tirar los datos a un sitio que el
   * usuario ya dio por borrado.
   */
  async exists({ credential, target }: TargetRequest): Promise<boolean> {
    const url = `${DRIVE_API}/${encodeURIComponent(target.id)}?fields=id,trashed`;
    const file = await googleFetch<{ trashed?: boolean } | null>(
      credential,
      'GET',
      url,
      undefined,
      {
        tolerate: [404],
      },
    );
    const alive = file !== null && file.trashed !== true;
    this.log.debug('comprobado el destino en Drive', { targetId: target.id, alive });
    return alive;
  }

  async probe({ credential, target, probe }: ProbeRequest): Promise<ProbeOutcome> {
    const range = rangeOf(META_TAB, `A${PROBE_ROW}:C${PROBE_ROW}`);
    this.log.debug('prueba de ida y vuelta ▶');

    await this.write(credential, target, [
      { range, values: [[PROBE_KEY, probe.value, new Date().toISOString()]] },
    ]);

    // Se relee de la hoja en lugar de devolver lo que se mandó: un eco del propio parámetro no
    // demostraría nada — pasaría igual con la hoja borrada o sin permiso de escritura.
    const read = await googleFetch<ValueRange>(
      credential,
      'GET',
      `${sheet(target)}/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
    );
    const echo = read.values?.[0]?.[1] ?? '';

    this.log.debug('prueba de ida y vuelta ✔', { conEco: echo.length > 0 });
    return { echo };
  }

  /** El único sitio que escribe en la hoja desde aquí: la prueba de ida y vuelta. */
  private async write(
    credential: string,
    target: SyncTarget,
    data: readonly { range: string; values: string[][] }[],
  ): Promise<void> {
    await googleFetch(credential, 'POST', `${sheet(target)}/values:batchUpdate`, {
      valueInputOption: RAW,
      data,
    });
  }
}

function sheet(target: SyncTarget): string {
  return `${SHEETS_API}/${encodeURIComponent(target.id)}`;
}

/** La dirección que abre una hoja, para cuando la búsqueda no devuelve la suya. */
function sheetUrlOf(id: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

function cell(value: string): { userEnteredValue: { stringValue: string } } {
  return { userEnteredValue: { stringValue: value } };
}

/** Se re-exporta para que el resto del contexto no importe el transporte por su cuenta. */
export { SyncError };
