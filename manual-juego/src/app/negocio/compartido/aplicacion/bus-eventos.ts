import { EventoDominio } from '../dominio/evento-dominio';

export type ManejadorEvento = (evento: EventoDominio) => void | Promise<void>;

/**
 * Puerto del bus de eventos de dominio. Los casos de uso publican los eventos
 * que extraen de los agregados DESPUÉS de persistirlos.
 */
export interface BusEventos {
  publicar(eventos: EventoDominio[]): Promise<void>;
  suscribir(nombreEvento: string, manejador: ManejadorEvento): void;
}

/**
 * Bus síncrono en memoria — suficiente para un solo proceso (el navegador).
 * Un manejador que falla no tumba a los demás: el error se registra en consola.
 */
export class BusEventosEnMemoria implements BusEventos {
  private readonly manejadores = new Map<string, ManejadorEvento[]>();

  suscribir(nombreEvento: string, manejador: ManejadorEvento): void {
    const lista = this.manejadores.get(nombreEvento) ?? [];
    lista.push(manejador);
    this.manejadores.set(nombreEvento, lista);
  }

  async publicar(eventos: EventoDominio[]): Promise<void> {
    for (const evento of eventos) {
      for (const manejador of this.manejadores.get(evento.nombre) ?? []) {
        try {
          await manejador(evento);
        } catch (error) {
          console.error(`Manejador de ${evento.nombre} falló:`, error);
        }
      }
    }
  }
}
