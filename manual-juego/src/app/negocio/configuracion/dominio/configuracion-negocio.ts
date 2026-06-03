import { AgregadoRaiz } from '../../compartido/dominio/agregado';
import { ErrorValidacion } from '../../compartido/dominio/errores';
import { eventoDominio } from '../../compartido/dominio/evento-dominio';
import { Porcentaje } from '../../compartido/dominio/porcentaje';

/** Cómo se redondea el precio final del presupuesto. */
export type Redondeo = 'NINGUNO' | 'MULTIPLO_5';

/** Cuándo baja el stock: al aprobar el presupuesto o al iniciar producción. */
export type MomentoDescuentoStock = 'APROBAR' | 'PRODUCCION';

/** Factor de escalado predefinido para la UI de cotización (½, 1, 2…). */
export interface FactorEscalado {
  codigo: number;
  etiqueta: string;
  orden: number;
}

/** Tamaño vendible con su factor (chico 0.5, mediano 1, grande 2). */
export interface TamanoNegocio {
  nombre: string;
  factor: number;
}

/**
 * Tipo de ajuste manual de inventario y su signo:
 * -1 resta (merma, daño, vencimiento) · +1 suma (devolución) ·
 *  0 usa el signo que ingrese la usuaria (conteo).
 */
export interface TipoAjuste {
  nombre: string;
  signo: -1 | 0 | 1;
}

export interface ParametrosGenerales {
  tarifaManoObraHora: number;
  costoIndirectoPedido: number;
  depreciacionPedido: number;
  margenDefecto: number;
  aplicarIgv: boolean;
  tasaIgv: number;
  redondeo: Redondeo;
  diasVencimiento: number;
  momentoDescuentoStock: MomentoDescuentoStock;
  nombreNegocio: string;
}

/** Defaults EXACTOS del instalador GAS (src/Esquema.js / Configuracion.js). */
export const PARAMETROS_DEFECTO: ParametrosGenerales = {
  tarifaManoObraHora: 12,
  costoIndirectoPedido: 5,
  depreciacionPedido: 3,
  margenDefecto: 35,
  aplicarIgv: true,
  tasaIgv: 18,
  redondeo: 'MULTIPLO_5',
  diasVencimiento: 15,
  momentoDescuentoStock: 'APROBAR',
  nombreNegocio: 'Sistema',
};

export const FACTORES_DEFECTO: FactorEscalado[] = [
  { codigo: 0.25, etiqueta: '1/4', orden: 1 },
  { codigo: 0.5, etiqueta: '1/2', orden: 2 },
  { codigo: 1, etiqueta: '1', orden: 3 },
  { codigo: 2, etiqueta: '2', orden: 4 },
  { codigo: 3, etiqueta: '3', orden: 5 },
];

export const TAMANOS_DEFECTO: TamanoNegocio[] = [
  { nombre: 'chico', factor: 0.5 },
  { nombre: 'mediano', factor: 1 },
  { nombre: 'grande', factor: 2 },
];

export const TIPOS_AJUSTE_DEFECTO: TipoAjuste[] = [
  { nombre: 'merma', signo: -1 },
  { nombre: 'daño', signo: -1 },
  { nombre: 'vencimiento', signo: -1 },
  { nombre: 'conteo', signo: 0 },
  { nombre: 'devolución', signo: 1 },
];

export interface ConfiguracionPrimitivos {
  id: string; // singleton: 'CONFIG'
  generales: ParametrosGenerales;
  factores: FactorEscalado[];
  tamanos: TamanoNegocio[];
  tiposAjuste: TipoAjuste[];
}

export const ID_CONFIGURACION = 'CONFIG';

/**
 * Configuración del negocio: agregado SINGLETON. Define las reglas con las
 * que se arma el precio y las listas que usan los formularios. Cambiarla
 * afecta solo a los presupuestos NUEVOS (los guardados están congelados).
 */
export class ConfiguracionNegocio extends AgregadoRaiz {
  private constructor(
    private _generales: ParametrosGenerales,
    private _factores: FactorEscalado[],
    private _tamanos: TamanoNegocio[],
    private _tiposAjuste: TipoAjuste[],
  ) {
    super();
  }

  /** La configuración de fábrica (instalación nueva). */
  static porDefecto(): ConfiguracionNegocio {
    return new ConfiguracionNegocio(
      { ...PARAMETROS_DEFECTO },
      FACTORES_DEFECTO.map(f => ({ ...f })),
      TAMANOS_DEFECTO.map(t => ({ ...t })),
      TIPOS_AJUSTE_DEFECTO.map(t => ({ ...t })),
    );
  }

