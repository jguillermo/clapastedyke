import { DomainEvent, domainEvent } from '@core/_common/eventbus/domain-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';

/**
 * Eventos del contexto: los datos se sincronizaron, o no se pudo. Hoy no tienen suscriptor: existen
 * para que el mundo pueda reaccionar (una reacción del chef, un aviso) sin que este contexto tenga
 * que conocer a nadie.
 *
 * `aggregateId` es el destino donde quedó la copia — sin decir qué es.
 */
export const SyncEvents = {
  succeeded: (targetId: string, rows: number): DomainEvent =>
    domainEvent(IntegrationEventName.DATA_SYNCED, targetId, { rows }),
  failed: (targetId: string, code: string): DomainEvent =>
    domainEvent(IntegrationEventName.DATA_SYNC_FAILED, targetId, { code }),
};
