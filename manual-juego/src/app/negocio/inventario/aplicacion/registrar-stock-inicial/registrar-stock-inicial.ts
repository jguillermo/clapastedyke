import { EventoDominio } from '../../../compartido/dominio/evento-dominio';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Movimiento } from '../../dominio/movimiento/movimiento';
import { RepositorioMovimientos } from '../../dominio/movimiento/repositorio-movimientos';

/**
 * Suscriptor de InsumoCreado: si el alta trae stock inicial, deja el
 * movimiento 'inicial' en el kardex (el stock del insumo ya viene puesto
 * por el agregado — aquí solo se registra el hecho, como hace el GAS).
 */
export class RegistrarStockInicial {
  constructor(private readonly movimientos: RepositorioMovimientos) {}

  /** Conéctalo así: bus.suscribir('InsumoCreado', e => suscriptor.manejar(e)) */
  async manejar(evento: EventoDominio): Promise<void> {
    const stockInicial = Number(evento.datos['stockInicial'] ?? 0);
    if (!(stockInicial > 0)) return;

    const movimiento = Movimiento.registrar(await this.movimientos.siguienteId(), {
      insumoId: IdEntidad.desde(evento.agregadoId),
      insumoNombre: String(evento.datos['nombre'] ?? ''),
      tipo: 'inicial',
      cantidad: stockInicial,
      referencia: evento.agregadoId,
      motivo: 'Stock inicial del alta',
      stockResultante: stockInicial,
    });
    await this.movimientos.guardar(movimiento);
  }
}
