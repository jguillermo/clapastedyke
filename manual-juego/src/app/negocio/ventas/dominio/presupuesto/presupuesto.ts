import { AgregadoRaiz } from '../../../compartido/dominio/agregado';
import { Dinero } from '../../../compartido/dominio/dinero';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { eventoDominio } from '../../../compartido/dominio/evento-dominio';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { CalculoPresupuesto, LineaCalculada, ModoEscalado } from './calculadora-presupuesto';

/**
 * Estados persistidos. 'Vencido' NO se persiste: es derivado (un Pendiente
 * cuya fecha de vencimiento pasó se MUESTRA vencido, como en el GAS).
 */
export type EstadoPresupuesto = 'Pendiente' | 'Aprobado' | 'Rechazado';
export type EstadoVisiblePresupuesto = EstadoPresupuesto | 'Vencido';

export interface PresupuestoPrimitivos {
  id: string;
  clienteId: string;
  clienteNombre: string;
  recetaId: string;
  recetaNombre: string;
  modoEscalado: ModoEscalado;
  valorEscalado: number;
  factorAplicado: number;
  racionesResultantes: number;
  lineas: LineaCalculada[];
  costoIngredientesSoles: number;
  costoMaterialesSoles: number;
  costoManoObraSoles: number;
  costoIndirectoSoles: number;
  costoDepreciacionSoles: number;
  costoTotalSoles: number;
  margen: number;
  precioConMargenSoles: number;
  aplicaIgv: boolean;
  tasaIgv: number;
  montoIgvSoles: number;
  redondeoAplicadoSoles: number;
  precioFinalSoles: number;
  notas: string;
  estado: EstadoPresupuesto;
  motivoRechazo: string;
  fechaEmision: string; // ISO
  fechaVencimiento: string; // ISO
  pedidoId: string | null;
}

/**
 * Presupuesto (P-): la cotización con TODOS sus precios congelados al
 * guardarse — cambiar catálogos o configuración después no lo mueve.
 * Su detalle (líneas de ingredientes y materiales) es interno del agregado.
 *
 * Transiciones: Pendiente → Aprobado (nace el pedido) | Rechazado (motivo).
 * Aprobado y Rechazado son históricos: no hay vuelta atrás.
 */
export class Presupuesto extends AgregadoRaiz {
  private constructor(
    readonly id: IdEntidad,
    readonly clienteId: IdEntidad,
    readonly clienteNombre: string,
    readonly recetaId: IdEntidad,
    readonly recetaNombre: string,
    readonly modoEscalado: ModoEscalado,
    readonly valorEscalado: number,
    readonly calculo: Readonly<CalculoPresupuesto>,
    readonly notas: string,
    private _estado: EstadoPresupuesto,
    private _motivoRechazo: string,
    readonly fechaEmision: Date,
    readonly fechaVencimiento: Date,
    private _pedidoId: IdEntidad | null,
  ) {
    super();
  }

  /** Congela un cálculo como presupuesto Pendiente (Flujo 01). */
  static crear(
    id: IdEntidad,
    datos: {
      clienteId: IdEntidad;
      clienteNombre: string;
      recetaId: IdEntidad;
      recetaNombre: string;
      modoEscalado: ModoEscalado;
      valorEscalado: number;
      calculo: CalculoPresupuesto;
      notas?: string;
      diasVencimiento: number;
    },
  ): Presupuesto {
    const emision = new Date();
    const vencimiento = new Date(emision);
    vencimiento.setDate(vencimiento.getDate() + datos.diasVencimiento);

    const presupuesto = new Presupuesto(
      id,
      datos.clienteId,
      datos.clienteNombre,
      datos.recetaId,
      datos.recetaNombre,
      datos.modoEscalado,
      datos.valorEscalado,
      datos.calculo,
      (datos.notas ?? '').trim(),
      'Pendiente',
      '',
      emision,
      vencimiento,
      null,
    );
    presupuesto.registrarEvento(
      eventoDominio('PresupuestoCreado', id.valor, {
        clienteId: datos.clienteId.valor,
        precioFinalSoles: datos.calculo.precioFinal.soles,
      }),
    );
    return presupuesto;
  }

  /** Aprobar: el trato se cierra y NACE el pedido (guarda 1:1 con él). */
  aprobar(pedidoId: IdEntidad): void {
    this.exigirPendiente('aprobar');
    this._estado = 'Aprobado';
    this._pedidoId = pedidoId;
    this.registrarEvento(
      eventoDominio('PresupuestoAprobado', this.id.valor, { pedidoId: pedidoId.valor }),
    );
  }

