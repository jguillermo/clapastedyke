import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Presupuesto } from './presupuesto';

export interface RepositorioPresupuestos {
  siguienteId(): Promise<IdEntidad>;
  porId(id: IdEntidad): Promise<Presupuesto | null>;
  guardar(presupuesto: Presupuesto): Promise<void>;
  todos(): Promise<Presupuesto[]>;
}
