import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ClientePrimitivos } from '../../dominio/cliente/cliente';
import { RepositorioClientes } from '../../dominio/cliente/repositorio-clientes';

/** Lista de clientes para la UI (DTOs planos, orden alfabético). */
export class ListarClientes implements CasoDeUso<void, ClientePrimitivos[]> {
  constructor(private readonly clientes: RepositorioClientes) {}

  async ejecutar(): Promise<ClientePrimitivos[]> {
    const todos = await this.clientes.todos();
    return todos
      .map(c => c.aPrimitivos())
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
}
