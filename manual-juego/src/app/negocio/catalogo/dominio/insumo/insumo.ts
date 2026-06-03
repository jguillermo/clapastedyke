import { AgregadoRaiz } from '../../../compartido/dominio/agregado';
import { UnidadBase } from '../../../compartido/dominio/cantidad';
import { Dinero } from '../../../compartido/dominio/dinero';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { eventoDominio } from '../../../compartido/dominio/evento-dominio';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';

export type TipoInsumo = 'ingrediente' | 'empaque';
export type Semaforo = 'rojo' | 'amarillo' | 'verde';

/**
 * VO Presentación: cómo se compra el insumo (bolsa de 1000 g a S/ 5).
 * De aquí deriva el precio por unidad base, la base de todos los costos.
 */
export class Presentacion {
  private constructor(
    readonly tamano: number,
    readonly precio: Dinero,
  ) {}

  static de(tamano: number, precio: Dinero): Presentacion {
    if (!Number.isFinite(tamano) || tamano <= 0) {
      throw new ErrorValidacion(`Tamaño de presentación inválido: ${tamano}.`);
    }
    if (!precio.esMayorQue(Dinero.cero())) {
      throw new ErrorValidacion('El precio de la presentación debe ser mayor que 0.');
    }
    return new Presentacion(tamano, precio);
  }

  /** precio_por_unidad_base = precio_presentacion / tamano_presentacion */
  get precioPorUnidadBase(): Dinero {
    return this.precio.dividirEntre(this.tamano);
  }
}

export interface InsumoPrimitivos {
  id: string;
  nombre: string;
  tipo: TipoInsumo;
  unidadBase: UnidadBase;
  tamanoPresentacion: number;
  precioPresentacionSoles: number;
  stockActual: number;
  stockMinimo: number;
  proveedorRecomendadoId: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

/**
 * Insumo (IN-): ingrediente o empaque. Aquí viven su precio y su stock.
 * El stock puede quedar NEGATIVO (el GAS lo permite: aprobar con faltantes
 * avisa pero no bloquea); el semáforo lo refleja en rojo.
 * Las mutaciones de stock se orquestan desde INVENTARIO (Etapa 4) a través
 * de los métodos con intención de este agregado.
 */
export class Insumo extends AgregadoRaiz {
  private constructor(
    readonly id: IdEntidad,
    private _nombre: string,
    readonly tipo: TipoInsumo,
    readonly unidadBase: UnidadBase,
    private _presentacion: Presentacion,
    private _stockActual: number,
    private _stockMinimo: number,
    private _proveedorRecomendadoId: IdEntidad | null,
    readonly creadoEn: Date,
    private _actualizadoEn: Date,
  ) {
    super();
  }

  static crear(
    id: IdEntidad,
    datos: {
      nombre: string;
      tipo: TipoInsumo;
      unidadBase: UnidadBase;
      tamanoPresentacion: number;
      precioPresentacion: Dinero;
      stockInicial?: number;
      stockMinimo?: number;
      proveedorRecomendadoId?: IdEntidad | null;
    },
  ): Insumo {
    const stockInicial = datos.stockInicial ?? 0;
    const stockMinimo = datos.stockMinimo ?? 0;
    if (stockInicial < 0) throw new ErrorValidacion('El stock inicial no puede ser negativo.');
    if (stockMinimo < 0) throw new ErrorValidacion('El stock mínimo no puede ser negativo.');

    const insumo = new Insumo(
      id,
      Insumo.nombreValido(datos.nombre),
      datos.tipo,
      datos.unidadBase,
      Presentacion.de(datos.tamanoPresentacion, datos.precioPresentacion),
      stockInicial,
      stockMinimo,
      datos.proveedorRecomendadoId ?? null,
      new Date(),
      new Date(),
    );
    insumo.registrarEvento(
      eventoDominio('InsumoCreado', id.valor, {
        nombre: insumo._nombre,
        tipo: insumo.tipo,
        stockInicial, // INVENTARIO registrará el movimiento 'inicial' (Etapa 4)
      }),
    );
    return insumo;
  }

