import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorDuplicado, ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Proveedor } from '../../dominio/proveedor/proveedor';
import { RepositorioProveedores } from '../../dominio/proveedor/repositorio-proveedores';

export interface PeticionGuardarProveedor {
  id?: string;
  nombre: string;
  whatsapp: string;
  notas?: string;
}

export class GuardarProveedor implements CasoDeUso<PeticionGuardarProveedor, { id: string }> {
  constructor(
    private readonly proveedores: RepositorioProveedores,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionGuardarProveedor): Promise<{ id: string }> {
    const existente = await this.proveedores.porNombre(peticion.nombre);

    if (peticion.id) {
      const id = IdEntidad.desde(peticion.id);
      const proveedor = await this.proveedores.porId(id);
      if (!proveedor) throw new ErrorNoEncontrado('Proveedor', peticion.id);
      if (existente && !existente.id.esIgualA(id)) {
        throw new ErrorDuplicado('Ya existe un proveedor con ese nombre.');
      }
      proveedor.editar(peticion);
      await this.proveedores.guardar(proveedor);
      await this.bus.publicar(proveedor.extraerEventos());
      return { id: proveedor.id.valor };
    }

    if (existente) throw new ErrorDuplicado('Ya existe un proveedor con ese nombre.');
    const proveedor = Proveedor.crear(await this.proveedores.siguienteId(), peticion);
    await this.proveedores.guardar(proveedor);
    await this.bus.publicar(proveedor.extraerEventos());
    return { id: proveedor.id.valor };
  }
}
