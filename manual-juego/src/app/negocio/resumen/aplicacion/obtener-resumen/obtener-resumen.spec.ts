import { beforeEach, describe, expect, it } from 'vitest';
import { BusEventosEnMemoria } from '../../../compartido/aplicacion/bus-eventos';
import { GuardarCliente } from '../../../catalogo/aplicacion/guardar-cliente/guardar-cliente';
import { GuardarInsumo } from '../../../catalogo/aplicacion/guardar-insumo/guardar-insumo';
import { GuardarReceta } from '../../../catalogo/aplicacion/guardar-receta/guardar-receta';
import {
  RepositorioClientesEnMemoria,
  RepositorioInsumosEnMemoria,
  RepositorioRecetasEnMemoria,
} from '../../../catalogo/infraestructura/repositorios-memoria';
import { RepositorioConfiguracionEnMemoria } from '../../../configuracion/infraestructura/repositorio-configuracion-memoria';
import { ServicioStock } from '../../../inventario/dominio/servicio-stock';
import { RepositorioMovimientosEnMemoria } from '../../../inventario/infraestructura/repositorios-memoria';
import { AprobarPresupuesto } from '../../../ventas/aplicacion/aprobar-presupuesto/aprobar-presupuesto';
import { GuardarPresupuesto } from '../../../ventas/aplicacion/guardar-presupuesto/guardar-presupuesto';
import { IniciarProduccion } from '../../../ventas/aplicacion/iniciar-produccion/iniciar-produccion';
import { RepositorioPresupuestosEnMemoria } from '../../../ventas/infraestructura/repositorio-presupuestos-memoria';
import {
  RepositorioPedidosEnMemoria,
  RepositorioVentasEnMemoria,
} from '../../../ventas/infraestructura/repositorios-pedidos-ventas-memoria';
import { ObtenerResumen } from './obtener-resumen';

describe('ObtenerResumen (proyección del panel Inicio)', () => {
  let resumen: ObtenerResumen;
  let preparar: () => Promise<void>;

  beforeEach(() => {
    const clientes = new RepositorioClientesEnMemoria();
    const insumos = new RepositorioInsumosEnMemoria();
    const recetas = new RepositorioRecetasEnMemoria();
    const configuracion = new RepositorioConfiguracionEnMemoria();
    const presupuestos = new RepositorioPresupuestosEnMemoria();
    const pedidos = new RepositorioPedidosEnMemoria();
    const movimientos = new RepositorioMovimientosEnMemoria();
    const bus = new BusEventosEnMemoria();
    const stock = new ServicioStock(insumos, movimientos);

    resumen = new ObtenerResumen(presupuestos, pedidos, insumos);

    preparar = async () => {
      const clienteId = (await new GuardarCliente(clientes, bus).ejecutar({ nombre: 'María Quispe' })).id;
      const gi = new GuardarInsumo(insumos, bus);
      // Cacao agotado (rojo) y mantequilla bajo mínimo (amarillo)
      await gi.ejecutar({ nombre: 'Cacao en polvo', tipo: 'ingrediente', unidadBase: 'g', tamanoPresentacion: 500, precioPresentacionSoles: 20, stockInicial: 0, stockMinimo: 100 });
      await gi.ejecutar({ nombre: 'Mantequilla', tipo: 'ingrediente', unidadBase: 'g', tamanoPresentacion: 500, precioPresentacionSoles: 10, stockInicial: 180, stockMinimo: 500 });
      const harinaId = (
        await gi.ejecutar({ nombre: 'Harina', tipo: 'ingrediente', unidadBase: 'g', tamanoPresentacion: 1000, precioPresentacionSoles: 5, stockInicial: 9000, stockMinimo: 100 })
      ).id;
      const recetaId = (
        await new GuardarReceta(recetas, insumos, bus).ejecutar({
          nombre: 'Torta', tipoBase: 'personas', racionesBase: 10,
          ingredientes: [{ insumoId: harinaId, cantidadBase: 300 }],
        })
      ).id;

      const guardar = new GuardarPresupuesto(presupuestos, clientes, recetas, insumos, configuracion, bus);
      const aprobar = new AprobarPresupuesto(presupuestos, pedidos, insumos, stock, configuracion, bus);
      const producir = new IniciarProduccion(pedidos, stock, bus);

      // P1 pendiente (vence en 15 días → cuenta en pendientes y en «vencen esta semana» NO)
      await guardar.ejecutar({ clienteId, recetaId, modoEscalado: 'personas', valorEscalado: 10, empaques: [], margen: 30, aplicaIgv: false });
      // P2 → aprobado → pedido a producción (por entregar)
      const p2 = await guardar.ejecutar({ clienteId, recetaId, modoEscalado: 'personas', valorEscalado: 10, empaques: [], margen: 30, aplicaIgv: false });
      const { pedidoId } = await aprobar.ejecutar({ presupuestoId: p2.id });
      await producir.ejecutar({ pedidoId });
    };
  });

  it('cuenta los KPIs del día y arma las alertas con su acción', async () => {
    await preparar();
    const r = await resumen.ejecutar();

    const porTitulo = Object.fromEntries(r.kpis.map(k => [k.titulo, k.valor]));
    expect(porTitulo['Presupuestos pendientes']).toBe(1);
    expect(porTitulo['Vencen esta semana']).toBe(0); // vence a 15 días
    expect(porTitulo['Pedidos pendientes']).toBe(0); // pasó a producción
    expect(porTitulo['Por entregar']).toBe(1);
    expect(porTitulo['Insumos en rojo']).toBe(1); // cacao

    const tipos = r.atencion.map(a => a.tipo);
    expect(tipos).toContain('agotado');
    expect(tipos).toContain('bajo-minimo');
    expect(tipos).toContain('por-entregar');

    const agotado = r.atencion.find(a => a.tipo === 'agotado')!;
    expect(agotado.etiqueta).toBe('AGOTADO');
    expect(agotado.texto).toBe('Cacao en polvo · stock 0 g');
    expect(agotado.accion).toBe('Comprar');
    expect(agotado.ruta).toBe('/sistema/compras');

    const bajoMinimo = r.atencion.find(a => a.tipo === 'bajo-minimo')!;
    expect(bajoMinimo.texto).toBe('Mantequilla · 180 g de 500 g');

    const porEntregar = r.atencion.find(a => a.tipo === 'por-entregar')!;
    expect(porEntregar.texto).toContain('Pedido PD-0001 · María Quispe');
    expect(porEntregar.accion).toBe('Ver');

    expect(r.fechaLarga.length).toBeGreaterThan(8); // 'lunes 01 jun 2026'
  });

  it('con la base vacía: KPIs a cero y sin alertas', async () => {
    const r = await resumen.ejecutar();
    expect(r.kpis.every(k => k.valor === 0)).toBe(true);
    expect(r.atencion).toHaveLength(0);
  });
});
