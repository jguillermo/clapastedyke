import { EventoDominio } from './evento-dominio';

/**
 * Raíz de agregado: protege sus invariantes y acumula los eventos de dominio
 * que produce. El caso de uso los extrae y publica después de persistir.
 */
export abstract class AgregadoRaiz {
  private eventos: EventoDominio[] = [];

  protected registrarEvento(evento: EventoDominio): void {
    this.eventos.push(evento);
  }

  /** Devuelve los eventos pendientes y vacía la cola (se publican una vez). */
  extraerEventos(): EventoDominio[] {
    const pendientes = this.eventos;
    this.eventos = [];
    return pendientes;
  }
}
