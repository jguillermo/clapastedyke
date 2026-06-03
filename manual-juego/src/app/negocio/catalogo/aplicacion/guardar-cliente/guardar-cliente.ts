import { BusEventos } from '../../../compartido/aplicacion/bus-eventos';
import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorDuplicado, ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { Cliente } from '../../dominio/cliente/cliente';
import { RepositorioClientes } from '../../dominio/cliente/repositorio-clientes';

export interface PeticionGuardarCliente {
  /** Vacío = alta; con id = edición. */
  id?: string;
  nombre: string;
  telefono?: string;
  notas?: string;
}

export interface RespuestaGuardarCliente {
  id: string;
}

/** Alta o edición de cliente con unicidad de nombre (src/Clientes.js). */
export class GuardarCliente implements CasoDeUso<PeticionGuardarCliente, RespuestaGuardarCliente> {
  constructor(
    private readonly clientes: RepositorioClientes,
    private readonly bus: BusEventos,
  ) {}

  async ejecutar(peticion: PeticionGuardarCliente): Promise<RespuestaGuardarCliente> {
    const existente = await this.clientes.porNombre(peticion.nombre);

    if (peticion.id) {
      const id = IdEntidad.desde(peticion.id);
      const cliente = await this.clientes.porId(id);
      if (!cliente) throw new ErrorNoEncontrado('Cliente', peticion.id);
      if (existente && !existente.id.esIgualA(id)) {
        throw new ErrorDuplicado('Ya existe un cliente con ese nombre.');
      }
      cliente.editar(peticion);
      await this.clientes.guardar(cliente);
      await this.bus.publicar(cliente.extraerEventos());
      return { id: cliente.id.valor };
    }

    if (existente) throw new ErrorDuplicado('Ya existe un cliente con ese nombre.');
    const cliente = Cliente.crear(await this.clientes.siguienteId(), peticion);
    await this.clientes.guardar(cliente);
    await this.bus.publicar(cliente.extraerEventos());
    return { id: cliente.id.valor };
  }
}
