import { DomainEvent } from './domain-event';

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

/**
 * Puerto para publicar eventos de dominio hacia quien esté interesado (en este contexto o en otro).
 * El contrato vive en el shared kernel; el transporte concreto se enlaza por providers.
 *
 * **Publicar es encolar, no repartir.** `publish()` devuelve el control cuando el evento está
 * anotado, no cuando lo han recibido los suscriptores. El reparto lo hace después un proceso aparte,
 * uno a uno y en orden de llegada. Así el caso de uso que guarda no paga el precio de los
 * suscriptores, y un corte entre publicar y repartir no se traga el evento.
 *
 * **Garantía de entrega: al menos una vez, por suscriptor.** No basta con «el evento se repartió»:
 * se lleva la cuenta de QUIÉN lo ha recibido ya. Si dos suscriptores escuchan lo mismo y uno falla,
 * en el siguiente intento solo se reintenta el que falló — al que ya lo recibió no se le entrega dos
 * veces. El evento no se borra hasta que le ha llegado a todos.
 *
 * **Un evento puede repartirse después de una recarga**, si el proceso murió antes de terminar. Un
 * suscriptor cuya reacción solo tenga sentido dentro de la sesión que lo publicó debe comprobarlo él
 * mismo (ver `AuthChangedSubscriber`): el bus reparte, no interpreta.
 *
 * **Todos reciben exactamente el mismo evento.** El objeto se reconstruye una vez por reparto y se
 * entrega congelado a todos: ningún suscriptor puede alterar lo que le llega al siguiente.
 */
export abstract class EventBus {
  abstract publish(events: readonly DomainEvent[]): Promise<void>;

  /**
   * Engancha un suscriptor a un evento.
   *
   * `subscriber` es un **identificador estable** (`'external-sync:recipe-book-changed'`), no un
   * nombre decorativo: es la clave con la que se anota que este suscriptor ya recibió un evento, y
   * tiene que seguir siendo el mismo entre recargas para que esa cuenta sirva de algo. Dos
   * suscripciones con el mismo id al mismo evento son la misma: la última gana.
   */
  abstract subscribe(subscriber: string, eventName: string, handler: EventHandler): void;
}
