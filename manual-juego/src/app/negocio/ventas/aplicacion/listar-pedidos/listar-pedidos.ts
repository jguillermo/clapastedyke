import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { formatoFecha } from '../../../compartido/aplicacion/formatos';
import { EstadoPedido, PedidoPrimitivos } from '../../dominio/pedido/pedido';
import { RepositorioPedidos } from '../../dominio/pedido/repositorio-pedidos';

export interface PeticionListarPedidos {
  estado?: EstadoPedido;
  clienteId?: string;
}

export interface PedidoListado extends PedidoPrimitivos {
  fechaCreacionFormato: string;
  fechaEntregaFormato: string; // '—' si aún no se entrega
}

export class ListarPedidos implements CasoDeUso<PeticionListarPedidos, PedidoListado[]> {
  constructor(private readonly pedidos: RepositorioPedidos) {}

  async ejecutar(peticion: PeticionListarPedidos = {}): Promise<PedidoListado[]> {
    let lista = (await this.pedidos.todos()).map(p => {
      const primitivos = p.aPrimitivos();
      return {
        ...primitivos,
        fechaCreacionFormato: formatoFecha(primitivos.fechaCreacion),
        fechaEntregaFormato: formatoFecha(primitivos.fechaEntrega),
      };
    });
    if (peticion.estado) lista = lista.filter(p => p.estado === peticion.estado);
    if (peticion.clienteId) lista = lista.filter(p => p.clienteId === peticion.clienteId);
    return lista.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
  }
}
