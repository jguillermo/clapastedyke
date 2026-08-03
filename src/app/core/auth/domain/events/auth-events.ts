import { DomainEvent, domainEvent } from '@core/_common/eventbus/domain-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';

/**
 * Los cuatro eventos del contexto: entrar bien, entrar mal, salir bien, salir mal. Nombres en
 * pasado y payload de primitivos, sin una palabra del proveedor concreto.
 *
 * Los nombres viven en el shared kernel porque **cruzan la frontera**: quien reacciona a ellos no
 * puede importar de aquí (ver `core-conventions.md` → «Los contextos no se conocen»).
 */

/** `aggregateId` cuando el fallo ocurre antes de saber quién intentaba entrar. */
const ANONYMOUS = 'anonymous';

export const AuthEvents = {
  authenticationSucceeded: (accountId: string, email: string, epoch: number): DomainEvent =>
    domainEvent(IntegrationEventName.AUTHENTICATION_SUCCEEDED, accountId, { email, epoch }),

  authenticationFailed: (reason: string): DomainEvent =>
    domainEvent(IntegrationEventName.AUTHENTICATION_FAILED, ANONYMOUS, { reason }),

  signOutSucceeded: (accountId: string, epoch: number): DomainEvent =>
    domainEvent(IntegrationEventName.SIGN_OUT_SUCCEEDED, accountId, { epoch }),

  /**
   * La sesión local **siempre** queda cerrada; esto solo dice que no se pudo retirar la
   * autorización en el proveedor. Quien limpie estado al salir tiene que escuchar los dos.
   */
  signOutFailed: (accountId: string, epoch: number, reason: string): DomainEvent =>
    domainEvent(IntegrationEventName.SIGN_OUT_FAILED, accountId, { epoch, reason }),
};
