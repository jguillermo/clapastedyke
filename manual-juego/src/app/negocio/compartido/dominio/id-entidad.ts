import { ErrorValidacion } from './errores';

/**
 * Prefijos de identidad legible, heredados del sistema GAS (src/Util.js).
 * El formato es PREFIJO-NNNN con mínimo 4 dígitos: 'CL-0001', 'P-0042'.
 */
export const PREFIJOS_ID = {
  cliente: 'CL',
  proveedor: 'PR',
  insumo: 'IN',
  receta: 'RC',
  reglaEmpaque: 'RL',
  presupuesto: 'P',
  presupuestoDetalle: 'PDL',
  pedido: 'PD',
  pedidoRequerimiento: 'REQ',
  compra: 'CMP',
  compraDetalle: 'CDL',
  movimiento: 'MV',
  venta: 'VT',
} as const;

export type PrefijoId = (typeof PREFIJOS_ID)[keyof typeof PREFIJOS_ID];

const FORMATO_ID = /^[A-Z]{1,4}-\d{4,}$/;

/**
 * Value Object de identidad de un agregado. Igualdad por valor.
 */
export class IdEntidad {
  private constructor(readonly valor: string) {}

  static desde(valor: string): IdEntidad {
    const limpio = String(valor ?? '').trim();
    if (!FORMATO_ID.test(limpio)) {
      throw new ErrorValidacion(`Id «${valor}» no tiene el formato PREFIJO-NNNN.`);
    }
    return new IdEntidad(limpio);
  }

  /** Construye la identidad N de un prefijo: crear('CL', 7) → CL-0007. */
  static crear(prefijo: PrefijoId, numero: number): IdEntidad {
    if (!Number.isInteger(numero) || numero <= 0) {
      throw new ErrorValidacion(`Número de id inválido: ${numero}.`);
    }
    return new IdEntidad(`${prefijo}-${String(numero).padStart(4, '0')}`);
  }

  esIgualA(otro: IdEntidad): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}

/** Puerto: genera la siguiente identidad de un prefijo (secuencia persistente). */
export interface GeneradorIds {
  siguiente(prefijo: PrefijoId): Promise<IdEntidad>;
}
