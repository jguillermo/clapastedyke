import { beforeEach, describe, expect, it } from 'vitest';
import { BusEventosEnMemoria } from '../../compartido/aplicacion/bus-eventos';
import { ErrorValidacion } from '../../compartido/dominio/errores';
import { IdEntidad } from '../../compartido/dominio/id-entidad';
import { GuardarCliente } from '../../catalogo/aplicacion/guardar-cliente/guardar-cliente';
import { GuardarInsumo } from '../../catalogo/aplicacion/guardar-insumo/guardar-insumo';
import { GuardarReceta } from '../../catalogo/aplicacion/guardar-receta/guardar-receta';
import {
  RepositorioClientesEnMemoria,
  RepositorioInsumosEnMemoria,
  RepositorioRecetasEnMemoria,
} from '../../catalogo/infraestructura/repositorios-memoria';
import { ActualizarConfiguracion } from '../../configuracion/aplicacion/actualizar-configuracion/actualizar-configuracion';
import { RepositorioConfiguracionEnMemoria } from '../../configuracion/infraestructura/repositorio-configuracion-memoria';
import { ServicioStock } from '../../inventario/dominio/servicio-stock';
import { RepositorioMovimientosEnMemoria } from '../../inventario/infraestructura/repositorios-memoria';
import { RepositorioPresupuestosEnMemoria } from '../infraestructura/repositorio-presupuestos-memoria';
import {
  RepositorioPedidosEnMemoria,
  RepositorioVentasEnMemoria,
} from '../infraestructura/repositorios-pedidos-ventas-memoria';
import { AprobarPresupuesto } from './aprobar-presupuesto/aprobar-presupuesto';
import { CancelarPedido } from './cancelar-pedido/cancelar-pedido';
import { GuardarPresupuesto } from './guardar-presupuesto/guardar-presupuesto';
import { IniciarProduccion } from './iniciar-produccion/iniciar-produccion';
import { MarcarEntregado } from './marcar-entregado/marcar-entregado';

/**
 * EL ciclo del manual, de punta a punta y con stock real:
 * cotizar 20 personas → aprobar (nace PD-, baja stock) → producción →
 * entregar (nace VT- con el precio congelado) · y la rama de cancelación.
 */
