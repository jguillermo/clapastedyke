import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Movimiento, TipoMovimiento } from './movimiento';

export interface RepositorioMovimientos {
  siguienteId(): Promise<IdEntidad>;
  guardar(movimiento: Movimiento): Promise<void>;
  todos(): Promise<Movimiento[]>;
  /** Los consumos de un pedido, para revertirlos al cancelar. */
  porReferenciaYTipo(referencia: string, tipo: TipoMovimiento): Promise<Movimiento[]>;
}
