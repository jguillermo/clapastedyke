import { ErrorValidacion } from './errores';

/**
 * Value Object Porcentaje [0, 100): margen de ganancia, tasa de IGV.
 * El tope abierto en 100 protege la fórmula de margen sobre venta
 * (precio = costo / (1 − margen/100)), que con 100 dividiría por cero.
 */
export class Porcentaje {
  private constructor(readonly valor: number) {}

  static de(valor: number): Porcentaje {
    if (!Number.isFinite(valor) || valor < 0 || valor >= 100) {
      throw new ErrorValidacion(`Porcentaje fuera de rango [0, 100): ${valor}.`);
    }
    return new Porcentaje(valor);
  }

  /** 35 → 0.35 */
  get fraccion(): number {
    return this.valor / 100;
  }

  esIgualA(otro: Porcentaje): boolean {
    return this.valor === otro.valor;
  }
}
