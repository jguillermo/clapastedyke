import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { formatoFechaLarga } from '../../../compartido/aplicacion/formatos';
import { RepositorioInsumos } from '../../../catalogo/dominio/insumo/repositorio-insumos';
import { RepositorioPedidos } from '../../../ventas/dominio/pedido/repositorio-pedidos';
import { RepositorioPresupuestos } from '../../../ventas/dominio/presupuesto/repositorio-presupuestos';

/**
 * Proyección de LECTURA del panel Inicio (el «Resumen» del GAS): los KPIs del
 * día y la lista «necesita tu atención», calculados aquí — la vista solo pinta.
 */

export type TipoAlerta = 'vence' | 'agotado' | 'bajo-minimo' | 'por-entregar';

export interface AlertaAtencion {
  tipo: TipoAlerta;
  /** Texto del badge: 'VENCE EN 2 DÍAS', 'AGOTADO', 'BAJO MÍNIMO', 'POR ENTREGAR'. */
  etiqueta: string;
  /** 'Presupuesto P-0042 · María Quispe', 'Cacao en polvo · stock 0 g'… */
  texto: string;
  /** Texto del enlace de acción: 'Ver' | 'Comprar'. */
  accion: string;
  /** Ruta del sistema a la que lleva la acción. */
  ruta: string;
}

export interface KpiResumen {
  valor: number;
  titulo: string;
  /** Color de la barrita izquierda: 'acento' | 'ambar' | 'apagado' | 'verde' | 'rojo'. */
  color: 'acento' | 'ambar' | 'apagado' | 'verde' | 'rojo';
}

export interface ResumenNegocio {
  fechaLarga: string;
  kpis: KpiResumen[];
  atencion: AlertaAtencion[];
}

const DIA_MS = 24 * 60 * 60 * 1000;

export class ObtenerResumen implements CasoDeUso<void, ResumenNegocio> {
  constructor(
    private readonly presupuestos: RepositorioPresupuestos,
    private readonly pedidos: RepositorioPedidos,
    private readonly insumos: RepositorioInsumos,
  ) {}

  async ejecutar(): Promise<ResumenNegocio> {
    const hoy = new Date();
    const [todosPresupuestos, todosPedidos, todosInsumos] = await Promise.all([
      this.presupuestos.todos(),
      this.pedidos.todos(),
      this.insumos.todos(),
    ]);

    /* ---------- KPIs ---------- */
    const pendientes = todosPresupuestos.filter(p => p.estadoVisible(hoy) === 'Pendiente');
    const vencenEstaSemana = pendientes.filter(p => {
      const dias = (p.fechaVencimiento.getTime() - hoy.getTime()) / DIA_MS;
      return dias >= 0 && dias <= 7;
    });
    const pedidosPendientes = todosPedidos.filter(p => p.estado === 'Pendiente');
    const porEntregar = todosPedidos.filter(p => p.estado === 'Producción');
    const insumosEnRojo = todosInsumos.filter(i => i.semaforo === 'rojo');

    const kpis: KpiResumen[] = [
      { valor: pendientes.length, titulo: 'Presupuestos pendientes', color: 'acento' },
      { valor: vencenEstaSemana.length, titulo: 'Vencen esta semana', color: 'ambar' },
      { valor: pedidosPendientes.length, titulo: 'Pedidos pendientes', color: 'apagado' },
      { valor: porEntregar.length, titulo: 'Por entregar', color: 'verde' },
      { valor: insumosEnRojo.length, titulo: 'Insumos en rojo', color: 'rojo' },
    ];

    /* ---------- Necesita tu atención ---------- */
    const atencion: AlertaAtencion[] = [];

    // Presupuestos que vencen pronto (≤ 3 días) o ya vencieron
    for (const p of todosPresupuestos) {
      const visible = p.estadoVisible(hoy);
      if (visible === 'Vencido') {
        atencion.push({
          tipo: 'vence',
          etiqueta: 'VENCIDO',
          texto: `Presupuesto ${p.id.valor} · ${p.clienteNombre}`,
          accion: 'Ver',
          ruta: '/sistema/presupuestos',
        });
        continue;
      }
      if (visible !== 'Pendiente') continue;
      const dias = Math.ceil((p.fechaVencimiento.getTime() - hoy.getTime()) / DIA_MS);
      if (dias > 3) continue;
      atencion.push({
        tipo: 'vence',
        etiqueta: dias <= 0 ? 'VENCE HOY' : dias === 1 ? 'VENCE MAÑANA' : `VENCE EN ${dias} DÍAS`,
        texto: `Presupuesto ${p.id.valor} · ${p.clienteNombre}`,
        accion: 'Ver',
        ruta: '/sistema/presupuestos',
      });
    }

    // Insumos agotados y bajo mínimo
    for (const i of todosInsumos) {
      if (i.semaforo === 'rojo') {
        atencion.push({
          tipo: 'agotado',
          etiqueta: 'AGOTADO',
          texto: `${i.nombre} · stock ${i.stockActual} ${i.unidadBase}`,
          accion: 'Comprar',
          ruta: '/sistema/compras',
        });
      } else if (i.semaforo === 'amarillo') {
        atencion.push({
          tipo: 'bajo-minimo',
          etiqueta: 'BAJO MÍNIMO',
          texto: `${i.nombre} · ${i.stockActual} ${i.unidadBase} de ${i.stockMinimo} ${i.unidadBase}`,
          accion: 'Comprar',
          ruta: '/sistema/compras',
        });
      }
    }

    // Pedidos en producción listos para entregar
    for (const p of porEntregar) {
      atencion.push({
        tipo: 'por-entregar',
        etiqueta: 'POR ENTREGAR',
        texto: `Pedido ${p.id.valor} · ${p.clienteNombre}`,
        accion: 'Ver',
        ruta: '/sistema/pedidos',
      });
    }

    return { fechaLarga: formatoFechaLarga(hoy), kpis, atencion };
  }
}
