import { beforeEach, describe, expect, it } from 'vitest';
import { BusEventosEnMemoria } from '../../../compartido/aplicacion/bus-eventos';
import { ErrorDuplicado } from '../../../compartido/dominio/errores';
import { EventoDominio } from '../../../compartido/dominio/evento-dominio';
import { RepositorioClientesEnMemoria } from '../../infraestructura/repositorios-memoria';
import { GuardarCliente } from './guardar-cliente';

describe('GuardarCliente (caso de uso)', () => {
  let clientes: RepositorioClientesEnMemoria;
  let bus: BusEventosEnMemoria;
  let caso: GuardarCliente;
  let publicados: EventoDominio[];

  beforeEach(() => {
    clientes = new RepositorioClientesEnMemoria();
    bus = new BusEventosEnMemoria();
    publicados = [];
    bus.suscribir('ClienteCreado', e => void publicados.push(e));
    bus.suscribir('ClienteEditado', e => void publicados.push(e));
    caso = new GuardarCliente(clientes, bus);
  });

  it('alta: genera CL-0001, persiste y publica ClienteCreado', async () => {
    const r = await caso.ejecutar({ nombre: 'Ana Torres', telefono: '999000111' });
    expect(r.id).toBe('CL-0001');
    expect((await clientes.todos()).map(c => c.nombre)).toEqual(['Ana Torres']);
    expect(publicados.map(e => e.nombre)).toEqual(['ClienteCreado']);
  });

  it('rechaza nombres duplicados (case-insensitive, regla del GAS)', async () => {
    await caso.ejecutar({ nombre: 'Ana Torres' });
    await expect(caso.ejecutar({ nombre: '  ana torres ' })).rejects.toThrow(ErrorDuplicado);
  });

  it('edición: corrige datos sin duplicar y publica ClienteEditado', async () => {
    const { id } = await caso.ejecutar({ nombre: 'Ana Torres' });
    await caso.ejecutar({ id, nombre: 'Ana Torres', telefono: '999888777' });
    const guardado = await clientes.porNombre('Ana Torres');
    expect(guardado?.telefono).toBe('999888777');
    expect(publicados.map(e => e.nombre)).toEqual(['ClienteCreado', 'ClienteEditado']);
  });

  it('editar conservando el propio nombre no es duplicado', async () => {
    const { id } = await caso.ejecutar({ nombre: 'Ana Torres' });
    await expect(caso.ejecutar({ id, nombre: 'Ana Torres' })).resolves.toEqual({ id });
  });
});
