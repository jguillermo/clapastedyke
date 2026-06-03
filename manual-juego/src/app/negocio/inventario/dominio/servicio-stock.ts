import { IdEntidad } from '../../compartido/dominio/id-entidad';
import { Insumo } from '../../catalogo/dominio/insumo/insumo';
import { Movimiento, TipoMovimiento } from './movimiento/movimiento';
import { RepositorioMovimientos } from './movimiento/repositorio-movimientos';
import { RepositorioInsumos } from '../../catalogo/dominio/insumo/repositorio-insumos';

/**
 * Servicio de dominio MoverStock: el ÚNICO camino para cambiar el stock
 * (equivalente a moverStock de src/Inventario.js). Aplica la cantidad firmada
 * al insumo y deja el movimiento en el kardex con el stock resultante.
 */
export class ServicioStock {
  constructor(
    private readonly insumos: RepositorioInsumos,
    private readonly movimientos: RepositorioMovimientos,
  ) {}

  async mover(
    insumo: Insumo,
    cantidadFirmada: number,
    tipo: TipoMovimiento,
    referencia: string,
    motivo = '',
  ): Promise<Movimiento> {
    const stockResultante =
      cantidadFirmada >= 0
        ? insumo.recibirStock(cantidadFirmada)
        : insumo.consumirStock(-cantidadFirmada);

    const movimiento = Movimiento.registrar(await this.movimientos.siguienteId(), {
      insumoId: insumo.id,
      insumoNombre: insumo.nombre,
      tipo,
      cantidad: cantidadFirmada,
      referencia,
      motivo,
      stockResultante,
    });

    await this.insumos.guardar(insumo);
    await this.movimientos.guardar(movimiento);
    return movimiento;
  }

  async moverPorId(
    insumoId: IdEntidad,
    cantidadFirmada: number,
    tipo: TipoMovimiento,
    referencia: string,
    motivo = '',
  ): Promise<Movimiento | null> {
    const insumo = await this.insumos.porId(insumoId);
    if (!insumo) return null;
    return this.mover(insumo, cantidadFirmada, tipo, referencia, motivo);
  }
}
