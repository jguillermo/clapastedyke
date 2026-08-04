import { Signal } from '@angular/core';
import { Account } from '../entities/account';
import { Credential } from '../value-objects/credential';

/**
 * Estado de la sesión. `epoch` es el número de sesión: **cambia con cada inicio y cada cierre**.
 *
 * Es el cerrojo del aislamiento entre cuentas: toda operación de red apunta el `epoch` que había al
 * empezar y descarta su resultado si al volver ya no coincide. Sin él, una respuesta lenta de la
 * cuenta A podría aplicarse cuando ya está dentro la cuenta B.
 */
export interface SessionSnapshot {
  account: Account | null;
  credential: Credential | null;
  epoch: number;
}

/**
 * Guarda la sesión activa. Servicio con estado, **no repositorio: no persiste nada**. Que viva en
 * memoria es lo que garantiza que, al cerrar sesión o recargar, no quede rastro del usuario.
 *
 * Que recargar no eche al usuario **no** se resuelve aquí guardando algo: se resuelve pidiéndole al
 * proveedor un token nuevo en silencio. Ver `ResumeSession`.
 */
export abstract class Session {
  /** Reactivo, para que la UI siga la sesión sin sondearla. */
  abstract readonly snapshot: Signal<SessionSnapshot>;

  /** Abre sesión (o la reemplaza, si entra otra cuenta) e incrementa el `epoch`. */
  abstract open(account: Account, credential: Credential): void;

  /**
   * Cambia la credencial **sin tocar el `epoch`**: es la misma sesión de la misma persona, solo que
   * con un token recién emitido porque el anterior caducaba.
   *
   * Que el `epoch` NO cambie es la razón de que esto exista en vez de reusar `open`. Una renovación
   * ocurre a mitad de un flujo, y si incrementara el número de sesión, cualquier operación en vuelo
   * creería que ha entrado otra cuenta y tiraría su resultado.
   *
   * Sin sesión abierta no hace nada: renovar lo que no existe no significa nada.
   */
  abstract renew(credential: Credential): void;

  /** Cierra la sesión, borra cuenta y credencial e incrementa el `epoch`. */
  abstract close(): void;
}
