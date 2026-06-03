import { AgregadoRaiz } from '../../../compartido/dominio/agregado';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { eventoDominio } from '../../../compartido/dominio/evento-dominio';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';

export interface ReglaEmpaquePrimitivos {
  id: string;
  recetaId: string;
  tamano: string;
  insumoEmpaqueId: string;
  cantidad: number;
  creadoEn: string;
}

/**
 * ReglaEmpaque (RL-): para una receta en un tamaño, qué empaque sugerir y
 * cuánto. Unicidad de la terna (receta, tamaño, empaque) — la garantiza el
 * caso de uso. Varios empaques por (receta, tamaño) están permitidos.
 */
export class ReglaEmpaque extends AgregadoRaiz {
  private constructor(
    readonly id: IdEntidad,
    readonly recetaId: IdEntidad,
    private _tamano: string,
    private _insumoEmpaqueId: IdEntidad,
    private _cantidad: number,
    readonly creadoEn: Date,
  ) {
    super();
  }

  static crear(
    id: IdEntidad,
    datos: { recetaId: IdEntidad; tamano: string; insumoEmpaqueId: IdEntidad; cantidad: number },
  ): ReglaEmpaque {
    const regla = new ReglaEmpaque(
      id,
      datos.recetaId,
      ReglaEmpaque.tamanoValido(datos.tamano),
      datos.insumoEmpaqueId,
      ReglaEmpaque.cantidadValida(datos.cantidad),
      new Date(),
    );
    regla.registrarEvento(
      eventoDominio('ReglaEmpaqueCreada', id.valor, {
        recetaId: datos.recetaId.valor,
        tamano: regla._tamano,
      }),
    );
    return regla;
  }

  static desdePrimitivos(p: ReglaEmpaquePrimitivos): ReglaEmpaque {
    return new ReglaEmpaque(
      IdEntidad.desde(p.id),
      IdEntidad.desde(p.recetaId),
      p.tamano,
      IdEntidad.desde(p.insumoEmpaqueId),
      p.cantidad,
      new Date(p.creadoEn),
    );
  }

  /** Edición: solo empaque y cantidad sugerida (Flujo 11.2 del manual). */
  editar(datos: { insumoEmpaqueId: IdEntidad; cantidad: number }): void {
    this._insumoEmpaqueId = datos.insumoEmpaqueId;
    this._cantidad = ReglaEmpaque.cantidadValida(datos.cantidad);
    this.registrarEvento(eventoDominio('ReglaEmpaqueEditada', this.id.valor, {}));
  }

  get tamano(): string {
    return this._tamano;
  }
  get insumoEmpaqueId(): IdEntidad {
    return this._insumoEmpaqueId;
  }
  get cantidad(): number {
    return this._cantidad;
  }

  coincideCon(recetaId: IdEntidad, tamano: string): boolean {
    return this.recetaId.esIgualA(recetaId) && this._tamano === tamano.trim().toLowerCase();
  }

  aPrimitivos(): ReglaEmpaquePrimitivos {
    return {
      id: this.id.valor,
      recetaId: this.recetaId.valor,
      tamano: this._tamano,
      insumoEmpaqueId: this._insumoEmpaqueId.valor,
      cantidad: this._cantidad,
      creadoEn: this.creadoEn.toISOString(),
    };
  }

  private static tamanoValido(tamano: string): string {
    const limpio = (tamano ?? '').trim().toLowerCase();
    if (!limpio) throw new ErrorValidacion('El tamaño es obligatorio.');
    return limpio;
  }

  private static cantidadValida(cantidad: number): number {
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new ErrorValidacion('La cantidad sugerida debe ser mayor que 0.');
    }
    return cantidad;
  }
}
