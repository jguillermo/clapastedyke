import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { ReglaEmpaque } from './regla-empaque';

export interface RepositorioReglasEmpaque {
  siguienteId(): Promise<IdEntidad>;
  porId(id: IdEntidad): Promise<ReglaEmpaque | null>;
  guardar(regla: ReglaEmpaque): Promise<void>;
  todos(): Promise<ReglaEmpaque[]>;
  /** Sugerencias al cotizar: las reglas de una receta en un tamaño. */
  deRecetaYTamano(recetaId: IdEntidad, tamano: string): Promise<ReglaEmpaque[]>;
}

/**
 * Puerto hacia CONFIGURACION: tamaños válidos del negocio (chico, mediano…).
 * En Etapa 2 lo implementa el subdominio configuración; mientras tanto los
 * tests y la app lo inyectan con una lista fija.
 */
export interface TamanosDisponibles {
  nombres(): Promise<string[]>;
}
