import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import {
  PresupuestoListado,
} from '../../negocio/ventas/aplicacion/listar-presupuestos/listar-presupuestos';
import { EstadoVisiblePresupuesto } from '../../negocio/ventas/dominio/presupuesto/presupuesto';
import { ClientePrimitivos } from '../../negocio/catalogo/dominio/cliente/cliente';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

type FiltroEstado = '' | EstadoVisiblePresupuesto;

/**
 * LISTA de presupuestos: la pantalla estrella de seguimiento. Filtros simples
 * con señales (estado y cliente) que recargan al cambiar; las acciones de
 * Aprobar/Rechazar solo aparecen en los Pendientes y delegan en el negocio
 * (que decide pedido, stock y faltantes). La vista NO calcula ni formatea: los
 * DTOs (`PresupuestoListado`) ya traen estadoVisible y los *Formato listos.
 */
@Component({
  selector: 'app-pantalla-presupuestos',
  imports: [...UI_FORMULARIOS, RouterLink],
  templateUrl: './pantalla-presupuestos.html',
})
export class PantallaPresupuestos {
  private readonly negocio = inject(Negocio);

  protected readonly presupuestos = signal<PresupuestoListado[]>([]);
  protected readonly clientes = signal<ClientePrimitivos[]>([]);
  protected readonly cargando = signal(true);
  protected readonly procesando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Filtros: señales simples (no formField) que disparan recarga.
  protected readonly filtroEstado = signal<FiltroEstado>('');
  protected readonly filtroCliente = signal<string>('');

  constructor() {
    void this.cargarClientes();
    void this.recargar();
  }

  private async cargarClientes(): Promise<void> {
    this.clientes.set(await this.negocio.listarClientes.ejecutar());
  }

  protected async recargar(): Promise<void> {
    this.cargando.set(true);
    this.presupuestos.set(
      await this.negocio.listarPresupuestos.ejecutar({
        estado: this.filtroEstado() || undefined,
        clienteId: this.filtroCliente() || undefined,
      }),
    );
    this.cargando.set(false);
  }

  protected cambiarEstado(valor: string): void {
    this.filtroEstado.set(valor as FiltroEstado);
    void this.recargar();
  }

  protected cambiarCliente(valor: string): void {
    this.filtroCliente.set(valor);
    void this.recargar();
  }

  protected async aprobar(p: PresupuestoListado): Promise<void> {
    if (!window.confirm(`¿Aprobar ${p.id} y crear su pedido?`)) return;
    this.procesando.set(true);
    this.aviso.set(null);
    try {
      const r = await this.negocio.aprobarPresupuesto.ejecutar({ presupuestoId: p.id });
      let texto = `Aprobado, nace ${r.pedidoId}.`;
      if (r.faltantes.length) {
        const detalle = r.faltantes
          .map(f => `${f.insumoNombre} (${f.faltante})`)
          .join(', ');
        texto += ` Faltantes: ${detalle}`;
      }
      this.aviso.set({ tipo: 'ok', texto });
      await this.recargar();
    } catch (error) {
      const texto = error instanceof ErrorDominio ? error.message : 'No se pudo aprobar.';
      this.aviso.set({ tipo: 'err', texto });
    } finally {
      this.procesando.set(false);
    }
  }

  protected async rechazar(p: PresupuestoListado): Promise<void> {
    const motivo = window.prompt(`Motivo del rechazo de ${p.id} (opcional):`);
    if (motivo === null) return; // canceló
    this.procesando.set(true);
    this.aviso.set(null);
    try {
      await this.negocio.rechazarPresupuesto.ejecutar({ presupuestoId: p.id, motivo });
      this.aviso.set({ tipo: 'ok', texto: `${p.id} rechazado.` });
      await this.recargar();
    } catch (error) {
      const texto = error instanceof ErrorDominio ? error.message : 'No se pudo rechazar.';
      this.aviso.set({ tipo: 'err', texto });
    } finally {
      this.procesando.set(false);
    }
  }

  /** Clases del badge de estado (la vista solo elige color, no calcula nada). */
  protected clasesEstado(estado: EstadoVisiblePresupuesto): string {
    switch (estado) {
      case 'Aprobado':
        return 'bg-verde-suave text-verde border-verde/30';
      case 'Rechazado':
        return 'bg-rojo-suave text-rojo border-rojo/30';
      case 'Vencido':
        return 'bg-papel text-apagado border-linea';
      default: // Pendiente
        return 'bg-ambar/15 text-ambar border-ambar/30';
    }
  }
}
