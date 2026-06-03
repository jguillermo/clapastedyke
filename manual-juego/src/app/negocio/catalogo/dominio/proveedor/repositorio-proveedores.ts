import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Proveedor } from './proveedor';

export interface RepositorioProveedores {
  siguienteId(): Promise<IdEntidad>;
  porId(id: IdEntidad): Promise<Proveedor | null>;
  porNombre(nombre: string): Promise<Proveedor | null>;
  guardar(proveedor: Proveedor): Promise<void>;
  todos(): Promise<Proveedor[]>;
}
