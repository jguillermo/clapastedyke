import { beforeEach, describe, expect, it } from 'vitest';
import { BusEventosEnMemoria } from '../../compartido/aplicacion/bus-eventos';
import { ErrorValidacion } from '../../compartido/dominio/errores';
import { IdEntidad } from '../../compartido/dominio/id-entidad';
import { GuardarInsumo } from '../../catalogo/aplicacion/guardar-insumo/guardar-insumo';
import { GuardarProveedor } from '../../catalogo/aplicacion/guardar-proveedor/guardar-proveedor';
import {
  RepositorioInsumosEnMemoria,
  RepositorioProveedoresEnMemoria,
} from '../../catalogo/infraestructura/repositorios-memoria';
import { RepositorioConfiguracionEnMemoria } from '../../configuracion/infraestructura/repositorio-configuracion-memoria';
import { ServicioStock } from '../dominio/servicio-stock';
import {
  RepositorioComprasEnMemoria,
  RepositorioMovimientosEnMemoria,
} from '../infraestructura/repositorios-memoria';
import { AjustarInventario, PrevisualizarAjuste } from './ajustar-inventario/ajustar-inventario';
import { InsumosBajoMinimo } from './lista-compras/lista-compras';
import { RegistrarCompra } from './registrar-compra/registrar-compra';

describe('Inventario (compras y ajustes — escenario del manual)', () => {
  let insumos: RepositorioInsumosEnMemoria;
  let movimientos: RepositorioMovimientosEnMemoria;
  let compras: RepositorioComprasEnMemoria;
  let configuracion: RepositorioConfiguracionEnMemoria;
  let bus: BusEventosEnMemoria;
  let registrarCompra: RegistrarCompra;
  let ajustar: AjustarInventario;
  let harinaId: string;
  let cajaId: string;
  let proveedorId: string;

  beforeEach(async () => {
    insumos = new RepositorioInsumosEnMemoria();
    movimientos = new RepositorioMovimientosEnMemoria();
    compras = new RepositorioComprasEnMemoria();
    configuracion = new RepositorioConfiguracionEnMemoria();
    const proveedores = new RepositorioProveedoresEnMemoria();
    bus = new BusEventosEnMemoria();
    const stock = new ServicioStock(insumos, movimientos);

    proveedorId = (
      await new GuardarProveedor(proveedores, bus).ejecutar({ nombre: 'Molinos SAC', whatsapp: '51999111222' })
    ).id;
    const gi = new GuardarInsumo(insumos, bus);
    harinaId = (
      await gi.ejecutar({
        nombre: 'Harina', tipo: 'ingrediente', unidadBase: 'g',
        tamanoPresentacion: 1000, precioPresentacionSoles: 5, stockMinimo: 2000,
        proveedorRecomendadoId: proveedorId,
      })
    ).id;
    cajaId = (
      await gi.ejecutar({
        nombre: 'Caja torta', tipo: 'empaque', unidadBase: 'u',
        tamanoPresentacion: 25, precioPresentacionSoles: 25, stockInicial: 50, stockMinimo: 10,
      })
    ).id;

    registrarCompra = new RegistrarCompra(compras, insumos, proveedores, stock, bus);
    ajustar = new AjustarInventario(insumos, configuracion, stock, bus);
  });

  it('la compra del manual: 5 bolsas a 5.50 → stock +5000 g, precio 0.0055, semáforo verde', async () => {
    const r = await registrarCompra.ejecutar({
      proveedorId,
      lineas: [{ insumoId: harinaId, cantidadRecibidaPresent: 5, precioPresentacionPagadoSoles: 5.5 }],
    });
    expect(r.id).toBe('CMP-0001');

    const harina = await insumos.porId(IdEntidad.desde(harinaId));
    expect(harina?.stockActual).toBe(5000);
    expect(harina?.presentacion.precio.soles).toBe(5.5);
    expect(harina?.precioPorUnidadBase.soles).toBe(0.0055);
    expect(harina?.semaforo).toBe('verde');

    const kardex = await movimientos.porReferenciaYTipo('CMP-0001', 'compra');
    expect(kardex).toHaveLength(1);
    expect(kardex[0].cantidad).toBe(5000);
    expect(kardex[0].stockResultante).toBe(5000);

    const compra = await compras.porId(IdEntidad.desde('CMP-0001'));
    expect(compra?.lineas[0].cantidadUnidadBase).toBe(5000);
    expect(compra?.lineas[0].precioPorUnidadBaseSoles).toBe(0.0055);
  });

  it('el ajuste del manual: merma de 5 cajas → stock 45, kardex con motivo', async () => {
    const r = await ajustar.ejecutar({ insumoId: cajaId, tipo: 'merma', cantidad: 5, motivo: 'se dañaron' });
    expect(r.stockResultante).toBe(45);
    expect(r.semaforo).toBe('verde'); // 45 > 10

    const todos = await movimientos.todos();
    const ajuste = todos.find(m => m.tipo === 'merma');
    expect(ajuste?.cantidad).toBe(-5);
    expect(ajuste?.motivo).toBe('se dañaron');
  });

  it('conteo respeta el signo; tipos desconocidos y cantidad 0 se rechazan', async () => {
    const sube = await ajustar.ejecutar({ insumoId: cajaId, tipo: 'conteo', cantidad: 3 });
    expect(sube.stockResultante).toBe(53);
    const baja = await ajustar.ejecutar({ insumoId: cajaId, tipo: 'conteo', cantidad: -8 });
    expect(baja.stockResultante).toBe(45);
    await expect(ajustar.ejecutar({ insumoId: cajaId, tipo: 'robo', cantidad: 1 })).rejects.toThrow(ErrorValidacion);
    await expect(ajustar.ejecutar({ insumoId: cajaId, tipo: 'conteo', cantidad: 0 })).rejects.toThrow(ErrorValidacion);
  });

  it('previsualizar no persiste y anticipa el semáforo', async () => {
    const prev = new PrevisualizarAjuste(insumos, configuracion);
    const r = await prev.ejecutar({ insumoId: cajaId, tipo: 'merma', cantidad: 45 });
    expect(r.stockActual).toBe(50);
    expect(r.stockResultante).toBe(5);
    expect(r.semaforo).toBe('amarillo'); // 5 ≤ 10
    expect((await insumos.porId(IdEntidad.desde(cajaId)))?.stockActual).toBe(50); // intacto
  });

  it('insumos bajo mínimo arman la lista de compras', async () => {
    // La harina (stock 0 ≤ mínimo 2000) sale premarcada; la caja no.
    const lista = await new InsumosBajoMinimo(insumos, new RepositorioProveedoresEnMemoria()).ejecutar();
    expect(lista.map(i => i.insumoNombre)).toEqual(['Harina']);
    expect(lista[0].cantidadSugerida).toBe(2000);
  });
});
