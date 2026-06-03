import { IdEntidad } from '../../compartido/dominio/id-entidad';
import { ServicioStock } from '../../inventario/dominio/servicio-stock';
import { Pedido } from '../dominio/pedido/pedido';
import { RepositorioPedidos } from '../dominio/pedido/repositorio-pedidos';

/**
 * Descuenta el stock de los requerimientos de un pedido (movimientos
 * 'consumo'), UNA sola vez (idempotente vía pedido.marcarStockDescontado).
 * Lo invocan AprobarPresupuesto (momento APROBAR) o IniciarProduccion
 * (momento PRODUCCION) — descontarPedidoSiHaceFalta del GAS.
 */
export async function descontarStockDePedido(
  pedido: Pedido,
  stock: ServicioStock,
  pedidos: RepositorioPedidos,
): Promise<void> {
  if (!pedido.marcarStockDescontado()) return; // ya estaba descontado

  for (const req of pedido.requerimientos) {
    await stock.moverPorId(
      IdEntidad.desde(req.insumoId),
      -req.cantidadNecesaria,
      'consumo',
      pedido.id.valor,
      `Consumo del pedido ${pedido.id.valor}`,
    );
  }
  await pedidos.guardar(pedido);
}
