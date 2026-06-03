import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';

/**
 * Tipos de movimiento del kardex (src/Inventario.js · moverStock):
 * automáticos ('inicial', 'compra', 'consumo', 'cancelacion') y manuales
 * (los tipos de ajuste de configuración: merma, daño, vencimiento, conteo,
 * devolución). El signo de la cantidad indica entrada (+) o salida (−).
 */
export type TipoMovimiento =
  | 'inicial'
  | 'compra'
  | 'consumo'
  | 'cancelacion'
  | (string & {});

export interface MovimientoPrimitivos {
  id: string;
  fecha: string; // ISO
  insumoId: string;
  insumoNombre: string;
  tipo: TipoMovimiento;
  cantidad: number; // firmada
  referencia: string; // documento que lo motiva (PD-, CMP-, IN-…)
  motivo: string;
  stockResultante: number;
}

/**
 * Movimiento (MV-): registro INMUTABLE del kardex. Cada cambio de stock deja
 * exactamente uno — así siempre se puede rastrear por qué el inventario está
 * como está.
 */
export class Movimiento {
  private constructor(
    readonly id: IdEntidad,
    readonly fecha: Date,
    readonly insumoId: IdEntidad,
    readonly insumoNombre: string,
    readonly tipo: TipoMovimiento,
    readonly cantidad: number,
    readonly referencia: string,
    readonly motivo: string,
    readonly stockResultante: number,
  ) {}

  static registrar(
    id: IdEntidad,
    datos: {
      insumoId: IdEntidad;
      insumoNombre: string;
      tipo: TipoMovimiento;
      cantidad: number;
      referencia: string;
      motivo?: string;
      stockResultante: number;
    },
  ): Movimiento {
    if (!Number.isFinite(datos.cantidad) || datos.cantidad === 0) {
      throw new ErrorValidacion('Un movimiento necesita cantidad distinta de 0.');
    }
    return new Movimiento(
      id,
      new Date(),
      datos.insumoId,
      datos.insumoNombre,
      datos.tipo,
      datos.cantidad,
      datos.referencia,
      (datos.motivo ?? '').trim(),
      datos.stockResultante,
    );
  }

  static desdePrimitivos(p: MovimientoPrimitivos): Movimiento {
    return new Movimiento(
      IdEntidad.desde(p.id),
      new Date(p.fecha),
      IdEntidad.desde(p.insumoId),
      p.insumoNombre,
      p.tipo,
      p.cantidad,
      p.referencia,
      p.motivo,
      p.stockResultante,
    );
  }

  aPrimitivos(): MovimientoPrimitivos {
    return {
      id: this.id.valor,
      fecha: this.fecha.toISOString(),
      insumoId: this.insumoId.valor,
      insumoNombre: this.insumoNombre,
      tipo: this.tipo,
      cantidad: this.cantidad,
      referencia: this.referencia,
      motivo: this.motivo,
      stockResultante: this.stockResultante,
    };
  }
}
