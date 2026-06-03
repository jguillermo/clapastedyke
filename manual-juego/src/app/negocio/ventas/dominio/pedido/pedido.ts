import { AgregadoRaiz } from '../../../compartido/dominio/agregado';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { eventoDominio } from '../../../compartido/dominio/evento-dominio';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';

export type EstadoPedido = 'Pendiente' | 'Producción' | 'Entregado' | 'Cancelado';

/**
 * Requerimiento de material (el REQ- del GAS, interno del agregado).
 * `faltante` es un SNAPSHOT del momento de creación: no se recalcula.
 */
export interface RequerimientoPedido {
  insumoId: string;
  insumoNombre: string;
  cantidadNecesaria: number;
  faltante: number;
}

export interface PedidoPrimitivos {
  id: string;
  presupuestoId: string;
  clienteId: string;
  clienteNombre: string;
  recetaNombre: string;
  estado: EstadoPedido;
  requerimientos: RequerimientoPedido[];
  stockDescontado: boolean;
  fechaCreacion: string; // ISO
  fechaEntrega: string | null;
  motivoCancelacion: string;
}

/**
 * Pedido (PD-): el encargo que nace al aprobar un presupuesto (1:1).
 * Transiciones: Pendiente → Producción → Entregado · Pendiente/Producción →
 * Cancelado (devuelve stock). Un Entregado NUNCA se cancela.
 * `stockDescontado` hace idempotente el descuento (momento APROBAR o
 * PRODUCCION según configuración, sin descontar dos veces).
 */
export class Pedido extends AgregadoRaiz {
  private constructor(
    readonly id: IdEntidad,
    readonly presupuestoId: IdEntidad,
    readonly clienteId: IdEntidad,
    readonly clienteNombre: string,
    readonly recetaNombre: string,
    private _estado: EstadoPedido,
    private _requerimientos: RequerimientoPedido[],
    private _stockDescontado: boolean,
    readonly fechaCreacion: Date,
    private _fechaEntrega: Date | null,
    private _motivoCancelacion: string,
  ) {
    super();
  }

  static crear(
    id: IdEntidad,
    datos: {
      presupuestoId: IdEntidad;
      clienteId: IdEntidad;
      clienteNombre: string;
      recetaNombre: string;
      requerimientos: RequerimientoPedido[];
    },
  ): Pedido {
    const pedido = new Pedido(
      id,
      datos.presupuestoId,
      datos.clienteId,
      datos.clienteNombre,
      datos.recetaNombre,
      'Pendiente',
      datos.requerimientos.map(r => ({ ...r })),
      false,
      new Date(),
      null,
      '',
    );
    pedido.registrarEvento(
      eventoDominio('PedidoCreado', id.valor, { presupuestoId: datos.presupuestoId.valor }),
    );
    return pedido;
  }

  static desdePrimitivos(p: PedidoPrimitivos): Pedido {
    return new Pedido(
      IdEntidad.desde(p.id),
      IdEntidad.desde(p.presupuestoId),
      IdEntidad.desde(p.clienteId),
      p.clienteNombre,
      p.recetaNombre,
      p.estado,
      p.requerimientos.map(r => ({ ...r })),
      p.stockDescontado,
      new Date(p.fechaCreacion),
      p.fechaEntrega ? new Date(p.fechaEntrega) : null,
      p.motivoCancelacion,
    );
  }

  /* ---------- Transiciones ---------- */

  iniciarProduccion(): void {
    this.exigirEstado('Pendiente', 'iniciar producción');
    this._estado = 'Producción';
    this.registrarEvento(eventoDominio('PedidoEnProduccion', this.id.valor, {}));
  }

  marcarEntregado(): void {
    this.exigirEstado('Producción', 'entregar');
    this._estado = 'Entregado';
    this._fechaEntrega = new Date();
    this.registrarEvento(eventoDominio('PedidoEntregado', this.id.valor, {}));
  }

  cancelar(motivo: string): void {
    if (this._estado !== 'Pendiente' && this._estado !== 'Producción') {
      throw new ErrorValidacion(
        `Solo se cancela un pedido Pendiente o en Producción (está ${this._estado}).`,
      );
    }
    this._estado = 'Cancelado';
    this._motivoCancelacion = (motivo ?? '').trim();
    this.registrarEvento(
      eventoDominio('PedidoCancelado', this.id.valor, { motivo: this._motivoCancelacion }),
    );
  }

  /** Idempotencia del descuento: solo la primera vez devuelve true. */
  marcarStockDescontado(): boolean {
    if (this._stockDescontado) return false;
    this._stockDescontado = true;
    return true;
  }

  /* ---------- Consultas ---------- */

  get estado(): EstadoPedido {
    return this._estado;
  }
  get requerimientos(): readonly RequerimientoPedido[] {
    return this._requerimientos;
  }
  get stockDescontado(): boolean {
    return this._stockDescontado;
  }
  get fechaEntrega(): Date | null {
    return this._fechaEntrega;
  }
  get motivoCancelacion(): string {
    return this._motivoCancelacion;
  }

  aPrimitivos(): PedidoPrimitivos {
    return {
      id: this.id.valor,
      presupuestoId: this.presupuestoId.valor,
      clienteId: this.clienteId.valor,
      clienteNombre: this.clienteNombre,
      recetaNombre: this.recetaNombre,
      estado: this._estado,
      requerimientos: this._requerimientos.map(r => ({ ...r })),
      stockDescontado: this._stockDescontado,
      fechaCreacion: this.fechaCreacion.toISOString(),
      fechaEntrega: this._fechaEntrega?.toISOString() ?? null,
      motivoCancelacion: this._motivoCancelacion,
    };
  }

  private exigirEstado(esperado: EstadoPedido, accion: string): void {
    if (this._estado !== esperado) {
      throw new ErrorValidacion(
        `Solo se puede ${accion} un pedido ${esperado} (está ${this._estado}).`,
      );
    }
  }
}
