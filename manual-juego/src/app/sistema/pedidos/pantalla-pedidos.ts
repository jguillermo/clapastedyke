import { Component, computed, inject, signal } from '@angular/core';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import { ClientePrimitivos } from '../../negocio/catalogo/dominio/cliente/cliente';
import { EstadoPedido } from '../../negocio/ventas/dominio/pedido/pedido';
import { PedidoListado } from '../../negocio/ventas/aplicacion/listar-pedidos/listar-pedidos';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

type FiltroEstado = 'Todos' | EstadoPedido;

/**
 * Pantalla de Pedidos: el tablero del ciclo de venta (PD-).
 * La vista NO calcula ni formatea: `PedidoListado` ya trae las fechas
 * formateadas y los requerimientos con su `faltante`. Las reglas de negocio
 * (no entregar sin estar en producción, etc.) viven en el dominio y llegan
 * como aviso rojo si el caso de uso las rechaza (ErrorDominio).
 */
@Component({
  selector: 'app-pantalla-pedidos',
  imports: [...UI_FORMULARIOS],
  templateUrl: './pantalla-pedidos.html',
})
export class PantallaPedidos {
  private readonly negocio = inject(Negocio);

  protected readonly pedidos = signal<PedidoListado[]>([]);
  protected readonly clientes = signal<ClientePrimitivos[]>([]);
  protected readonly cargando = signal(true);
  protected readonly procesando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Fila de detalle abierta (muestra los requerimientos debajo).
  protected readonly pedidoAbierto = signal<string | null>(null);

  // Filtros (signals simples, sin formField). Recargan al cambiar.
  protected readonly filtroEstado = signal<FiltroEstado>('Todos');
  protected readonly filtroClienteId = signal<string>('');

  protected readonly estados: readonly EstadoPedido[] = [
    'Pendiente',
    'Producción',
    'Entregado',
    'Cancelado',
  ];

  constructor() {
    void this.cargarClientes();
    void this.recargar();
  }

  private async cargarClientes(): Promise<void> {
    this.clientes.set(await this.negocio.listarClientes.ejecutar());
  }

  protected async recargar(): Promise<void> {
    this.cargando.set(true);
    const estado = this.filtroEstado();
    this.pedidos.set(
      await this.negocio.listarPedidos.ejecutar({
        estado: estado === 'Todos' ? undefined : estado,
        clienteId: this.filtroClienteId() || undefined,
      }),
    );
    this.cargando.set(false);
  }

  protected cambiarEstado(valor: string): void {
    this.filtroEstado.set(valor as FiltroEstado);
    void this.recargar();
  }

  protected cambiarCliente(valor: string): void {
    this.filtroClienteId.set(valor);
    void this.recargar();
  }

  /** Clases del badge de estado. */
  protected readonly clasesEstado: Record<EstadoPedido, string> = {
    Pendiente: 'bg-ambar-suave text-ambar',
    Producción: 'bg-acento-suave text-acento-profundo',
    Entregado: 'bg-verde-suave text-verde',
    Cancelado: 'bg-rojo-suave text-rojo',
  };

  protected alternarDetalle(id: string): void {
    this.pedidoAbierto.update(actual => (actual === id ? null : id));
  }

  protected async iniciarProduccion(p: PedidoListado): Promise<void> {
    if (!window.confirm(`¿Pasar el pedido ${p.id} a Producción? Esto puede descontar stock.`)) {
      return;
    }
    await this.accion(
      () => this.negocio.iniciarProduccion.ejecutar({ pedidoId: p.id }),
      `${p.id} en producción.`,
    );
  }

  protected async entregar(p: PedidoListado): Promise<void> {
    if (!window.confirm(`¿Marcar el pedido ${p.id} como entregado? Se registrará la venta.`)) {
      return;
    }
    await this.accion(async () => {
      const r = await this.negocio.marcarEntregado.ejecutar({ pedidoId: p.id });
      return `Entregado: nace la venta ${r.ventaId}`;
    });
  }

  protected async cancelar(p: PedidoListado): Promise<void> {
    const motivo = window.prompt('Motivo de la cancelación (opcional):', '');
    if (motivo === null) return; // cancelar el prompt aborta
    await this.accion(
      () => this.negocio.cancelarPedido.ejecutar({ pedidoId: p.id, motivo }),
      `${p.id} cancelado, stock devuelto.`,
    );
  }

  /**
   * Ejecuta una transición y refresca. `trabajo` puede devolver el texto del
   * aviso (p. ej. el ventaId), o usarse `textoOk` cuando es fijo.
   */
  private async accion(
    trabajo: () => Promise<string | void>,
    textoOk?: string,
  ): Promise<void> {
    this.procesando.set(true);
    this.aviso.set(null);
    try {
      const texto = await trabajo();
      this.aviso.set({ tipo: 'ok', texto: (typeof texto === 'string' ? texto : textoOk) ?? '' });
      await this.recargar();
    } catch (error) {
      const texto =
        error instanceof ErrorDominio ? error.message : 'No se pudo completar la acción.';
      this.aviso.set({ tipo: 'err', texto });
    } finally {
      this.procesando.set(false);
    }
  }

  protected readonly hayPedidos = computed(() => this.pedidos().length > 0);
}
