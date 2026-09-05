import { Injectable, signal, Signal } from '@angular/core';
import { Account } from '../domain/entities/account';
import { Session, SessionSnapshot } from '../domain/services/session';
import { Credential } from '../domain/value-objects/credential';

const EMPTY: SessionSnapshot = { account: null, credential: null, epoch: 0 };

/**
 * La sesión vive **solo en memoria**. No es una limitación pendiente de resolver: es el mecanismo
 * que hace cierto el requisito «al cerrar sesión no queda nada en la aplicación». Al recargar no hay
 * credencial ni identidad que borrar porque nunca salieron de la memoria del proceso.
 *
 * Recargar tampoco echa al usuario, y no porque aquí se guarde nada: al arrancar se le pide al
 * proveedor un token nuevo en silencio (ver `ResumeSession`). Esta clase sigue sin saber de disco.
 */
@Injectable()
export class InMemorySession extends Session {
  private readonly state = signal<SessionSnapshot>(EMPTY);

  readonly snapshot: Signal<SessionSnapshot> = this.state.asReadonly();

  open(account: Account, credential: Credential): void {
    this.state.update((current) => ({ account, credential, epoch: current.epoch + 1 }));
  }

  openOffline(account: Account): void {
    this.state.update((current) => ({ account, credential: null, epoch: current.epoch + 1 }));
  }

  renew(credential: Credential): void {
    // Sin cuenta no hay sesión que renovar; y el `epoch` se conserva a propósito (ver el puerto).
    this.state.update((current) => (current.account ? { ...current, credential } : current));
  }

  close(): void {
    this.state.update((current) => ({ account: null, credential: null, epoch: current.epoch + 1 }));
  }
}
