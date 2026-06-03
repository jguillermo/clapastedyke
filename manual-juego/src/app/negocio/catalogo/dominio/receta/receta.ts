import { AgregadoRaiz } from '../../../compartido/dominio/agregado';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { eventoDominio } from '../../../compartido/dominio/evento-dominio';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';

export type TipoBase = 'personas' | 'tamano';

/**
 * Línea de ingrediente: entidad interna del agregado Receta (el RI- del GAS
 * es detalle privado). Referencia al Insumo SOLO por identidad.
 */
export interface IngredienteReceta {
  insumoId: string;
  /** Cantidad por racionesBase de la receta, en la unidad base del insumo. */
  cantidadBase: number;
}

export interface RecetaPrimitivos {
  id: string;
  nombre: string;
  categoria: string;
  tipoBase: TipoBase;
  racionesBase: number;
  tiempoManoObraHoras: number;
  ingredientes: IngredienteReceta[];
  creadoEn: string;
}

/**
 * Receta (RC-): define qué lleva un producto y para cuánto rinde
 * (racionesBase). Es lo que el presupuesto ESCALA. Invariante: al menos un
 * ingrediente con cantidad > 0. Cambiarla NO afecta presupuestos guardados
 * (ellos congelan su detalle).
 */
export class Receta extends AgregadoRaiz {
  private constructor(
    readonly id: IdEntidad,
    private _nombre: string,
    private _categoria: string,
    private _tipoBase: TipoBase,
    private _racionesBase: number,
    private _tiempoManoObraHoras: number,
    private _ingredientes: IngredienteReceta[],
    readonly creadoEn: Date,
  ) {
    super();
  }

  static crear(
    id: IdEntidad,
    datos: {
      nombre: string;
      categoria?: string;
      tipoBase: TipoBase;
      racionesBase: number;
      tiempoManoObraHoras?: number;
      ingredientes: IngredienteReceta[];
    },
  ): Receta {
    const receta = new Receta(
      id,
      Receta.nombreValido(datos.nombre),
      (datos.categoria ?? '').trim(),
      datos.tipoBase,
      Receta.racionesValidas(datos.racionesBase),
      Receta.tiempoValido(datos.tiempoManoObraHoras ?? 0),
      Receta.ingredientesValidos(datos.ingredientes),
      new Date(),
    );
    receta.registrarEvento(eventoDominio('RecetaCreada', id.valor, { nombre: receta._nombre }));
    return receta;
  }

  static desdePrimitivos(p: RecetaPrimitivos): Receta {
    return new Receta(
      IdEntidad.desde(p.id),
      p.nombre,
      p.categoria,
      p.tipoBase,
      p.racionesBase,
      p.tiempoManoObraHoras,
      p.ingredientes.map(i => ({ ...i })),
      new Date(p.creadoEn),
    );
  }

  /** Edición completa (el GAS reescribe las líneas): mismas invariantes. */
  editar(datos: {
    nombre: string;
    categoria?: string;
    tipoBase: TipoBase;
    racionesBase: number;
    tiempoManoObraHoras?: number;
    ingredientes: IngredienteReceta[];
  }): void {
    this._nombre = Receta.nombreValido(datos.nombre);
    this._categoria = (datos.categoria ?? '').trim();
    this._tipoBase = datos.tipoBase;
    this._racionesBase = Receta.racionesValidas(datos.racionesBase);
    this._tiempoManoObraHoras = Receta.tiempoValido(datos.tiempoManoObraHoras ?? 0);
    this._ingredientes = Receta.ingredientesValidos(datos.ingredientes);
    this.registrarEvento(eventoDominio('RecetaEditada', this.id.valor, { nombre: this._nombre }));
  }

  get nombre(): string {
    return this._nombre;
  }
  get categoria(): string {
    return this._categoria;
  }
  get tipoBase(): TipoBase {
    return this._tipoBase;
  }
  get racionesBase(): number {
    return this._racionesBase;
  }
  get tiempoManoObraHoras(): number {
    return this._tiempoManoObraHoras;
  }
  get ingredientes(): readonly IngredienteReceta[] {
    return this._ingredientes;
  }

  aPrimitivos(): RecetaPrimitivos {
    return {
      id: this.id.valor,
      nombre: this._nombre,
      categoria: this._categoria,
      tipoBase: this._tipoBase,
      racionesBase: this._racionesBase,
      tiempoManoObraHoras: this._tiempoManoObraHoras,
      ingredientes: this._ingredientes.map(i => ({ ...i })),
      creadoEn: this.creadoEn.toISOString(),
    };
  }

  /* ---------- Invariantes ---------- */

  private static nombreValido(nombre: string): string {
    const limpio = (nombre ?? '').trim();
    if (!limpio) throw new ErrorValidacion('El nombre de la receta es obligatorio.');
    return limpio;
  }

  private static racionesValidas(raciones: number): number {
    if (!Number.isFinite(raciones) || raciones <= 0) {
      throw new ErrorValidacion('La base de la receta (raciones) debe ser mayor que 0.');
    }
    return raciones;
  }

  private static tiempoValido(horas: number): number {
    if (!Number.isFinite(horas) || horas < 0) {
      throw new ErrorValidacion('El tiempo de mano de obra no puede ser negativo.');
    }
    return horas;
  }

  private static ingredientesValidos(ingredientes: IngredienteReceta[]): IngredienteReceta[] {
    const activos = (ingredientes ?? []).filter(i => i.insumoId && i.cantidadBase > 0);
    if (!activos.length) {
      throw new ErrorValidacion('Agrega al menos un ingrediente con cantidad mayor que 0.');
    }
    return activos.map(i => ({ insumoId: i.insumoId, cantidadBase: i.cantidadBase }));
  }
}
