import { Component, computed, inject, signal } from '@angular/core';
import { FormField, applyEach, form, min, required, submit } from '@angular/forms/signals';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import { ProveedorPrimitivos } from '../../negocio/catalogo/dominio/proveedor/proveedor';
import { InsumoListado } from '../../negocio/catalogo/aplicacion/listar-insumos/listar-insumos';
import { PedidoListado } from '../../negocio/ventas/aplicacion/listar-pedidos/listar-pedidos';
import { ItemListaCompras } from '../../negocio/inventario/aplicacion/lista-compras/lista-compras';
import { CompraListada } from '../../negocio/inventario/aplicacion/listar-compras/listar-compras';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

type ModoLista = 'automatico' | 'manual';

interface ModeloCompra {
  proveedorId: string;
  fecha: string;
  lineas: { insumoId: string; cantidadRecibidaPresent: number; precioPresentacionPagadoSoles: number }[];
}

/**
 * Pantalla de Compras: tres tarjetas. (1) «Comprar materiales» arma la lista
 * de pedido al proveedor (automático = faltantes de un pedido / manual =
 * insumos bajo mínimo) y NO toca stock. (2) «Registrar compra recibida» es el
 * formulario con FILAS DINÁMICAS (applyEach) que sube stock y actualiza
 * precios. (3) «Historial» lista las compras ya registradas. La vista NO
 * calcula ni formatea: los DTOs llegan listos del negocio.
 */
@Component({
  selector: 'app-pantalla-compras',
  imports: [...UI_FORMULARIOS, FormField],
  templateUrl: './pantalla-compras.html',
})
export class PantallaCompras {
  private readonly negocio = inject(Negocio);

  // --- Tarjeta 1: comprar materiales (lista al proveedor) ---
  protected readonly modo = signal<ModoLista>('automatico');
  protected readonly pedidos = signal<PedidoListado[]>([]);
  protected readonly pedidoId = signal<string>('');
  protected readonly items = signal<ItemListaCompras[]>([]);
  protected readonly cargandoItems = signal(false);

  /** Solo los pedidos que tienen algún requerimiento con faltante > 0 (filtro, no cálculo). */
  protected readonly pedidosConFaltantes = computed(() =>
    this.pedidos().filter(p => p.requerimientos.some(r => r.faltante > 0)),
  );

  // --- Tarjeta 2: registrar compra recibida (Signal Forms + filas dinámicas) ---
  protected readonly proveedores = signal<ProveedorPrimitivos[]>([]);
  protected readonly insumos = signal<InsumoListado[]>([]);
  protected readonly guardando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  protected readonly modelo = signal<ModeloCompra>({ proveedorId: '', fecha: '', lineas: [] });
  protected readonly formulario = form(this.modelo, campo => {
    required(campo.proveedorId, { message: 'Elige un proveedor.' });
    applyEach(campo.lineas, linea => {
      required(linea.insumoId, { message: 'Elige un insumo.' });
      min(linea.cantidadRecibidaPresent, 0.0001, { message: 'Mayor que 0.' });
      min(linea.precioPresentacionPagadoSoles, 0.01, { message: 'Mayor que 0.' });
    });
  });

  // --- Tarjeta 3: historial ---
  protected readonly compras = signal<CompraListada[]>([]);
  protected readonly cargandoHistorial = signal(true);
  protected readonly expandida = signal<string | null>(null);

  constructor() {
    void this.cargarCatalogos();
    void this.recargarHistorial();
    void this.cargarItems();
  }

  private async cargarCatalogos(): Promise<void> {
    this.proveedores.set(await this.negocio.listarProveedores.ejecutar());
    this.insumos.set(await this.negocio.listarInsumos.ejecutar({}));
    this.pedidos.set(await this.negocio.listarPedidos.ejecutar({}));
  }

  // ---------- Tarjeta 1 ----------
  protected cambiarModo(modo: ModoLista): void {
    this.modo.set(modo);
    void this.cargarItems();
  }

  protected elegirPedido(id: string): void {
    this.pedidoId.set(id);
    void this.cargarItems();
  }

  /** Carga los items y los ordena por proveedor (orden, no cálculo). */
  protected async cargarItems(): Promise<void> {
    this.cargandoItems.set(true);
    let lista: ItemListaCompras[] = [];
    if (this.modo() === 'manual') {
      lista = await this.negocio.insumosBajoMinimo.ejecutar();
    } else if (this.pedidoId()) {
      lista = await this.negocio.faltantesDePedido.ejecutar({ pedidoId: this.pedidoId() });
    }
    lista = [...lista].sort((a, b) => a.proveedorNombre.localeCompare(b.proveedorNombre, 'es'));
    this.items.set(lista);
    this.cargandoItems.set(false);
  }

  // ---------- Tarjeta 2 ----------
  protected agregarLinea(): void {
    this.modelo.update(m => ({
      ...m,
      lineas: [...m.lineas, { insumoId: '', cantidadRecibidaPresent: 0, precioPresentacionPagadoSoles: 0 }],
    }));
  }

  protected quitarLinea(indice: number): void {
    this.modelo.update(m => ({ ...m, lineas: m.lineas.filter((_, i) => i !== indice) }));
  }

  protected limpiar(): void {
    this.modelo.set({ proveedorId: '', fecha: '', lineas: [] });
    this.formulario().reset();
    this.aviso.set(null);
  }

  /** submit() marca todo touched y solo corre si es válido. */
  protected guardar(): void {
    void submit(this.formulario, async () => {
      this.guardando.set(true);
      this.aviso.set(null);
      try {
        const m = this.modelo();
        const r = await this.negocio.registrarCompra.ejecutar({
          proveedorId: m.proveedorId,
          ...(m.fecha ? { fecha: m.fecha } : {}),
          lineas: m.lineas.map(l => ({
            insumoId: l.insumoId,
            cantidadRecibidaPresent: l.cantidadRecibidaPresent,
            precioPresentacionPagadoSoles: l.precioPresentacionPagadoSoles,
          })),
        });
        this.aviso.set({
          tipo: 'ok',
          texto: `Compra ${r.id} registrada: stock y precios actualizados.`,
        });
        this.limpiar();
        await this.recargarHistorial();
        // El stock cambió: refrescar insumos y la lista de materiales si está en modo manual.
        await this.cargarCatalogos();
        await this.cargarItems();
      } catch (error) {
        const texto = error instanceof ErrorDominio ? error.message : 'No se pudo registrar la compra.';
        this.aviso.set({ tipo: 'err', texto });
      } finally {
        this.guardando.set(false);
      }
    });
  }

  // ---------- Tarjeta 3 ----------
  protected async recargarHistorial(): Promise<void> {
    this.cargandoHistorial.set(true);
    this.compras.set(await this.negocio.listarCompras.ejecutar());
    this.cargandoHistorial.set(false);
  }

  protected alternarExpandida(id: string): void {
    this.expandida.update(actual => (actual === id ? null : id));
  }
}
