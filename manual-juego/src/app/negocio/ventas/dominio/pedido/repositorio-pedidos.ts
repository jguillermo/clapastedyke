import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Pedido } from './pedido';

export interface RepositorioPedidos {
  siguienteId(): Promise<IdEntidad>;
  porId(id: IdEntidad): Promise<Pedido | null>;
  guardar(pedido: Pedido): Promise<void>;
  todos(): Promise<Pedido[]>;
}
