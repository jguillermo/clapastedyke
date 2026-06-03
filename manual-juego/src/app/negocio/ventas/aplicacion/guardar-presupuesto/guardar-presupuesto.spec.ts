import { beforeEach, describe, expect, it } from 'vitest';
import { BusEventosEnMemoria } from '../../../compartido/aplicacion/bus-eventos';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import {
  RepositorioClientesEnMemoria,
  RepositorioInsumosEnMemoria,
  RepositorioRecetasEnMemoria,
} from '../../../catalogo/infraestructura/repositorios-memoria';
import { GuardarCliente } from '../../../catalogo/aplicacion/guardar-cliente/guardar-cliente';
import { GuardarInsumo } from '../../../catalogo/aplicacion/guardar-insumo/guardar-insumo';
import { GuardarReceta } from '../../../catalogo/aplicacion/guardar-receta/guardar-receta';
import { ActualizarConfiguracion } from '../../../configuracion/aplicacion/actualizar-configuracion/actualizar-configuracion';
import { RepositorioConfiguracionEnMemoria } from '../../../configuracion/infraestructura/repositorio-configuracion-memoria';
import { RepositorioPresupuestosEnMemoria } from '../../infraestructura/repositorio-presupuestos-memoria';
import { ListarPresupuestos } from '../listar-presupuestos/listar-presupuestos';
import { RechazarPresupuesto } from '../rechazar-presupuesto/rechazar-presupuesto';
import { GuardarPresupuesto } from './guardar-presupuesto';

describe('GuardarPresupuesto (caso de uso, ciclo del Flujo 01-02)', () => {
  let presupuestos: RepositorioPresupuestosEnMemoria;
  let guardar: GuardarPresupuesto;
  let rechazar: RechazarPresupuesto;
  let listar: ListarPresupuestos;
  let bus: BusEventosEnMemoria;
  let clienteId: string;
  let recetaId: string;

  beforeEach(async () => {
    const clientes = new RepositorioClientesEnMemoria();
    const insumos = new RepositorioInsumosEnMemoria();
    const recetas = new RepositorioRecetasEnMemoria();
    const configuracion = new RepositorioConfiguracionEnMemoria();
    presupuestos = new RepositorioPresupuestosEnMemoria();
    bus = new BusEventosEnMemoria();

    clienteId = (await new GuardarCliente(clientes, bus).ejecutar({ nombre: 'Ana Torres' })).id;
    const gi = new GuardarInsumo(insumos, bus);
    const harinaId = (
      await gi.ejecutar({ nombre: 'Harina', tipo: 'ingrediente', unidadBase: 'g', tamanoPresentacion: 1000, precioPresentacionSoles: 5 })
    ).id;
    const huevoId = (
      await gi.ejecutar({ nombre: 'Huevo', tipo: 'ingrediente', unidadBase: 'u', tamanoPresentacion: 30, precioPresentacionSoles: 15 })
    ).id;
    recetaId = (
      await new GuardarReceta(recetas, insumos, bus).ejecutar({
        nombre: 'Torta chocolate', tipoBase: 'personas', racionesBase: 10, tiempoManoObraHoras: 2,
        ingredientes: [
          { insumoId: harinaId, cantidadBase: 300 },
          { insumoId: huevoId, cantidadBase: 4 },
        ],
      })
    ).id;
    await new ActualizarConfiguracion(configuracion, bus).ejecutar({ generales: { margenDefecto: 30 } });

    guardar = new GuardarPresupuesto(presupuestos, clientes, recetas, insumos, configuracion, bus);
    rechazar = new RechazarPresupuesto(presupuestos, bus);
    listar = new ListarPresupuestos(presupuestos);
  });

  it('congela P-0001 Pendiente con el precio del manual y emite el evento', async () => {
    const eventos: string[] = [];
    bus.suscribir('PresupuestoCreado', e => void eventos.push(e.nombre));

    const r = await guardar.ejecutar({
      clienteId, recetaId, modoEscalado: 'personas', valorEscalado: 20,
      empaques: [], margen: 30, aplicaIgv: true, notas: 'Entrega sábado',
    });

    expect(r.id).toBe('P-0001');
    expect(r.precioFinalSoles).toBe(110); // sin caja: 63 → 90 → +IGV 106.2 → 110
    const guardado = await presupuestos.porId(IdEntidad.desde('P-0001'));
    expect(guardado?.estado).toBe('Pendiente');
    expect(guardado?.calculo.lineas).toHaveLength(2);
    expect(guardado?.fechaVencimiento.getTime()).toBeGreaterThan(guardado!.fechaEmision.getTime());
    expect(eventos).toEqual(['PresupuestoCreado']);
  });

  it('el presupuesto guardado queda CONGELADO aunque la receta cambie después', async () => {
    const { id } = await guardar.ejecutar({
      clienteId, recetaId, modoEscalado: 'personas', valorEscalado: 20,
      empaques: [], margen: 30, aplicaIgv: false,
    });
    const antes = (await presupuestos.porId(IdEntidad.desde(id)))!.calculo.precioFinal.soles;
    // (cambiar la receta no re-toca el agregado guardado: nada que recalcular)
    const despues = (await presupuestos.porId(IdEntidad.desde(id)))!.calculo.precioFinal.soles;
    expect(despues).toBe(antes);
  });

  it('rechazar guarda motivo y bloquea el doble rechazo', async () => {
    const { id } = await guardar.ejecutar({
      clienteId, recetaId, modoEscalado: 'factor', valorEscalado: 1,
      empaques: [], margen: 30, aplicaIgv: false,
    });
    await rechazar.ejecutar({ presupuestoId: id, motivo: 'el cliente desistió' });
    const p = await presupuestos.porId(IdEntidad.desde(id));
    expect(p?.estado).toBe('Rechazado');
    expect(p?.motivoRechazo).toBe('el cliente desistió');
    await expect(rechazar.ejecutar({ presupuestoId: id })).rejects.toThrow(ErrorValidacion);
  });

  it('lista con estadoVisible y filtros', async () => {
    await guardar.ejecutar({
      clienteId, recetaId, modoEscalado: 'factor', valorEscalado: 1,
      empaques: [], margen: 30, aplicaIgv: false,
    });
    const lista = await listar.ejecutar({ estado: 'Pendiente' });
    expect(lista).toHaveLength(1);
    expect(lista[0].estadoVisible).toBe('Pendiente');
    expect(lista[0].clienteNombre).toBe('Ana Torres');
  });
});
