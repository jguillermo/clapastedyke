import { inject, Injectable } from '@angular/core';
import { CredentialsProvider } from '@core/_common/credentials/credentials-provider';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { SyncTargetRepository } from '../../domain/repositories/sync-target.repository';
import { SyncGateway } from '../../domain/services/sync.gateway';
import { SyncError } from '../../domain/services/sync.gateway.types';
import { SyncShadow } from '../../domain/services/sync-shadow';

export interface PrepareSyncTargetResult {
  /** Dirección donde el usuario puede abrir su copia. */
  targetUrl: string;
  /** `true` si se acaba de crear la hoja; `false` si ya la tenía y se reutiliza. */
  created: boolean;
}

/**
 * Deja lista la hoja del usuario: la suya si ya la tiene, una nueva **solo si no tiene ninguna**.
 *
 * ## Cuatro estados, y el tercero es el que evita duplicar
 *
 * 1. **Hay una recordada y sigue ahí** → se reutiliza tal cual, sin tocar nada.
 * 2. **Hay una recordada pero ya no existe** (la borró o la mandó a la papelera) → se olvida.
 * 3. **No hay ninguna recordada, pero la cuenta ya tiene la suya** → se **adopta**. Es el caso de un
 *    dispositivo nuevo, y el que hace que la hoja sea una por cuenta y no una por aparato.
 * 4. **La cuenta no tiene ninguna** → se crea. Es la primera vez, y ocurre **una sola vez por cuenta**.
 *
 * El 2 es la razón de preguntar antes de dar nada por bueno: sin esa comprobación, «borré la hoja»
 * acabaría en un 404 a mitad de la sincronización, con los cambios del usuario ya en vuelo. Se pregunta
 * a **Drive**, que es quien sabe de papeleras (una hoja en la papelera todavía responde a Sheets, y
 * escribir en ella sería tirar los datos a un sitio que el usuario dio por borrado).
 *
 * El 3 es la razón de que este caso de uso no se fíe de lo que recuerda. **Lo recordado es por
 * navegador**, y la hoja es **por cuenta**: un móvil nuevo, otro navegador o unos datos del sitio
 * borrados llegan sin saber nada, y antes creaban otra hoja con el mismo nombre en el mismo Drive.
 * Preguntárselo al destino (`SyncGateway.locate`) es lo único que da una respuesta que no dependa del
 * dispositivo.
 *
 * Es idempotente: llamarlo dos veces seguidas no crea dos hojas — ni en el mismo dispositivo ni en dos
 * distintos.
 *
 * > **Límite conocido**: dos dispositivos que conecten en el **mismo instante** pueden crear dos hojas,
 * > porque Drive no ofrece un «crear si no existe» atómico. Del ciclo siguiente en adelante los dos
 * > eligen la más antigua y convergen; la otra se queda en el Drive del usuario, que es el único que
 * > puede decidir tirarla.
 */
@Injectable({ providedIn: 'root' })
export class PrepareSyncTarget extends UseCase<void, PrepareSyncTargetResult> {
  private readonly credentials = inject(CredentialsProvider);
  private readonly targets = inject(SyncTargetRepository);
  private readonly gateway = inject(SyncGateway);
  private readonly shadow = inject(SyncShadow);
  private readonly log = inject(Logger).scoped('external-sync/prepare-sync-target');

  async execute(): Promise<PrepareSyncTargetResult> {
    this.log.debug('ejecutando');

    const credentials = await this.credentials.current();
    if (!credentials) {
      this.log.debug('sin credenciales → no hay Drive donde crear nada');
      throw new SyncError(
        'UNAUTHENTICATED',
        'No hay ninguna cuenta conectada, así que no se puede preparar dónde guardar la copia.',
      );
    }

    const remembered = await this.targets.forAccount(credentials.accountId);
    if (remembered) {
      if (await this.gateway.exists({ credential: credentials.token, target: remembered })) {
        this.log.debug('la hoja recordada sigue ahí, se reutiliza', { targetId: remembered.id });
        return { targetUrl: remembered.url, created: false };
      }
      this.log.debug('la hoja recordada ya no existe, se olvidará', { targetId: remembered.id });
      await this.forget(credentials.accountId);
    }

    // Antes de crear nada: ¿la cuenta ya tiene su hoja? Este dispositivo no lo sabe —lo recordado es
    // por navegador— pero el destino sí. Es lo que impide una hoja por aparato.
    const existing = await this.gateway.locate({ credential: credentials.token });
    if (existing) {
      await this.targets.save(credentials.accountId, existing);
      this.log.debug('la cuenta ya tenía su hoja, se adopta sin crear otra', {
        targetId: existing.id,
      });
      return { targetUrl: existing.url, created: false };
    }

    return this.createFor(credentials.accountId, credentials.token);
  }

  /**
   * Olvida la hoja de esta cuenta y crea otra desde cero.
   *
   * Es la salida cuando la que hay dejó de servir de una forma que `exists()` no detecta —alguien le
   * cambió las pestañas a mano, por ejemplo—. **La anterior no se borra**: se queda en el Drive del
   * usuario, que es el único que puede decidir tirar sus datos.
   */
  async recreate(): Promise<PrepareSyncTargetResult> {
    const credentials = await this.credentials.current();
    if (!credentials) {
      throw new SyncError(
        'UNAUTHENTICATED',
        'No hay ninguna cuenta conectada, así que no se puede preparar dónde guardar la copia.',
      );
    }

    this.log.debug('olvidando la hoja anterior para crear otra');
    await this.forget(credentials.accountId);

    // **No pasa por `execute()` a propósito**: `execute` busca antes de crear, y aquí la búsqueda
    // encontraría justo la hoja que se acaba de dar por inservible. Quien pulsa «crear otra» quiere una
    // nueva, no la de siempre.
    return this.createFor(credentials.accountId, credentials.token);
  }

  /** Crea la hoja y la recuerda. El único sitio que crea. */
  private async createFor(accountId: string, token: string): Promise<PrepareSyncTargetResult> {
    const target = await this.gateway.create({ credential: token });
    await this.targets.save(accountId, target);

    this.log.debug('hoja creada y recordada', { targetId: target.id });
    return { targetUrl: target.url, created: true };
  }

  /**
   * Olvida la hoja de una cuenta **y su base de comparación**. Las dos cosas, siempre.
   *
   * La base dice «esto es lo que había en la hoja», y **no apunta a cuál**. Si sobreviviera al
   * reemplazo, la hoja nueva —que nace vacía— se compararía contra una base llena: cada fila parecería
   * borrada a mano, el tope de borrado masivo abortaría el ciclo, y como el motivo no se arregla solo, lo
   * abortaría **en todos los ciclos siguientes**. El usuario se quedaría con una hoja nueva vacía, un
   * error permanente y sus recetas sin subir.
   */
  private async forget(accountId: string): Promise<void> {
    await this.targets.remove(accountId);
    await this.shadow.clear();
  }
}
