import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Receta } from './receta';

export interface RepositorioRecetas {
  siguienteId(): Promise<IdEntidad>;
  porId(id: IdEntidad): Promise<Receta | null>;
  porNombre(nombre: string): Promise<Receta | null>;
  guardar(receta: Receta): Promise<void>;
  todos(): Promise<Receta[]>;
}
