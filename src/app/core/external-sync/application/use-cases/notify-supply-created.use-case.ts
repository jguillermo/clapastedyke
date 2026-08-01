import { Injectable } from '@angular/core';
import { DomainEvent } from '@core/_common/eventbus/domain-event';
import { OnEvent } from '@core/_common/eventbus/on-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { UseCase } from '@core/_common/use-case';

/**
 * Deja constancia de que apareció un insumo nuevo en el catálogo.
 *
 * Corre **fuera** del guardado (el bus reparte después de publicar) y se reintenta si falla, así que
 * lo que se haga aquí tiene que aguantar repetirse. Hoy solo escribe en consola; aquí es donde
 * entrará la actualización remota asíncrona.
 */
@OnEvent(IntegrationEventName.SUPPLY_CREATED)
@Injectable({ providedIn: 'root' })
export class NotifySupplyCreated extends UseCase<DomainEvent, void> {
  async execute(event: DomainEvent): Promise<void> {
    // eslint-disable-next-line no-console -- traza provisional: el sitio donde irá el envío remoto.
    console.log('[external-sync] Insumo creado', {
      supplyId: event.aggregateId,
      name: event.data['name'],
      occurredOn: event.occurredOn.toISOString(),
    });
  }
}