  static desdePrimitivos(p: InsumoPrimitivos): Insumo {
    return new Insumo(
      IdEntidad.desde(p.id),
      p.nombre,
      p.tipo,
      p.unidadBase,
      Presentacion.de(p.tamanoPresentacion, Dinero.desdeSoles(p.precioPresentacionSoles)),
      p.stockActual,
      p.stockMinimo,
      p.proveedorRecomendadoId ? IdEntidad.desde(p.proveedorRecomendadoId) : null,
      new Date(p.creadoEn),
      new Date(p.actualizadoEn),
    );
  }

  /** Edición de catálogo: precio, presentación, mínimo… El stock NO se toca aquí. */
  editar(datos: {
    nombre: string;
    tamanoPresentacion: number;
    precioPresentacion: Dinero;
    stockMinimo: number;
    proveedorRecomendadoId?: IdEntidad | null;
  }): void {
    if (datos.stockMinimo < 0) throw new ErrorValidacion('El stock mínimo no puede ser negativo.');
    this._nombre = Insumo.nombreValido(datos.nombre);
    this._presentacion = Presentacion.de(datos.tamanoPresentacion, datos.precioPresentacion);
    this._stockMinimo = datos.stockMinimo;
    this._proveedorRecomendadoId = datos.proveedorRecomendadoId ?? null;
    this.tocar();
    this.registrarEvento(eventoDominio('InsumoEditado', this.id.valor, { nombre: this._nombre }));
  }

  /* ---------- Stock: métodos con intención (los usa INVENTARIO) ---------- */

  /** Entrada de stock (compra, devolución, cancelación de pedido). */
  recibirStock(cantidad: number): number {
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new ErrorValidacion(`La cantidad a recibir debe ser positiva: ${cantidad}.`);
    }
    this._stockActual += cantidad;
    this.tocar();
    return this._stockActual;
  }

  /** Salida de stock (consumo de pedido, merma…). Puede dejarlo negativo. */
  consumirStock(cantidad: number): number {
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new ErrorValidacion(`La cantidad a consumir debe ser positiva: ${cantidad}.`);
    }
    this._stockActual -= cantidad;
    this.tocar();
    return this._stockActual;
  }

  /** La compra también actualiza el precio de presentación al pagado. */
  actualizarPrecioPresentacion(precioPagado: Dinero): void {
    this._presentacion = Presentacion.de(this._presentacion.tamano, precioPagado);
    this.tocar();
  }

  /* ---------- Derivados ---------- */

  get precioPorUnidadBase(): Dinero {
    return this._presentacion.precioPorUnidadBase;
  }

  /** rojo: stock ≤ 0 · amarillo: stock ≤ mínimo · verde: resto. */
  get semaforo(): Semaforo {
    if (this._stockActual <= 0) return 'rojo';
    if (this._stockActual <= this._stockMinimo) return 'amarillo';
    return 'verde';
  }

  get bajoMinimo(): boolean {
    return this._stockActual <= this._stockMinimo;
  }

  get nombre(): string {
    return this._nombre;
  }
  get presentacion(): Presentacion {
    return this._presentacion;
  }
  get stockActual(): number {
    return this._stockActual;
  }
  get stockMinimo(): number {
    return this._stockMinimo;
  }
  get proveedorRecomendadoId(): IdEntidad | null {
    return this._proveedorRecomendadoId;
  }

  aPrimitivos(): InsumoPrimitivos {
    return {
      id: this.id.valor,
      nombre: this._nombre,
      tipo: this.tipo,
      unidadBase: this.unidadBase,
      tamanoPresentacion: this._presentacion.tamano,
      precioPresentacionSoles: this._presentacion.precio.soles,
      stockActual: this._stockActual,
      stockMinimo: this._stockMinimo,
      proveedorRecomendadoId: this._proveedorRecomendadoId?.valor ?? null,
      creadoEn: this.creadoEn.toISOString(),
      actualizadoEn: this._actualizadoEn.toISOString(),
    };
  }

  private tocar(): void {
    this._actualizadoEn = new Date();
  }

  private static nombreValido(nombre: string): string {
    const limpio = (nombre ?? '').trim();
    if (!limpio) throw new ErrorValidacion('El nombre del insumo es obligatorio.');
    return limpio;
  }
}
