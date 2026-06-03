import { ErrorValidacion } from './errores';

/**
 * Value Object Dinero en soles (S/). Guarda DIEZMILÉSIMAS de sol como entero
 * (4 decimales): es la precisión real del sistema original, donde los precios
 * por unidad base son fracciones de céntimo (S/ 5 ÷ 1000 g = 0.005/g, el GAS
 * los muestra con num4). Inmutable y sin efectos secundarios.
 */
const ESCALA = 10_000;

export class Dinero {
  private constructor(readonly diezmilesimas: number) {}

  static desdeSoles(soles: number): Dinero {
    if (!Number.isFinite(soles)) throw new ErrorValidacion(`Monto inválido: ${soles}.`);
    return new Dinero(Math.round(soles * ESCALA));
  }

  static cero(): Dinero {
    return new Dinero(0);
  }

  get soles(): number {
    return this.diezmilesimas / ESCALA;
  }

  /** Céntimos redondeados (para mostrar/exportar a 2 decimales). */
  get centimos(): number {
    return Math.round(this.diezmilesimas / 100);
  }

  sumar(otro: Dinero): Dinero {
    return new Dinero(this.diezmilesimas + otro.diezmilesimas);
  }

  restar(otro: Dinero): Dinero {
    return new Dinero(this.diezmilesimas - otro.diezmilesimas);
  }

  /** Multiplica por un escalar (cantidades, factores); redondea a la diezmilésima. */
  multiplicarPor(factor: number): Dinero {
    if (!Number.isFinite(factor)) throw new ErrorValidacion(`Factor inválido: ${factor}.`);
    return new Dinero(Math.round(this.diezmilesimas * factor));
  }

  /** Divide por un escalar (p.ej. precio por unidad base); redondea a la diezmilésima. */
  dividirEntre(divisor: number): Dinero {
    if (!Number.isFinite(divisor) || divisor === 0) {
      throw new ErrorValidacion(`Divisor inválido: ${divisor}.`);
    }
    return new Dinero(Math.round(this.diezmilesimas / divisor));
  }

  esIgualA(otro: Dinero): boolean {
    return this.diezmilesimas === otro.diezmilesimas;
  }

  esMayorQue(otro: Dinero): boolean {
    return this.diezmilesimas > otro.diezmilesimas;
  }

  esNegativo(): boolean {
    return this.diezmilesimas < 0;
  }

  /** 'S/ 12.50' (2 decimales, es-PE). */
  formato(): string {
    return `S/ ${this.soles.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /** '0.0050' (4 decimales — precios por unidad base, como num4 del GAS). */
  formato4(): string {
    return this.soles.toLocaleString('es-PE', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
}
