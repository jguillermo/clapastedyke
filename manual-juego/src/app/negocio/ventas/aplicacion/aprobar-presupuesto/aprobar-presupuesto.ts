import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { RepositorioInsumos } from '../../../catalogo/dominio/insumo/repositorio-insumos';
import { RepositorioConfiguracion } from '../../../configuracion/dominio/repositorio-configuracion';
import { ServicioStock } from '../../../inventario/dominio/servicio-stock';
import { Pedido, RequerimientoPedido } from '../../dominio/pedido/pedido';
import { RepositorioPedidos } from '../../dominio/pedido/repositorio-pedidos';
import { RepositorioPresupuestos } from '../../dominio/presupuesto/repositorio-presupuestos';
import { descontarStockDePedido } from '../descuento-stock-pedido';

export interface PeticionAprobarPresupuesto {
  presupuestoId: string;
}

export interface RespuestaAprobarPresupuesto {
  pedidoId: string;
  /** Insumos que quedarán en falta (aviso informativo: no bloquea). */
  faltantes: RequerimientoPedido[];
}

/**
 * Aprobar (Flujo 02): el trato se cierra. Nace el pedido PD- con sus
 * requerimientos (necesario y faltante = snapshot de hoy) y, si la
 * configuración dice APROBAR, el stock baja ya con movimientos 'consumo'.
 */
export class AprobarPresupuesto
  implements CasoDeUso<PeticionAprobarPresupuesto, RespuestaAprobarPresupuesto>
{
  constructor(
    private readonly presupuestos: RepositorioPresupuestos,
    private readonly pedidos: RepositorioPedidos,
    private readonly insumos: RepositorioInsumos,
    private readonly stock: ServicioStock,
    private readonly configuracion: RepositorioConfiguracion,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionAprobarPresupuesto): Promise<RespuestaAprobarPresupuesto> {
    const presupuesto = await this.presupuestos.porId(IdEntidad.desde(peticion.presupuestoId));
    if (!presupuesto) throw new ErrorNoEncontrado('Presupuesto', peticion.presupuestoId);

    // Requerimientos: las líneas congeladas agrupadas por insumo,
    // con el faltante calculado contra el stock DE HOY (snapshot).
    const necesario = new Map<string, { nombre: string; cantidad: number }>();
    for (const linea of presupuesto.calculo.lineas) {
      const actual = necesario.get(linea.insumoId) ?? { nombre: linea.nombre, cantidad: 0 };
      actual.cantidad += linea.cantidad;
      necesario.set(linea.insumoId, actual);
    }
    const requerimientos: RequerimientoPedido[] = [];
    for (const [insumoId, req] of necesario) {
      const insumo = await this.insumos.porId(IdEntidad.desde(insumoId));
      const stockActual = insumo?.stockActual ?? 0;
      requerimientos.push({
        insumoId,
        insumoNombre: req.nombre,
        cantidadNecesaria: req.cantidad,
        faltante: Math.max(0, req.cantidad - stockActual),
      });
    }

    const pedido = Pedido.crear(await this.pedidos.siguienteId(), {
      presupuestoId: presupuesto.id,
      clienteId: presupuesto.clienteId,
      clienteNombre: presupuesto.clienteNombre,
      recetaNombre: presupuesto.recetaNombre,
      requerimientos,
    });

    presupuesto.aprobar(pedido.id); // guarda: solo Pendiente

    const config = await this.configuracion.obtener();
    await this.pedidos.guardar(pedido);
    if (config.generales.momentoDescuentoStock === 'APROBAR') {
      await descontarStockDePedido(pedido, this.stock, this.pedidos);
    }
    await this.presupuestos.guardar(presupuesto);

    await this.bus.publicar([...presupuesto.extraerEventos(), ...pedido.extraerEventos()]);
    return {
      pedidoId: pedido.id.valor,
      faltantes: requerimientos.filter(r => r.faltante > 0),
    };
  }
}
