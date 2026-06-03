import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { formatoFecha } from '../../../compartido/aplicacion/formatos';
import { RepositorioMovimientos } from '../../dominio/movimiento/repositorio-movimientos';

export interface MovimientoListado {
  id: string;
  fechaFormato: string;
  insumoId: string;
  insumoNombre: string;
  tipo: string;
  cantidad: number; // firmada: + entrada · − salida
  referencia: string;
  motivo: string;
  stockResultante: number;
}

export interface PeticionListarMovimientos {
  insumoId?: string;
}

/** El kardex, listo para pintar (más recientes primero). */
export class ListarMovimientos
  implements CasoDeUso<PeticionListarMovimientos, MovimientoListado[]>
{
  constructor(private readonly movimientos: RepositorioMovimientos) {}

  async ejecutar(peticion: PeticionListarMovimientos = {}): Promise<MovimientoListado[]> {
    let lista = await this.movimientos.todos();
    if (peticion.insumoId) lista = lista.filter(m => m.insumoId.valor === peticion.insumoId);
    return lista
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .map(m => ({
        id: m.id.valor,
        fechaFormato: formatoFecha(m.fecha),
        insumoId: m.insumoId.valor,
        insumoNombre: m.insumoNombre,
        tipo: m.tipo,
        cantidad: m.cantidad,
        referencia: m.referencia,
        motivo: m.motivo,
        stockResultante: m.stockResultante,
      }));
  }
}