  /** Rechazar con motivo: no nace pedido ni se toca stock. */
  rechazar(motivo: string): void {
    this.exigirPendiente('rechazar');
    this._estado = 'Rechazado';
    this._motivoRechazo = (motivo ?? '').trim();
    this.registrarEvento(
      eventoDominio('PresupuestoRechazado', this.id.valor, { motivo: this._motivoRechazo }),
    );
  }

  get estado(): EstadoPresupuesto {
    return this._estado;
  }
  get motivoRechazo(): string {
    return this._motivoRechazo;
  }
  get pedidoId(): IdEntidad | null {
    return this._pedidoId;
  }

  /** Un Pendiente con la fecha pasada se MUESTRA Vencido (sigue Pendiente dentro). */
  estadoVisible(hoy: Date = new Date()): EstadoVisiblePresupuesto {
    if (this._estado === 'Pendiente' && this.fechaVencimiento < hoy) return 'Vencido';
    return this._estado;
  }

  aPrimitivos(): PresupuestoPrimitivos {
    const c = this.calculo;
    return {
      id: this.id.valor,
      clienteId: this.clienteId.valor,
      clienteNombre: this.clienteNombre,
      recetaId: this.recetaId.valor,
      recetaNombre: this.recetaNombre,
      modoEscalado: this.modoEscalado,
      valorEscalado: this.valorEscalado,
      factorAplicado: c.factor,
      racionesResultantes: c.racionesResultantes,
      lineas: c.lineas.map(l => ({ ...l })),
      costoIngredientesSoles: c.costoIngredientes.soles,
      costoMaterialesSoles: c.costoMateriales.soles,
      costoManoObraSoles: c.costoManoObra.soles,
      costoIndirectoSoles: c.costoIndirecto.soles,
      costoDepreciacionSoles: c.costoDepreciacion.soles,
      costoTotalSoles: c.costoTotal.soles,
      margen: c.margen,
      precioConMargenSoles: c.precioConMargen.soles,
      aplicaIgv: c.aplicaIgv,
      tasaIgv: c.tasaIgv,
      montoIgvSoles: c.montoIgv.soles,
      redondeoAplicadoSoles: c.redondeoAplicado.soles,
      precioFinalSoles: c.precioFinal.soles,
      notas: this.notas,
      estado: this._estado,
      motivoRechazo: this._motivoRechazo,
      fechaEmision: this.fechaEmision.toISOString(),
      fechaVencimiento: this.fechaVencimiento.toISOString(),
      pedidoId: this._pedidoId?.valor ?? null,
    };
  }

  static desdePrimitivos(p: PresupuestoPrimitivos): Presupuesto {
    return new Presupuesto(
      IdEntidad.desde(p.id),
      IdEntidad.desde(p.clienteId),
      p.clienteNombre,
      IdEntidad.desde(p.recetaId),
      p.recetaNombre,
      p.modoEscalado,
      p.valorEscalado,
      {
        factor: p.factorAplicado,
        racionesResultantes: p.racionesResultantes,
        lineas: p.lineas.map(l => ({ ...l })),
        costoIngredientes: Dinero.desdeSoles(p.costoIngredientesSoles),
        costoMateriales: Dinero.desdeSoles(p.costoMaterialesSoles),
        costoManoObra: Dinero.desdeSoles(p.costoManoObraSoles),
        costoIndirecto: Dinero.desdeSoles(p.costoIndirectoSoles),
        costoDepreciacion: Dinero.desdeSoles(p.costoDepreciacionSoles),
        costoTotal: Dinero.desdeSoles(p.costoTotalSoles),
        margen: p.margen,
        precioConMargen: Dinero.desdeSoles(p.precioConMargenSoles),
        aplicaIgv: p.aplicaIgv,
        tasaIgv: p.tasaIgv,
        montoIgv: Dinero.desdeSoles(p.montoIgvSoles),
        redondeoAplicado: Dinero.desdeSoles(p.redondeoAplicadoSoles),
        precioFinal: Dinero.desdeSoles(p.precioFinalSoles),
      },
      p.notas,
      p.estado,
      p.motivoRechazo,
      new Date(p.fechaEmision),
      new Date(p.fechaVencimiento),
      p.pedidoId ? IdEntidad.desde(p.pedidoId) : null,
    );
  }

  private exigirPendiente(accion: string): void {
    if (this._estado !== 'Pendiente') {
      throw new ErrorValidacion(
        `Solo se puede ${accion} un presupuesto Pendiente (está ${this._estado}).`,
      );
    }
  }
}
