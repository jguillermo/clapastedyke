import { describe, expect, it } from 'vitest';
import { BusEventosEnMemoria } from '../../../compartido/aplicacion/bus-eventos';
import { RepositorioConfiguracionEnMemoria } from '../../infraestructura/repositorio-configuracion-memoria';
import { ObtenerConfiguracion } from '../obtener-configuracion/obtener-configuracion';
import { ActualizarConfiguracion } from './actualizar-configuracion';

describe('Configuración (casos de uso)', () => {
  it('obtener siembra los defaults la primera vez y actualizar los persiste', async () => {
    const repo = new RepositorioConfiguracionEnMemoria();
    const obtener = new ObtenerConfiguracion(repo);
    const actualizar = new ActualizarConfiguracion(repo, new BusEventosEnMemoria());

    expect((await obtener.ejecutar()).generales.margenDefecto).toBe(35);

    await actualizar.ejecutar({
      generales: { margenDefecto: 30, nombreNegocio: 'Dulces Misa' },
      tamanos: [
        { nombre: 'chico', factor: 0.5 },
        { nombre: 'mediano', factor: 1 },
        { nombre: 'grande', factor: 2 },
        { nombre: 'familiar', factor: 3 },
      ],
    });

    const config = await obtener.ejecutar();
    expect(config.generales.margenDefecto).toBe(30);
    expect(config.generales.nombreNegocio).toBe('Dulces Misa');
    expect(config.tamanos).toHaveLength(4);
  });
});
