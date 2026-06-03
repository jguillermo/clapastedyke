import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { RepositorioMovimientos } from '../../../inventario/dominio/movimiento/repositorio-movimientos';
import { ServicioStock } from '../../../inventario/dominio/servicio-stock';
import { RepositorioPedidos } from '../../dominio/pedido/repositorio-pedidos';

export interface PeticionCancelarPedido {
  pedidoId: string;
  motivo?: string;
}

/**
 * Cancelar (Flujo 03.4): el stock consumido SE DEVUELVE ÍNTEGRO — revierte
 * cada movimiento 'consumo' del pedido con uno de 'cancelacion'. Un pedido
 * Entregado no se puede cancelar (guarda del agregado).
 */
export class CancelarPedido implements CasoDeUso<PeticionCancelarPedido, void> {
  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly movimientos: RepositorioMovimientos,
    private readonly stock: ServicioStock,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionCancelarPedido): Promise<void> {
    const pedido = await this.pedidos.porId(IdEntidad.desde(peticion.pedidoId));
    if (!pedido) throw new ErrorNoEncontrado('Pedido', peticion.pedidoId);

    pedido.cancelar(peticion.motivo ?? '');

    // Reversión: un 'cancelacion' (+) por cada 'consumo' (−) del pedido
    const consumos = await this.movimientos.porReferenciaYTipo(pedido.id.valor, 'consumo');
    for (const consumo of consumos) {
      await this.stock.moverPorId(
        consumo.insumoId,
        -consumo.cantidad, // el consumo es negativo → esto suma
        'cancelacion',
        pedido.id.valor,
        `Cancelación del pedido ${pedido.id.valor}`,
      );
    }

    await this.pedidos.guardar(pedido);
    await this.bus.publicar(pedido.extraerEventos());
  }
}
