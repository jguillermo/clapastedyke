import { inject, Injectable } from '@angular/core';
import { IndexedDbStore } from '@core/_common/infrastructure/indexeddb/store';
import { Logger } from '@core/_common/logger/logger';
import { DeviceIdentity } from '../domain/services/device-identity';

/** Documento plano. Clave fija: un navegador es un solo dispositivo. */
interface DeviceRecord {
  id: string;
  deviceId?: string;
}

const RECORD_ID = 'device';

/**
 * Cuántos caracteres del UUID se guardan. Son 8 hexadecimales —4.300 millones de combinaciones—, de
 * sobra para los dos o tres dispositivos de una persona, y la columna de versión de la hoja se queda
 * legible en vez de arrastrar 36 caracteres por fila.
 *
 * Se cortan del **primer grupo** del UUID, que es justo de 8 y no lleva guiones: la versión se lee
 * partiendo por guiones, así que un identificador con guiones rompería el formato.
 */
const LENGTH = 8;

/**
 * El identificador de este navegador, en IndexedDB.
 *
 * Se crea la primera vez que alguien lo pide y no vuelve a cambiar. Se memoiza la **promesa** y no el
 * valor porque al arrancar lo piden varias cosas a la vez: sin eso, dos llamadas simultáneas podrían
 * generar dos identificadores y guardar el último, y este dispositivo cambiaría de identidad a mitad
 * de sesión —que es como perder los desempates de forma impredecible.
 */
@Injectable()
export class IndexedDbDeviceIdentity extends DeviceIdentity {
  private readonly store = new IndexedDbStore<DeviceRecord>('sync_device');
  private readonly log = inject(Logger).scoped('external-sync/device');

  private resolving: Promise<string> | null = null;

  current(): Promise<string> {
    this.resolving ??= this.resolve();
    return this.resolving;
  }

  private async resolve(): Promise<string> {
    const stored = await this.store.get(RECORD_ID);
    if (stored?.deviceId && isUsable(stored.deviceId)) {
      this.log.debug('identidad de dispositivo leída', { deviceId: stored.deviceId });
      return stored.deviceId;
    }

    // Un registro con un identificador inservible (de una versión anterior, o con guiones) se
    // reemplaza en vez de arreglarse: es un número aleatorio sin significado, y cambiarlo solo afecta
    // a cómo se desempata un conflicto simultáneo.
    const deviceId = mint();
    await this.store.put({ id: RECORD_ID, deviceId });
    this.log.debug('identidad de dispositivo creada', { deviceId, reemplaza: stored !== null });
    return deviceId;
  }
}

/** Sin guiones y no vacío: lo que el formato de la versión puede transportar. */
function isUsable(deviceId: string): boolean {
  return deviceId.length > 0 && !deviceId.includes('-');
}

function mint(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, LENGTH);
}
