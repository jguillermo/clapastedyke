import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { formatoFecha } from '../../../compartido/aplicacion/formatos';
import { Dinero } from '../../../compartido/dominio/dinero';
import { RepositorioCompras } from '../../dominio/compra/repositorio-compras';

export interface CompraListada {
  id: string;
  proveedorNombre: string;
  fechaFormato: string;
  cantidadLineas: number;
  /** Σ presentaciones × precio pagado — calculado por el negocio. */
  totalFormato: string;
  lineas: {
    insumoNombre: string;
    cantidadRecibidaPresent: number;
    precioPagadoFormato: string;
    cantidadUnidadBase: number;
  }[];
}

/** Historial de compras, listo para pintar (más recientes primero). */
export class ListarCompras implements CasoDeUso<void, CompraListada[]> {
  constructor(private readonly compras: RepositorioCompras) {}

  async ejecutar(): Promise<CompraListada[]> {
    const todas = await this.compras.todos();
    return todas
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .map(c => {
        const total = c.lineas.reduce(
          (suma, l) =>
            suma.sumar(
              Dinero.desdeSoles(l.precioPresentacionPagadoSoles).multiplicarPor(
                l.cantidadRecibidaPresent,
              ),
            ),
          Dinero.cero(),
        );
        return {
          id: c.id.valor,
          proveedorNombre: c.proveedorNombre,
          fechaFormato: formatoFecha(c.fecha),
          cantidadLineas: c.lineas.length,
          totalFormato: total.formato(),
          lineas: c.lineas.map(l => ({
            insumoNombre: l.insumoNombre,
            cantidadRecibidaPresent: l.cantidadRecibidaPresent,
            precioPagadoFormato: Dinero.desdeSoles(l.precioPresentacionPagadoSoles).formato(),
            cantidadUnidadBase: l.cantidadUnidadBase,
          })),
        };
      });
  }
}