  static desdePrimitivos(p: ConfiguracionPrimitivos): ConfiguracionNegocio {
    return new ConfiguracionNegocio(
      { ...p.generales },
      p.factores.map(f => ({ ...f })),
      p.tamanos.map(t => ({ ...t })),
      p.tiposAjuste.map(t => ({ ...t })),
    );
  }

  /** Edita los parámetros generales (Flujo 13 del manual). */
  actualizarGenerales(cambios: Partial<ParametrosGenerales>): void {
    const nuevos = { ...this._generales, ...cambios };
    ConfiguracionNegocio.validarGenerales(nuevos);
    this._generales = nuevos;
    this.registrarEvento(
      eventoDominio('ConfiguracionActualizada', ID_CONFIGURACION, { cambios: Object.keys(cambios) }),
    );
  }

  reemplazarTamanos(tamanos: TamanoNegocio[]): void {
    if (!tamanos.length) throw new ErrorValidacion('Define al menos un tamaño.');
    for (const t of tamanos) {
      if (!t.nombre.trim()) throw new ErrorValidacion('Todo tamaño necesita nombre.');
      if (!Number.isFinite(t.factor) || t.factor <= 0) {
        throw new ErrorValidacion(`Factor inválido para «${t.nombre}»: ${t.factor}.`);
      }
    }
    this._tamanos = tamanos.map(t => ({ nombre: t.nombre.trim().toLowerCase(), factor: t.factor }));
    this.registrarEvento(eventoDominio('ConfiguracionActualizada', ID_CONFIGURACION, { cambios: ['tamanos'] }));
  }

  /* ---------- Consultas que usa el resto del dominio ---------- */

  get generales(): Readonly<ParametrosGenerales> {
    return this._generales;
  }
  get factores(): readonly FactorEscalado[] {
    return [...this._factores].sort((a, b) => a.orden - b.orden);
  }
  get tamanos(): readonly TamanoNegocio[] {
    return this._tamanos;
  }
  get tiposAjuste(): readonly TipoAjuste[] {
    return this._tiposAjuste;
  }

  /** Factor de un tamaño (cálculo de presupuesto por tamaño). */
  factorDeTamano(nombre: string): number {
    const buscado = nombre.trim().toLowerCase();
    const tamano = this._tamanos.find(t => t.nombre === buscado);
    if (!tamano) throw new ErrorValidacion(`El tamaño «${nombre}» no está definido en configuración.`);
    return tamano.factor;
  }

  /**
   * Cantidad firmada de un ajuste manual (signoAjuste de src/Inventario.js):
   * signo -1 → resta |cantidad| · +1 → suma |cantidad| · 0 → respeta el signo.
   */
  cantidadFirmadaDeAjuste(tipo: string, cantidad: number): number {
    const def = this._tiposAjuste.find(t => t.nombre === tipo.trim().toLowerCase());
    if (!def) throw new ErrorValidacion(`Tipo de ajuste desconocido: «${tipo}».`);
    if (!Number.isFinite(cantidad) || cantidad === 0) {
      throw new ErrorValidacion('La cantidad del ajuste no puede ser 0.');
    }
    if (def.signo === 0) return cantidad;
    return def.signo * Math.abs(cantidad);
  }

  aPrimitivos(): ConfiguracionPrimitivos {
    return {
      id: ID_CONFIGURACION,
      generales: { ...this._generales },
      factores: this._factores.map(f => ({ ...f })),
      tamanos: this._tamanos.map(t => ({ ...t })),
      tiposAjuste: this._tiposAjuste.map(t => ({ ...t })),
    };
  }

  private static validarGenerales(g: ParametrosGenerales): void {
    const noNegativos: [string, number][] = [
      ['tarifa de mano de obra', g.tarifaManoObraHora],
      ['costo indirecto', g.costoIndirectoPedido],
      ['depreciación', g.depreciacionPedido],
    ];
    for (const [nombre, valor] of noNegativos) {
      if (!Number.isFinite(valor) || valor < 0) {
        throw new ErrorValidacion(`La ${nombre} no puede ser negativa.`);
      }
    }
    Porcentaje.de(g.margenDefecto); // [0,100): protege costo/(1−margen)
    Porcentaje.de(g.tasaIgv);
    if (!Number.isInteger(g.diasVencimiento) || g.diasVencimiento < 1) {
      throw new ErrorValidacion('Los días de vencimiento deben ser un entero ≥ 1.');
    }
    if (!g.nombreNegocio.trim()) {
      throw new ErrorValidacion('El nombre del negocio es obligatorio.');
    }
  }
}
