import { Dinero } from '../../../compartido/dominio/dinero';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';

export interface VentaPrimitivos {
  id: string;
  pedidoId: string;
  clienteId: string;
  clienteNombre: string;
  montoSoles: number;
  fecha: string; // ISO
}

/**
 * Venta (VT-): el cierre del ciclo. Nace sola al ENTREGAR un pedido, con el
 * precio final CONGELADO del presupuesto origen. Inmutable.
 */
export class Venta {
  private constructor(
    readonly id: IdEntidad,
    readonly pedidoId: IdEntidad,
    readonly clienteId: IdEntidad,
    readonly clienteNombre: string,
    readonly monto: Dinero,
    readonly fecha: Date,
  ) {}

  static registrar(
    id: IdEntidad,
    datos: { pedidoId: IdEntidad; clienteId: IdEntidad; clienteNombre: string; monto: Dinero },
  ): Venta {
    return new Venta(id, datos.pedidoId, datos.clienteId, datos.clienteNombre, datos.monto, new Date());
  }

  static desdePrimitivos(p: VentaPrimitivos): Venta {
    return new Venta(
      IdEntidad.desde(p.id),
      IdEntidad.desde(p.pedidoId),
      IdEntidad.desde(p.clienteId),
      p.clienteNombre,
      Dinero.desdeSoles(p.montoSoles),
      new Date(p.fecha),
    );
  }

  aPrimitivos(): VentaPrimitivos {
    return {
      id: this.id.valor,
      pedidoId: this.pedidoId.valor,
      clienteId: this.clienteId.valor,
      clienteNombre: this.clienteNombre,
      montoSoles: this.monto.soles,
      fecha: this.fecha.toISOString(),
    };
  }
}
