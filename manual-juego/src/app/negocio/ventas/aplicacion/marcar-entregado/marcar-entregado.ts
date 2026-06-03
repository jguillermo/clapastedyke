import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { RepositorioPedidos } from '../../dominio/pedido/repositorio-pedidos';
import { RepositorioPresupuestos } from '../../dominio/presupuesto/repositorio-presupuestos';
import { Venta } from '../../dominio/venta/venta';
import { RepositorioVentas } from '../../dominio/venta/repositorio-ventas';

export interface PeticionMarcarEntregado {
  pedidoId: string;
}

export interface RespuestaMarcarEntregado {
  ventaId: string;
  montoSoles: number;
}

/**
 * Entregar (Flujo 03.3): cierra el ciclo. Nace la venta VT- con el precio
 * final CONGELADO del presupuesto origen.
 */
export class MarcarEntregado
  implements CasoDeUso<PeticionMarcarEntregado, RespuestaMarcarEntregado>
{
  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly presupuestos: RepositorioPresupuestos,
    private readonly ventas: RepositorioVentas,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionMarcarEntregado): Promise<RespuestaMarcarEntregado> {
    const pedido = await this.pedidos.porId(IdEntidad.desde(peticion.pedidoId));
    if (!pedido) throw new ErrorNoEncontrado('Pedido', peticion.pedidoId);
    const presupuesto = await this.presupuestos.porId(pedido.presupuestoId);
    if (!presupuesto) throw new ErrorNoEncontrado('Presupuesto', pedido.presupuestoId.valor);

    pedido.marcarEntregado(); // guarda: solo Producción

    const venta = Venta.registrar(await this.ventas.siguienteId(), {
      pedidoId: pedido.id,
      clienteId: pedido.clienteId,
      clienteNombre: pedido.clienteNombre,
      monto: presupuesto.calculo.precioFinal,
    });

    await this.pedidos.guardar(pedido);
    await this.ventas.guardar(venta);
    await this.bus.publicar(pedido.extraerEventos());
    return { ventaId: venta.id.valor, montoSoles: venta.monto.soles };
  }
}
