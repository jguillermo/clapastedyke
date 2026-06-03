import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { eventoDominio } from '../../../compartido/dominio/evento-dominio';
import { ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Semaforo } from '../../../catalogo/dominio/insumo/insumo';
import { RepositorioInsumos } from '../../../catalogo/dominio/insumo/repositorio-insumos';
import { RepositorioConfiguracion } from '../../../configuracion/dominio/repositorio-configuracion';
import { ServicioStock } from '../../dominio/servicio-stock';

export interface PeticionAjustarInventario {
  insumoId: string;
  tipo: string; // merma, daño, vencimiento, conteo, devolución (configuración)
  cantidad: number;
  motivo?: string;
}

export interface RespuestaAjuste {
  stockResultante: number;
  semaforo: Semaforo;
}

/**
 * Ajustar inventario (Flujo 06): el signo lo decide el TIPO según
 * configuración (merma siempre resta, devolución suma, conteo respeta tu
 * signo). Queda el movimiento en el kardex.
 */
export class AjustarInventario implements CasoDeUso<PeticionAjustarInventario, RespuestaAjuste> {
  constructor(
    private readonly insumos: RepositorioInsumos,
    private readonly configuracion: RepositorioConfiguracion,
    private readonly stock: ServicioStock,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionAjustarInventario): Promise<RespuestaAjuste> {
    const insumo = await this.insumos.porId(IdEntidad.desde(peticion.insumoId));
    if (!insumo) throw new ErrorNoEncontrado('Insumo', peticion.insumoId);

    const config = await this.configuracion.obtener();
    const cantidadFirmada = config.cantidadFirmadaDeAjuste(peticion.tipo, peticion.cantidad);

    const movimiento = await this.stock.mover(
      insumo,
      cantidadFirmada,
      peticion.tipo.trim().toLowerCase(),
      insumo.id.valor,
      peticion.motivo ?? '',
    );

    await this.bus.publicar([
      eventoDominio('InventarioAjustado', insumo.id.valor, {
        tipo: peticion.tipo,
        cantidad: cantidadFirmada,
        stockResultante: movimiento.stockResultante,
      }),
    ]);

    return { stockResultante: movimiento.stockResultante, semaforo: insumo.semaforo };
  }
}

/** Vista previa del ajuste (previsualizarAjuste del GAS): no persiste nada. */
export class PrevisualizarAjuste
  implements CasoDeUso<PeticionAjustarInventario, RespuestaAjuste & { stockActual: number }>
{
  constructor(
    private readonly insumos: RepositorioInsumos,
    private readonly configuracion: RepositorioConfiguracion,
  ) {}

  async ejecutar(peticion: PeticionAjustarInventario) {
    const insumo = await this.insumos.porId(IdEntidad.desde(peticion.insumoId));
    if (!insumo) throw new ErrorNoEncontrado('Insumo', peticion.insumoId);
    const config = await this.configuracion.obtener();
    const cantidadFirmada = config.cantidadFirmadaDeAjuste(peticion.tipo, peticion.cantidad);

    const stockActual = insumo.stockActual;
    const stockResultante = stockActual + cantidadFirmada;
    const semaforo: Semaforo =
      stockResultante <= 0 ? 'rojo' : stockResultante <= insumo.stockMinimo ? 'amarillo' : 'verde';
    return { stockActual, stockResultante, semaforo };
  }
}
