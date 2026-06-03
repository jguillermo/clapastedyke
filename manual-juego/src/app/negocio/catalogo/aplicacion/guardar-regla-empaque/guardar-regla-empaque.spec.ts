import { beforeEach, describe, expect, it } from 'vitest';
import { BusEventosEnMemoria } from '../../../compartido/aplicacion/bus-eventos';
import { ErrorDuplicado, ErrorValidacion } from '../../../compartido/dominio/errores';
import {
  RepositorioInsumosEnMemoria,
  RepositorioRecetasEnMemoria,
  RepositorioReglasEmpaqueEnMemoria,
} from '../../infraestructura/repositorios-memoria';
import { GuardarInsumo } from '../guardar-insumo/guardar-insumo';
import { GuardarReceta } from '../guardar-receta/guardar-receta';
import { GuardarReglaEmpaque } from './guardar-regla-empaque';

describe('GuardarReglaEmpaque (caso de uso)', () => {
  let reglas: RepositorioReglasEmpaqueEnMemoria;
  let recetas: RepositorioRecetasEnMemoria;
  let insumos: RepositorioInsumosEnMemoria;
  let caso: GuardarReglaEmpaque;
  let recetaId: string;
  let cajaId: string;
  let harinaId: string;

  beforeEach(async () => {
    reglas = new RepositorioReglasEmpaqueEnMemoria();
    recetas = new RepositorioRecetasEnMemoria();
    insumos = new RepositorioInsumosEnMemoria();
    const bus = new BusEventosEnMemoria();
    const tamanos = { nombres: async () => ['chico', 'mediano', 'grande'] };
    caso = new GuardarReglaEmpaque(reglas, recetas, insumos, tamanos, bus);

    const guardarInsumo = new GuardarInsumo(insumos, bus);
    harinaId = (
      await guardarInsumo.ejecutar({
        nombre: 'Harina', tipo: 'ingrediente', unidadBase: 'g',
        tamanoPresentacion: 1000, precioPresentacionSoles: 5,
      })
    ).id;
    cajaId = (
      await guardarInsumo.ejecutar({
        nombre: 'Caja torta', tipo: 'empaque', unidadBase: 'u',
        tamanoPresentacion: 25, precioPresentacionSoles: 25,
      })
    ).id;
    recetaId = (
      await new GuardarReceta(recetas, insumos, bus).ejecutar({
        nombre: 'Torta chocolate', tipoBase: 'personas', racionesBase: 10,
        ingredientes: [{ insumoId: harinaId, cantidadBase: 300 }],
      })
    ).id;
  });

  it('crea la regla RL-0001 para receta + tamaño + empaque', async () => {
    const r = await caso.ejecutar({ recetaId, tamano: 'Grande', insumoEmpaqueId: cajaId, cantidad: 1 });
    expect(r.id).toBe('RL-0001');
    const sugeridas = await reglas.deRecetaYTamano((await recetas.porNombre('Torta chocolate'))!.id, 'grande');
    expect(sugeridas).toHaveLength(1);
  });

  it('rechaza la terna duplicada y tamaños fuera de configuración', async () => {
    await caso.ejecutar({ recetaId, tamano: 'grande', insumoEmpaqueId: cajaId, cantidad: 1 });
    await expect(
      caso.ejecutar({ recetaId, tamano: 'grande', insumoEmpaqueId: cajaId, cantidad: 2 }),
    ).rejects.toThrow(ErrorDuplicado);
    await expect(
      caso.ejecutar({ recetaId, tamano: 'gigante', insumoEmpaqueId: cajaId, cantidad: 1 }),
    ).rejects.toThrow(ErrorValidacion);
  });

  it('rechaza usar un ingrediente como empaque', async () => {
    await expect(
      caso.ejecutar({ recetaId, tamano: 'chico', insumoEmpaqueId: harinaId, cantidad: 1 }),
    ).rejects.toThrow(ErrorValidacion);
  });
});
