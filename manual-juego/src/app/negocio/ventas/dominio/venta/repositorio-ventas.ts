import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Venta } from './venta';

export interface RepositorioVentas {
  siguienteId(): Promise<IdEntidad>;
  guardar(venta: Venta): Promise<void>;
  todos(): Promise<Venta[]>;
}
