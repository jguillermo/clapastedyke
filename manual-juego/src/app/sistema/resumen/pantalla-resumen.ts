import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Negocio } from '../../composicion/negocio';
import { ResumenNegocio, TipoAlerta } from '../../negocio/resumen/aplicacion/obtener-resumen/obtener-resumen';
import { ICONOS } from '../../svg/iconos';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

interface Acceso {
  titulo: string;
  subtitulo: string;
  ruta: string;
  icono: string;
}

/**
 * Inicio: el panel del día (doc/diseno_visual_interfaz.html). Los KPIs y las
 * alertas «necesita tu atención» los calcula ObtenerResumen — aquí solo se pintan.
 */
@Component({
  selector: 'app-pantalla-resumen',
  imports: [RouterLink, ...UI_FORMULARIOS],
  templateUrl: './pantalla-resumen.html',
})
export class PantallaResumen {
  private readonly negocio = inject(Negocio);

  protected readonly resumen = signal<ResumenNegocio | null>(null);

  protected readonly accesos: Acceso[] = [
    { titulo: 'Nuevo presupuesto', subtitulo: 'Crear y congelar precios', ruta: '/sistema/presupuestos/nuevo', icono: ICONOS['f01'] },
    { titulo: 'Ver presupuestos', subtitulo: 'Aprobar o rechazar', ruta: '/sistema/presupuestos', icono: ICONOS['f02'] },
    { titulo: 'Ver pedidos', subtitulo: 'Producción y entrega', ruta: '/sistema/pedidos', icono: ICONOS['f03'] },
    { titulo: 'Comprar materiales', subtitulo: 'Lista por proveedor', ruta: '/sistema/compras', icono: ICONOS['f05'] },
    { titulo: 'Registrar compra', subtitulo: 'Sube stock y precio', ruta: '/sistema/compras', icono: ICONOS['f12'] },
    { titulo: 'Ajustar inventario', subtitulo: 'Mermas y conteos', ruta: '/sistema/inventario', icono: ICONOS['f06'] },
    { titulo: 'Catálogos', subtitulo: 'Clientes, insumos, más', ruta: '/sistema/clientes', icono: ICONOS['f10'] },
    { titulo: 'Configuración', subtitulo: 'Tarifas, IGV, margen', ruta: '/sistema/configuracion', icono: ICONOS['f13'] },
  ];

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.resumen.set(await this.negocio.obtenerResumen.ejecutar());
  }

  /** Borde izquierdo de la tarjeta KPI según su color de negocio. */
  protected claseKpi(color: string): string {
    const bordes: Record<string, string> = {
      acento: 'border-l-acento',
      ambar: 'border-l-ambar',
      apagado: 'border-l-apagado',
      verde: 'border-l-verde',
      rojo: 'border-l-rojo',
    };
    return bordes[color] ?? 'border-l-linea';
  }

  protected claseNumeroKpi(color: string): string {
    const colores: Record<string, string> = {
      acento: 'text-acento',
      ambar: 'text-ambar',
      apagado: 'text-apagado',
      verde: 'text-verde',
      rojo: 'text-rojo',
    };
    return colores[color] ?? 'text-tinta';
  }

  protected claseBadge(tipo: TipoAlerta): string {
    const clases: Record<TipoAlerta, string> = {
      vence: 'bg-ambar-suave text-ambar',
      agotado: 'bg-rojo-suave text-rojo',
      'bajo-minimo': 'bg-ambar-suave text-ambar',
      'por-entregar': 'bg-verde-suave text-verde',
    };
    return clases[tipo];
  }
}