describe('Ciclo presupuesto → pedido → venta (integración de casos de uso)', () => {
  let insumos: RepositorioInsumosEnMemoria;
  let movimientos: RepositorioMovimientosEnMemoria;
  let presupuestos: RepositorioPresupuestosEnMemoria;
  let pedidos: RepositorioPedidosEnMemoria;
  let ventas: RepositorioVentasEnMemoria;
  let configuracion: RepositorioConfiguracionEnMemoria;
  let bus: BusEventosEnMemoria;

  let guardarPresupuesto: GuardarPresupuesto;
  let aprobar: AprobarPresupuesto;
  let producir: IniciarProduccion;
  let entregar: MarcarEntregado;
  let cancelar: CancelarPedido;

  let clienteId: string;
  let recetaId: string;
  let harinaId: string;
  let huevoId: string;

  beforeEach(async () => {
    const clientes = new RepositorioClientesEnMemoria();
    insumos = new RepositorioInsumosEnMemoria();
    const recetas = new RepositorioRecetasEnMemoria();
    configuracion = new RepositorioConfiguracionEnMemoria();
    movimientos = new RepositorioMovimientosEnMemoria();
    presupuestos = new RepositorioPresupuestosEnMemoria();
    pedidos = new RepositorioPedidosEnMemoria();
    ventas = new RepositorioVentasEnMemoria();
    bus = new BusEventosEnMemoria();
    const stock = new ServicioStock(insumos, movimientos);

    clienteId = (await new GuardarCliente(clientes, bus).ejecutar({ nombre: 'Ana Torres' })).id;
    const gi = new GuardarInsumo(insumos, bus);
    harinaId = (
      await gi.ejecutar({
        nombre: 'Harina', tipo: 'ingrediente', unidadBase: 'g',
        tamanoPresentacion: 1000, precioPresentacionSoles: 5, stockInicial: 1000, stockMinimo: 2000,
      })
    ).id;
    huevoId = (
      await gi.ejecutar({
        nombre: 'Huevo', tipo: 'ingrediente', unidadBase: 'u',
        tamanoPresentacion: 30, precioPresentacionSoles: 15, stockInicial: 30, stockMinimo: 30,
      })
    ).id;
    recetaId = (
      await new GuardarReceta(recetas, insumos, bus).ejecutar({
        nombre: 'Torta chocolate', tipoBase: 'personas', racionesBase: 10, tiempoManoObraHoras: 2,
        ingredientes: [
          { insumoId: harinaId, cantidadBase: 300 },
          { insumoId: huevoId, cantidadBase: 4 },
        ],
      })
    ).id;
    await new ActualizarConfiguracion(configuracion, bus).ejecutar({ generales: { margenDefecto: 30 } });

    guardarPresupuesto = new GuardarPresupuesto(presupuestos, clientes, recetas, insumos, configuracion, bus);
    aprobar = new AprobarPresupuesto(presupuestos, pedidos, insumos, stock, configuracion, bus);
    producir = new IniciarProduccion(pedidos, stock, bus);
    entregar = new MarcarEntregado(pedidos, presupuestos, ventas, bus);
    cancelar = new CancelarPedido(pedidos, movimientos, stock, bus);
  });

  async function cotizarVeintePersonas(): Promise<string> {
    return (
      await guardarPresupuesto.ejecutar({
        clienteId, recetaId, modoEscalado: 'personas', valorEscalado: 20,
        empaques: [], margen: 30, aplicaIgv: true,
      })
    ).id;
  }

  it('aprobar crea el pedido con requerimientos/faltantes y baja el stock (momento APROBAR)', async () => {
    const presupuestoId = await cotizarVeintePersonas();
    const r = await aprobar.ejecutar({ presupuestoId });

    expect(r.pedidoId).toBe('PD-0001');
    // Necesario: 600 g harina (hay 1000 → falta 0) y 8 huevos (hay 30 → falta 0)… pero
    // el aviso reporta lo que QUEDARÁ bajo cero; aquí no falta nada todavía.
    expect(r.faltantes).toHaveLength(0);

    const presupuesto = await presupuestos.porId(IdEntidad.desde(presupuestoId));
    expect(presupuesto?.estado).toBe('Aprobado');
    expect(presupuesto?.pedidoId?.valor).toBe('PD-0001');

    // Stock descontado YA (configuración por defecto: APROBAR)
    const harina = await insumos.porId(IdEntidad.desde(harinaId));
    expect(harina?.stockActual).toBe(400); // 1000 − 600
    const consumos = await movimientos.porReferenciaYTipo('PD-0001', 'consumo');
    expect(consumos).toHaveLength(2);

    // Doble aprobación bloqueada por el agregado
    await expect(aprobar.ejecutar({ presupuestoId })).rejects.toThrow(ErrorValidacion);
  });

  it('reporta faltantes cuando el stock no alcanza (aviso, no bloqueo)', async () => {
    const id1 = await cotizarVeintePersonas();
    await aprobar.ejecutar({ presupuestoId: id1 }); // harina queda en 400
    const id2 = await cotizarVeintePersonas();
    const r = await aprobar.ejecutar({ presupuestoId: id2 }); // necesita 600, hay 400

    expect(r.faltantes.map(f => f.insumoNombre)).toEqual(['Harina']);
    expect(r.faltantes[0].faltante).toBe(200);
    // El stock queda NEGATIVO no: 400−600 = −200 (permitido, semáforo rojo)
    const harina = await insumos.porId(IdEntidad.desde(harinaId));
    expect(harina?.stockActual).toBe(-200);
    expect(harina?.semaforo).toBe('rojo');
  });

  it('con momento PRODUCCION el stock baja al iniciar producción (idempotente)', async () => {
    await new ActualizarConfiguracion(configuracion, bus).ejecutar({
      generales: { momentoDescuentoStock: 'PRODUCCION' },
    });
    const presupuestoId = await cotizarVeintePersonas();
    const { pedidoId } = await aprobar.ejecutar({ presupuestoId });

    let harina = await insumos.porId(IdEntidad.desde(harinaId));
    expect(harina?.stockActual).toBe(1000); // aún intacto

    await producir.ejecutar({ pedidoId });
    harina = await insumos.porId(IdEntidad.desde(harinaId));
    expect(harina?.stockActual).toBe(400); // bajó al producir, una sola vez
  });

  it('entregar registra la venta VT-0001 con el precio final congelado (S/ 110)', async () => {
    const presupuestoId = await cotizarVeintePersonas();
    const { pedidoId } = await aprobar.ejecutar({ presupuestoId });
    await producir.ejecutar({ pedidoId });

    const r = await entregar.ejecutar({ pedidoId });
    expect(r.ventaId).toBe('VT-0001');
    expect(r.montoSoles).toBe(110);

    const pedido = await pedidos.porId(IdEntidad.desde(pedidoId));
    expect(pedido?.estado).toBe('Entregado');
    expect(pedido?.fechaEntrega).not.toBeNull();
    expect(await ventas.todos()).toHaveLength(1);

    // Un Entregado no se puede cancelar
    await expect(cancelar.ejecutar({ pedidoId })).rejects.toThrow(ErrorValidacion);
  });

  it('cancelar devuelve el stock íntegro con movimientos de cancelación', async () => {
    const presupuestoId = await cotizarVeintePersonas();
    const { pedidoId } = await aprobar.ejecutar({ presupuestoId });

    await cancelar.ejecutar({ pedidoId, motivo: 'el cliente desistió' });

    const pedido = await pedidos.porId(IdEntidad.desde(pedidoId));
    expect(pedido?.estado).toBe('Cancelado');
    expect(pedido?.motivoCancelacion).toBe('el cliente desistió');

    const harina = await insumos.porId(IdEntidad.desde(harinaId));
    const huevo = await insumos.porId(IdEntidad.desde(huevoId));
    expect(harina?.stockActual).toBe(1000); // devuelto
    expect(huevo?.stockActual).toBe(30);
    expect(await movimientos.porReferenciaYTipo(pedidoId, 'cancelacion')).toHaveLength(2);
  });
});
