import { Injectable } from '@angular/core';
import { DomainEvent } from '@core/_common/eventbus/domain-event';
import { OnEvent } from '@core/_common/eventbus/on-event';
import { IntegrationEventName } from '@core/_common/events/integration-events';
import { UseCase } from '@core/_common/use-case';

/**
 * Deja constancia de que se guardó un insumo del catálogo. **Un solo evento**: no distingue el alta
 * de la edición, ni qué campo se tocó — persistir es persistir.
 *
 * El payload es mínimo a propósito (id + nombre): nadie debe poder reconstruir el modelo del
 * recetario desde fuera. Quien necesite el dato lo pide por el contrato de exportación del shared
 * kernel.
 *
 * Corre **fuera** del guardado y se reintenta si falla, así que tiene que aguantar repetirse. Hoy
 * solo escribe en consola; aquí es donde entrará la actualización remota asíncrona.
 */
@OnEvent(IntegrationEventName.SUPPLY_SAVED)
@Injectable({ providedIn: 'root' })
export class NotifySupplySaved extends UseCase<DomainEvent, void> {
  async execute(event: DomainEvent): Promise<void> {
    // eslint-disable-next-line no-console -- traza provisional: el sitio donde irá el envío remoto.
    console.log('[external-sync] Insumo guardado', {
      supplyId: event.aggregateId,
      // El payload trae el estado completo del insumo (nombre, unidad, uso, precio de compra).
      ...event.data,
      occurredOn: event.occurredOn.toISOString(),
    });
  }
}
