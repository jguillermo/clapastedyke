import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { ServicioStock } from '../../../inventario/dominio/servicio-stock';
import { RepositorioPedidos } from '../../dominio/pedido/repositorio-pedidos';
import { descontarStockDePedido } from '../descuento-stock-pedido';

export interface PeticionIniciarProduccion {
  pedidoId: string;
}

/**
 * Iniciar producción (Flujo 03.2). Asegura el descuento de stock si la
 * configuración era PRODUCCION (idempotente: si ya bajó al aprobar, no
 * vuelve a bajar).
 */
export class IniciarProduccion implements CasoDeUso<PeticionIniciarProduccion, void> {
  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly stock: ServicioStock,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionIniciarProduccion): Promise<void> {
    const pedido = await this.pedidos.porId(IdEntidad.desde(peticion.pedidoId));
    if (!pedido) throw new ErrorNoEncontrado('Pedido', peticion.pedidoId);

    pedido.iniciarProduccion();
    await descontarStockDePedido(pedido, this.stock, this.pedidos);
    await this.pedidos.guardar(pedido);
    await this.bus.publicar(pedido.extraerEventos());
  }
}
