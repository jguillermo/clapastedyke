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
 * El coste es volver a conectar tras recargar; el proveedor no repite el consentimiento si ya se
 * concedió, así que son un par de clics.
 */
@Injectable()
export class InMemorySession extends Session {
  private readonly state = signal<SessionSnapshot>(EMPTY);

  readonly snapshot: Signal<SessionSnapshot> = this.state.asReadonly();

  open(account: Account, credential: Credential): void {
    this.state.update((current) => ({ account, credential, epoch: current.epoch + 1 }));
  }

  close(): void {
    this.state.update((current) => ({ account: null, credential: null, epoch: current.epoch + 1 }));
  }
}
