import { SyncTarget } from '../value-objects/sync-target';

/**
 * Dónde tiene su copia cada cuenta. Repositorio puro: leer, guardar y olvidar.
 *
 * **Esto sí se persiste**, a diferencia de la sesión: sin ello, cada recarga crearía una hoja nueva
 * en el Drive del usuario y acabaría con veinte «Clapastedyke — Recetario» sin saber por qué. Lo que
 * nunca se guarda es la credencial — eso es sesión y vive en memoria.
 *
 * Una entrada por cuenta: dos personas en el mismo navegador tienen cada una la suya, y ninguna ve
 * la de la otra.
 */
export abstract class SyncTargetRepository {
  abstract forAccount(accountId: string): Promise<SyncTarget | null>;

  abstract save(accountId: string, target: SyncTarget): Promise<void>;

  /** Se olvida la hoja de una cuenta, para que la próxima conexión cree otra. */
  abstract remove(accountId: string): Promise<void>;
}
