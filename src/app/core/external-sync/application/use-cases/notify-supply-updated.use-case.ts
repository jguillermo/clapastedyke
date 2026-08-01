import { Injectable } from '@angular/core';
import { DomainEvent } from '@core/_common/eventbus/domain-event';
import { OnEvent } from '@core/_common/eventbus/on-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { UseCase } from '@core/_common/use-case';

/**
 * Deja constancia de que se editó un insumo del catálogo: renombrado, re-tarifado o ambos.
 *
 * El evento cuenta **qué** cambió (`renamed` / `repriced`) pero no a qué valor — el payload es
 * mínimo a propósito, para que nadie pueda reconstruir el modelo del recetario desde fuera. Quien
 * necesite el dato lo pide por el contrato de exportación del shared kernel.
 *
 * Corre **fuera** del guardado y se reintenta si falla. Hoy solo escribe en consola; aquí es donde
 * entrará la actualización remota asíncrona.
 */
@OnEvent(IntegrationEventName.SUPPLY_UPDATED)
@Injectable({ providedIn: 'root' })
export class NotifySupplyUpdated extends UseCase<DomainEvent, void> {
  async execute(event: DomainEvent): Promise<void> {
    // eslint-disable-next-line no-console -- traza provisional: el sitio donde irá el envío remoto.
    console.log('[external-sync] Insumo editado', {
      supplyId: event.aggregateId,
      renamed: event.data['renamed'],
      repriced: event.data['repriced'],
      occurredOn: event.occurredOn.toISOString(),
    });
  }
}
