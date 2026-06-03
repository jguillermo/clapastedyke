import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Compra } from './compra';

export interface RepositorioCompras {
  siguienteId(): Promise<IdEntidad>;
  porId(id: IdEntidad): Promise<Compra | null>;
  guardar(compra: Compra): Promise<void>;
  todos(): Promise<Compra[]>;
}
