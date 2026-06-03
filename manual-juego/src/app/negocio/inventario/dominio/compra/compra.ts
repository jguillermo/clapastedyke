import { AgregadoRaiz } from '../../../compartido/dominio/agregado';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { eventoDominio } from '../../../compartido/dominio/evento-dominio';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';

/** Línea de compra (el CDL- del GAS, interna del agregado). */
export interface LineaCompra {
  insumoId: string;
  insumoNombre: string;
  /** Cantidad de PRESENTACIONES recibidas (5 bolsas, no 5000 g). */
  cantidadRecibidaPresent: number;
  /** Precio pagado por presentación (puede diferir del registrado). */
  precioPresentacionPagadoSoles: number;
  /** Tamaño de la presentación del insumo en esa fecha (capturado). */
  tamanoPresentacion: number;
  /** Calculada: cantidadRecibidaPresent × tamanoPresentacion. */
  cantidadUnidadBase: number;
  /** Calculada: precioPagado ÷ tamanoPresentacion. */
  precioPorUnidadBaseSoles: number;
}

export interface CompraPrimitivos {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  fecha: string; // ISO
  lineas: LineaCompra[];
}

/**
 * Compra (CMP-): recepción de materiales de un proveedor. Histórico
 * INMUTABLE: el efecto sobre el stock y los precios del insumo lo aplica el
 * caso de uso vía ServicioStock; aquí queda la foto de lo recibido y pagado.
 */
export class Compra extends AgregadoRaiz {
  private constructor(
    readonly id: IdEntidad,
    readonly proveedorId: IdEntidad,
    readonly proveedorNombre: string,
    readonly fecha: Date,
    readonly lineas: readonly LineaCompra[],
  ) {
    super();
  }

  static registrar(
    id: IdEntidad,
    datos: {
      proveedorId: IdEntidad;
      proveedorNombre: string;
      fecha?: Date;
      lineas: {
        insumoId: string;
        insumoNombre: string;
        cantidadRecibidaPresent: number;
        precioPresentacionPagadoSoles: number;
        tamanoPresentacion: number;
      }[];
    },
  ): Compra {
    if (!datos.lineas?.length) {
      throw new ErrorValidacion('Una compra necesita al menos una línea.');
    }
    const lineas = datos.lineas.map(l => {
      if (l.cantidadRecibidaPresent <= 0) {
        throw new ErrorValidacion(`Cantidad recibida inválida para ${l.insumoNombre}.`);
      }
      if (l.precioPresentacionPagadoSoles <= 0) {
        throw new ErrorValidacion(`Precio pagado inválido para ${l.insumoNombre}.`);
      }
      return {
        ...l,
        cantidadUnidadBase: l.cantidadRecibidaPresent * l.tamanoPresentacion,
        precioPorUnidadBaseSoles: l.precioPresentacionPagadoSoles / l.tamanoPresentacion,
      } satisfies LineaCompra;
    });

    const compra = new Compra(
      id,
      datos.proveedorId,
      datos.proveedorNombre,
      datos.fecha ?? new Date(),
      lineas,
    );
    compra.registrarEvento(
      eventoDominio('CompraRegistrada', id.valor, {
        proveedorId: datos.proveedorId.valor,
        lineas: lineas.length,
      }),
    );
    return compra;
  }

  static desdePrimitivos(p: CompraPrimitivos): Compra {
    return new Compra(
      IdEntidad.desde(p.id),
      IdEntidad.desde(p.proveedorId),
      p.proveedorNombre,
      new Date(p.fecha),
      p.lineas.map(l => ({ ...l })),
    );
  }

  aPrimitivos(): CompraPrimitivos {
    return {
      id: this.id.valor,
      proveedorId: this.proveedorId.valor,
      proveedorNombre: this.proveedorNombre,
      fecha: this.fecha.toISOString(),
      lineas: this.lineas.map(l => ({ ...l })),
    };
  }
}
