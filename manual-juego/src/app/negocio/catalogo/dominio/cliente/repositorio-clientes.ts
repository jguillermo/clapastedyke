import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Cliente } from './cliente';

/**
 * Puerto de persistencia del agregado Cliente (colección en memoria).
 * La implementación vive en infraestructura (IndexedDB).
 */
export interface RepositorioClientes {
  siguienteId(): Promise<IdEntidad>;
  porId(id: IdEntidad): Promise<Cliente | null>;
  /** Búsqueda exacta case-insensitive (regla de unicidad del GAS). */
  porNombre(nombre: string): Promise<Cliente | null>;
  guardar(cliente: Cliente): Promise<void>;
  todos(): Promise<Cliente[]>;
}
