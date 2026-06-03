import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ProveedorPrimitivos } from '../../dominio/proveedor/proveedor';
import { RepositorioProveedores } from '../../dominio/proveedor/repositorio-proveedores';

export class ListarProveedores implements CasoDeUso<void, ProveedorPrimitivos[]> {
  constructor(private readonly proveedores: RepositorioProveedores) {}

  async ejecutar(): Promise<ProveedorPrimitivos[]> {
    const todos = await this.proveedores.todos();
    return todos
      .map(p => p.aPrimitivos())
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
}
