import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { Dinero } from '../../../compartido/dominio/dinero';
import { ErrorNoEncontrado, ErrorValidacion } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { RepositorioInsumos } from '../../../catalogo/dominio/insumo/repositorio-insumos';
import { RepositorioProveedores } from '../../../catalogo/dominio/proveedor/repositorio-proveedores';
import { Compra } from '../../dominio/compra/compra';
import { RepositorioCompras } from '../../dominio/compra/repositorio-compras';
import { ServicioStock } from '../../dominio/servicio-stock';

export interface LineaCompraPeticion {
  insumoId: string;
  /** Presentaciones recibidas (5 bolsas, no 5000 g). */
  cantidadRecibidaPresent: number;
  precioPresentacionPagadoSoles: number;
}

export interface PeticionRegistrarCompra {
  proveedorId: string;
  fecha?: string; // ISO; default hoy
  lineas: LineaCompraPeticion[];
}

/**
 * Registrar compra (Flujo 05.2): por cada línea el stock SUBE en unidad base
 * (presentaciones × tamaño), el precio de presentación del insumo se
 * REEMPLAZA por el pagado (recalculando el precio por unidad base) y queda
 * el movimiento 'compra' en el kardex. La compra CMP- es histórico inmutable.
 */
export class RegistrarCompra implements CasoDeUso<PeticionRegistrarCompra, { id: string }> {
  constructor(
    private readonly compras: RepositorioCompras,
    private readonly insumos: RepositorioInsumos,
    private readonly proveedores: RepositorioProveedores,
    private readonly stock: ServicioStock,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionRegistrarCompra): Promise<{ id: string }> {
    const proveedor = await this.proveedores.porId(IdEntidad.desde(peticion.proveedorId));
    if (!proveedor) throw new ErrorNoEncontrado('Proveedor', peticion.proveedorId);
    if (!peticion.lineas?.length) throw new ErrorValidacion('Agrega al menos una línea.');

    // Captura la foto de cada insumo y arma el agregado Compra
    const lineasCompra = [];
    for (const linea of peticion.lineas) {
      const insumo = await this.insumos.porId(IdEntidad.desde(linea.insumoId));
      if (!insumo) throw new ErrorNoEncontrado('Insumo', linea.insumoId);
      lineasCompra.push({
        insumoId: insumo.id.valor,
        insumoNombre: insumo.nombre,
        cantidadRecibidaPresent: linea.cantidadRecibidaPresent,
        precioPresentacionPagadoSoles: linea.precioPresentacionPagadoSoles,
        tamanoPresentacion: insumo.presentacion.tamano,
      });
    }

    const compra = Compra.registrar(await this.compras.siguienteId(), {
      proveedorId: proveedor.id,
      proveedorNombre: proveedor.nombre,
      fecha: peticion.fecha ? new Date(peticion.fecha) : undefined,
      lineas: lineasCompra,
    });

    // Efectos por línea: precio nuevo + entrada de stock con movimiento
    for (const linea of compra.lineas) {
      const insumo = (await this.insumos.porId(IdEntidad.desde(linea.insumoId)))!;
      insumo.actualizarPrecioPresentacion(Dinero.desdeSoles(linea.precioPresentacionPagadoSoles));
      await this.stock.mover(
        insumo,
        linea.cantidadUnidadBase,
        'compra',
        compra.id.valor,
        `Compra a ${proveedor.nombre}`,
      );
    }

    await this.compras.guardar(compra);
    await this.bus.publicar(compra.extraerEventos());
    return { id: compra.id.valor };
  }
}
