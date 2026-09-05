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
 * En qué situación está la sesión. Se **deriva** del snapshot, no se guarda: un estado duplicado es
 * un estado que puede contradecir al que describe.
 *
 * `offline` es una sesión de verdad —sabemos de quién es— a la que le falta la autorización para
 * actuar. No es un error ni un estado a medias: es lo que hay mientras no se puede hablar con el
 * servicio de sesión.
 */
export type SessionPhase = 'disconnected' | 'offline' | 'active';

export function phaseOf(snapshot: SessionSnapshot): SessionPhase {
  if (!snapshot.account) {
    return 'disconnected';
  }
  return snapshot.credential ? 'active' : 'offline';
}

/**
 * Guarda la sesión activa. Servicio con estado, **no repositorio: no persiste nada**. Que viva en
 * memoria es lo que garantiza que, al cerrar sesión o recargar, no quede rastro del usuario.
 *
 * Que recargar no eche al usuario **no** se resuelve aquí guardando algo: se resuelve pidiéndole al
 * servicio de sesión un token nuevo en silencio. Ver `ResumeSession`.
 */
export abstract class Session {
  /** Reactivo, para que la UI siga la sesión sin sondearla. */
  abstract readonly snapshot: Signal<SessionSnapshot>;

  /** Abre sesión (o la reemplaza, si entra otra cuenta) e incrementa el `epoch`. */
  abstract open(account: Account, credential: Credential): void;

  /**
   * Abre la sesión **sabiendo de quién es pero sin autorización para actuar**: es la sesión de quien
   * recarga la página sin conexión.
   *
   * Existe porque sin ella «hay sesión» y «se puede operar» son el mismo hecho, y entonces quedarse
   * sin cobertura es indistinguible de no haber entrado nunca — la pantalla de cuenta ofrecería
   * «Conectar con Google» a alguien que ya está dentro.
   *
   * Al no haber credencial, nada puede actuar en nombre del usuario: no hace falta prohibirlo en
   * ningún sitio, no hay con qué.
   */
  abstract openOffline(account: Account): void;

  /**
   * Cambia la credencial **sin tocar el `epoch`**: es la misma sesión de la misma persona, solo que
   * con un token recién emitido porque el anterior caducaba.
   *
   * Que el `epoch` NO cambie es la razón de que esto exista en vez de reusar `open`. Una renovación
   * ocurre a mitad de un flujo, y si incrementara el número de sesión, cualquier operación en vuelo
   * creería que ha entrado otra cuenta y tiraría su resultado.
   *
   * **No es la puerta por la que una sesión `offline` pasa a `active`.** Esa se abre con `open`, y no
   * por capricho: la cuenta de una sesión sin conexión es un esbozo armado con la pista guardada, sin
   * nombre ni avatar, y aquí no se toca la cuenta — se quedaría el esbozo para siempre.
   *
   * Sin sesión abierta no hace nada: renovar lo que no existe no significa nada.
   */
  abstract renew(credential: Credential): void;

  /** Cierra la sesión, borra cuenta y credencial e incrementa el `epoch`. */
  abstract close(): void;
}
