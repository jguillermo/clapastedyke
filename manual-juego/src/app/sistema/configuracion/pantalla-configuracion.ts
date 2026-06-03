import { Component, inject, signal } from '@angular/core';
import { FormField, applyEach, form, max, min, required, submit } from '@angular/forms/signals';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import {
  MomentoDescuentoStock,
  Redondeo,
} from '../../negocio/configuracion/dominio/configuracion-negocio';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

interface ModeloConfig {
  tarifaManoObraHora: number;
  costoIndirectoPedido: number;
  depreciacionPedido: number;
  margenDefecto: number;
  aplicarIgv: boolean;
  tasaIgv: number;
  redondeo: Redondeo;
  diasVencimiento: number;
  momentoDescuentoStock: MomentoDescuentoStock;
  nombreNegocio: string;
  tamanos: { nombre: string; factor: number }[];
}

/**
 * Pantalla de Configuración (Flujo 13): los parámetros con los que se arma el
 * precio y la lista de tamaños vendibles. Filas dinámicas de tamaños con
 * applyEach (mismo patrón que los ingredientes de Recetas). Validación POR
 * CAMPO en Signal Forms; las reglas de NEGOCIO duras (margen [0,100), etc.)
 * las refuerza el dominio y llegan como aviso. Los presupuestos guardados
 * están congelados: estos cambios solo afectan a los nuevos.
 */
@Component({
  selector: 'app-pantalla-configuracion',
  imports: [...UI_FORMULARIOS, FormField],
  templateUrl: './pantalla-configuracion.html',
})
export class PantallaConfiguracion {
  private readonly negocio = inject(Negocio);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  protected readonly modelo = signal<ModeloConfig>({
    tarifaManoObraHora: 0,
    costoIndirectoPedido: 0,
    depreciacionPedido: 0,
    margenDefecto: 0,
    aplicarIgv: false,
    tasaIgv: 0,
    redondeo: 'MULTIPLO_5',
    diasVencimiento: 0,
    momentoDescuentoStock: 'APROBAR',
    nombreNegocio: '',
    tamanos: [],
  });

  protected readonly formulario = form(this.modelo, campo => {
    min(campo.tarifaManoObraHora, 0, { message: 'No puede ser negativa.' });
    min(campo.costoIndirectoPedido, 0, { message: 'No puede ser negativo.' });
    min(campo.depreciacionPedido, 0, { message: 'No puede ser negativa.' });
    min(campo.margenDefecto, 0, { message: 'No puede ser negativo.' });
    max(campo.margenDefecto, 99, { message: 'Máximo 99.' });
    min(campo.tasaIgv, 0, { message: 'No puede ser negativa.' });
    max(campo.tasaIgv, 99, { message: 'Máximo 99.' });
    min(campo.diasVencimiento, 1, { message: 'Mínimo 1 día.' });
    required(campo.nombreNegocio, { message: 'El nombre del negocio es obligatorio.' });
    applyEach(campo.tamanos, t => {
      required(t.nombre, { message: 'Nombre del tamaño.' });
      min(t.factor, 0.0001, { message: 'Mayor que 0.' });
    });
  });

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    const config = await this.negocio.obtenerConfiguracion.ejecutar();
    const g = config.generales;
    this.modelo.set({
      tarifaManoObraHora: g.tarifaManoObraHora,
      costoIndirectoPedido: g.costoIndirectoPedido,
      depreciacionPedido: g.depreciacionPedido,
      margenDefecto: g.margenDefecto,
      aplicarIgv: g.aplicarIgv,
      tasaIgv: g.tasaIgv,
      redondeo: g.redondeo,
      diasVencimiento: g.diasVencimiento,
      momentoDescuentoStock: g.momentoDescuentoStock,
      nombreNegocio: g.nombreNegocio,
      tamanos: config.tamanos.map(t => ({ nombre: t.nombre, factor: t.factor })),
    });
    this.formulario().reset();
    this.cargando.set(false);
  }

  protected agregarTamano(): void {
    this.modelo.update(m => ({ ...m, tamanos: [...m.tamanos, { nombre: '', factor: 1 }] }));
  }

  protected quitarTamano(indice: number): void {
    this.modelo.update(m => ({ ...m, tamanos: m.tamanos.filter((_, i) => i !== indice) }));
  }

  /** submit() marca todos los campos como touched y solo corre si es válido. */
  protected guardar(): void {
    void submit(this.formulario, async () => {
      this.guardando.set(true);
      this.aviso.set(null);
      try {
        const m = this.modelo();
        await this.negocio.actualizarConfiguracion.ejecutar({
          generales: {
            tarifaManoObraHora: m.tarifaManoObraHora,
            costoIndirectoPedido: m.costoIndirectoPedido,
            depreciacionPedido: m.depreciacionPedido,
            margenDefecto: m.margenDefecto,
            aplicarIgv: m.aplicarIgv,
            tasaIgv: m.tasaIgv,
            redondeo: m.redondeo,
            diasVencimiento: m.diasVencimiento,
            momentoDescuentoStock: m.momentoDescuentoStock,
            nombreNegocio: m.nombreNegocio,
          },
          tamanos: m.tamanos,
        });
        this.aviso.set({
          tipo: 'ok',
          texto: 'Configuración guardada. Afecta solo a presupuestos nuevos.',
        });
        await this.cargar();
      } catch (error) {
        const texto = error instanceof ErrorDominio ? error.message : 'No se pudo guardar.';
        this.aviso.set({ tipo: 'err', texto });
      } finally {
        this.guardando.set(false);
      }
    });
  }
}
