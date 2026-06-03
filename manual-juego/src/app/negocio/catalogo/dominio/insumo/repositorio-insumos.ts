import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Insumo, TipoInsumo } from './insumo';

export interface RepositorioInsumos {
  siguienteId(): Promise<IdEntidad>;
  porId(id: IdEntidad): Promise<Insumo | null>;
  porNombre(nombre: string): Promise<Insumo | null>;
  guardar(insumo: Insumo): Promise<void>;
  todos(): Promise<Insumo[]>;
  /** Catálogo filtrado: 'empaque' para reglas de empaque y presupuestos. */
  porTipo(tipo: TipoInsumo): Promise<Insumo[]>;
}
