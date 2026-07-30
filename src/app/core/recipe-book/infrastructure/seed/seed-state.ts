/**
 * Marca qué seeds ya se aplicaron, para ejecutar la siembra **una sola vez**. Persistido en la
 * infraestructura (IndexedDB). Cada seed se identifica por una `key` y guarda la `version` aplicada:
 * así, subir la versión del seed permite volver a aplicarlo intencionadamente. Abstracción para poder
 * swapear la fuente en tests (igual que las repositories).
 */
export abstract class SeedState {
  /** Versión del seed `key` ya aplicada, o `null` si nunca se aplicó. */
  abstract appliedVersion(key: string): Promise<number | null>;
  /** Registra que el seed `key` se aplicó en la versión `version`. */
  abstract markApplied(key: string, version: number): Promise<void>;
}
