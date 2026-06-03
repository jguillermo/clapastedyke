import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ErrorNoEncontrado } from '../../../compartido/dominio/errores';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';
import { RepositorioInsumos } from '../../../catalogo/dominio/insumo/repositorio-insumos';
import { RepositorioProveedores } from '../../../catalogo/dominio/proveedor/repositorio-proveedores';
import { RepositorioPedidos } from '../../../ventas/dominio/pedido/repositorio-pedidos';

/** Un insumo a comprar, con su proveedor recomendado y el enlace de WhatsApp. */
export interface ItemListaCompras {
  insumoId: string;
  insumoNombre: string;
  cantidadSugerida: number;
  precioPresentacionSoles: number;
  proveedorId: string | null;
  proveedorNombre: string;
  whatsappEnlace: string | null;
}

/** Modo automático (Flujo 05.1): los faltantes de un pedido, por proveedor. */
export class FaltantesDePedido implements CasoDeUso<{ pedidoId: string }, ItemListaCompras[]> {
  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly insumos: RepositorioInsumos,
    private readonly proveedores: RepositorioProveedores,
  ) {}

  async ejecutar({ pedidoId }: { pedidoId: string }): Promise<ItemListaCompras[]> {
    const pedido = await this.pedidos.porId(IdEntidad.desde(pedidoId));
    if (!pedido) throw new ErrorNoEncontrado('Pedido', pedidoId);

    const items: ItemListaCompras[] = [];
    for (const req of pedido.requerimientos) {
      if (req.faltante <= 0) continue;
      items.push(await this.armarItem(req.insumoId, req.insumoNombre, req.faltante));
    }
    return items;
  }

  private async armarItem(insumoId: string, nombre: string, cantidad: number): Promise<ItemListaCompras> {
    const insumo = await this.insumos.porId(IdEntidad.desde(insumoId));
    const proveedor = insumo?.proveedorRecomendadoId
      ? await this.proveedores.porId(insumo.proveedorRecomendadoId)
      : null;
    return {
      insumoId,
      insumoNombre: nombre,
      cantidadSugerida: cantidad,
      precioPresentacionSoles: insumo?.presentacion.precio.soles ?? 0,
      proveedorId: proveedor?.id.valor ?? null,
      proveedorNombre: proveedor?.nombre ?? 'Sin proveedor',
      whatsappEnlace: proveedor?.whatsapp.enlaceChat ?? null,
    };
  }
}

/** Modo manual (Flujo 05.1): lo que está bajo el mínimo, premarcado. */
export class InsumosBajoMinimo implements CasoDeUso<void, ItemListaCompras[]> {
  constructor(
    private readonly insumos: RepositorioInsumos,
    private readonly proveedores: RepositorioProveedores,
  ) {}

  async ejecutar(): Promise<ItemListaCompras[]> {
    const todos = await this.insumos.todos();
    const items: ItemListaCompras[] = [];
    for (const insumo of todos) {
      if (!insumo.bajoMinimo) continue;
      const proveedor = insumo.proveedorRecomendadoId
        ? await this.proveedores.porId(insumo.proveedorRecomendadoId)
        : null;
      items.push({
        insumoId: insumo.id.valor,
        insumoNombre: insumo.nombre,
        cantidadSugerida: Math.max(0, insumo.stockMinimo - insumo.stockActual),
        precioPresentacionSoles: insumo.presentacion.precio.soles,
        proveedorId: proveedor?.id.valor ?? null,
        proveedorNombre: proveedor?.nombre ?? 'Sin proveedor',
        whatsappEnlace: proveedor?.whatsapp.enlaceChat ?? null,
      });
    }
    return items;
  }
}
