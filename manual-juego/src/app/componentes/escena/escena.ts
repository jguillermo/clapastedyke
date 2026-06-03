import { Component, computed, input } from '@angular/core';
import { EscenaSvg } from '../../modelo/tutorial.types';

/**
 * Escena instructiva: recrea en vectorial (HTML/CSS + SVG) la pantalla del
 * software real — la hoja de Google Sheets, el menú Sistema o un formulario
 * del add-on — y anima un cursor que enseña dónde hacer clic.
 *
 * Toda la animación es CSS (keyframes); con prefers-reduced-motion queda
 * el estado final, estático.
 */
@Component({
  selector: 'app-escena',
  templateUrl: './escena.html',
  styleUrl: './escena.scss',
})
export class Escena {
  readonly escena = input.required<EscenaSvg>();

  /** Items "de relleno" del menú Sistema, como en el software real. */
  protected readonly MENU_SISTEMA = [
    'Ir al Resumen',
    'Nuevo presupuesto',
    'Ver presupuestos',
    'Ver pedidos',
    'Comprar materiales',
    'Registrar compra',
    'Ajustar inventario',
    'Clientes',
    'Insumos',
    'Proveedores',
    'Recetas',
    'Reglas de empaque',
    'Configuración',
    'Mantenimiento',
  ];

  /** Primer item de la ruta dentro del menú (lo que se resalta). */
  protected readonly itemMenu = computed(() => this.escena().ruta?.[1] ?? '');

  /** Tercer nivel de la ruta (submenú de Mantenimiento), si existe. */
  protected readonly itemSubmenu = computed(() => this.escena().ruta?.[2] ?? '');

  protected readonly submenuMantenimiento = [
    'Instalar o reparar (todo)',
    '1. Crear tablas',
    '2. Aplicar diseño',
    '3. Aplicar fórmulas',
    'Ajustar ancho de columnas',
  ];
}
