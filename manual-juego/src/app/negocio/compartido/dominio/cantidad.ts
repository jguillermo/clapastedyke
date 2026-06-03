import { ErrorValidacion } from './errores';

/** Unidades base del sistema (src/Esquema.js): gramos o unidades. */
export type UnidadBase = 'g' | 'u';

/**
 * Value Object Cantidad: un valor con su unidad base. Inmutable.
 * Las cantidades pueden ser fraccionarias (p.ej. 12.5 g) pero no negativas
 * salvo construcción explícita con signo (movimientos de stock).
 */
export class Cantidad {
  private constructor(
    readonly valor: number,
    readonly unidad: UnidadBase,
  ) {}

  static de(valor: number, unidad: UnidadBase): Cantidad {
    if (!Number.isFinite(valor) || valor < 0) {
      throw new ErrorValidacion(`Cantidad inválida: ${valor}.`);
    }
    return new Cantidad(valor, unidad);
  }

  /** Para movimientos de stock: admite signo (negativo = salida). */
  static conSigno(valor: number, unidad: UnidadBase): Cantidad {
    if (!Number.isFinite(valor)) throw new ErrorValidacion(`Cantidad inválida: ${valor}.`);
    return new Cantidad(valor, unidad);
  }

  sumar(otra: Cantidad): Cantidad {
    this.exigirMismaUnidad(otra);
    return new Cantidad(this.valor + otra.valor, this.unidad);
  }

  escalarPor(factor: number): Cantidad {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new ErrorValidacion(`Factor de escalado inválido: ${factor}.`);
    }
    return new Cantidad(this.valor * factor, this.unidad);
  }

  esIgualA(otra: Cantidad): boolean {
    return this.unidad === otra.unidad && this.valor === otra.valor;
  }

  private exigirMismaUnidad(otra: Cantidad): void {
    if (this.unidad !== otra.unidad) {
      throw new ErrorValidacion(`No se pueden operar cantidades en ${this.unidad} y ${otra.unidad}.`);
    }
  }
}
