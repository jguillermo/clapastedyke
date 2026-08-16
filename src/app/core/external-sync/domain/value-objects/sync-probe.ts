/**
 * El dato de prueba de una comprobación de conexión: se manda al destino y se espera **el mismo** de
 * vuelta, leído de donde quedó escrito.
 *
 * Es un value object y no un `string` porque lleva la única regla que tiene la comprobación: qué
 * cuenta como «ha vuelto bien». Con la regla aquí, ni el caso de uso ni el transporte pueden
 * relajarla por su cuenta (comparar ignorando mayúsculas, dar por bueno un vacío…).
 *
 * Su valor no significa nada y no se guarda: es un dato irrepetible que solo sirve para distinguir
 * «esto es lo que acabo de escribir» de «esto ya estaba ahí».
 */
export class SyncProbe {
  private constructor(readonly value: string) {}

  static of(value: string): SyncProbe {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error('Una prueba de conexión sin valor no demostraría nada.');
    }
    return new SyncProbe(trimmed);
  }

  /**
   * `true` si lo que devolvió el destino es exactamente lo que se mandó.
   *
   * Se recorta al comparar porque el destino puede ser una hoja de cálculo, y una hoja normaliza lo
   * que guarda; lo que no se hace es aflojar nada más: un vacío, un valor a medias o el de una
   * prueba anterior son un fallo, y esa es justamente la información que se busca.
   */
  matches(echo: string): boolean {
    return echo.trim() === this.value;
  }

  equals(other: SyncProbe): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
