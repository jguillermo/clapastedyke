import { DomainEvent, domainEvent } from '@core/_common/eventbus/domain-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';

/**
 * Los eventos del contexto: entrar bien, entrar mal, volver sin pedir nada, salir bien, salir mal.
 * Nombres en pasado y payload de primitivos, sin una palabra del proveedor concreto.
 *
 * Los nombres viven en el shared kernel porque **cruzan la frontera**: quien reacciona a ellos no
 * puede importar de aquí (ver `core-conventions.md` → «Los contextos no se conocen»).
 */

/** `aggregateId` cuando el fallo ocurre antes de saber quién intentaba entrar. */
const ANONYMOUS = 'anonymous';

export const AuthEvents = {
  authenticationSucceeded: (accountId: string, email: string, epoch: number): DomainEvent =>
    domainEvent(IntegrationEventName.AUTHENTICATION_SUCCEEDED, accountId, { email, epoch }),

  /**
   * La sesión de siempre, recuperada sola al recargar. Aparte de `authenticationSucceeded` a
   * propósito: quien reacciona a «ha entrado alguien» limpia lo de la cuenta anterior, y aquí no hay
   * cuenta anterior que limpiar — es la misma, y lo que quedó pendiente es suyo.
   */
  sessionResumed: (accountId: string, epoch: number): DomainEvent =>
    domainEvent(IntegrationEventName.SESSION_RESUMED, accountId, { epoch }),

  authenticationFailed: (reason: string): DomainEvent =>
    domainEvent(IntegrationEventName.AUTHENTICATION_FAILED, ANONYMOUS, { reason }),

  /**
   * Único evento de salida, porque salir solo tiene un final: o se cierra la sesión en el servicio
   * y aquí, o no se cierra en ninguno de los dos. `SignOut` se niega a cerrar en local lo que no ha
   * podido cerrar fuera.
   */
  signOutSucceeded: (accountId: string, epoch: number): DomainEvent =>
    domainEvent(IntegrationEventName.SIGN_OUT_SUCCEEDED, accountId, { epoch }),
};
