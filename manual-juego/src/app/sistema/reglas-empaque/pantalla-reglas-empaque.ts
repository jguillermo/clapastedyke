import { Component, computed, inject, signal } from '@angular/core';
import { FormField, disabled, form, min, required, submit } from '@angular/forms/signals';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import { ReglaEmpaquePrimitivos } from '../../negocio/catalogo/dominio/regla-empaque/regla-empaque';
import { RecetaPrimitivos } from '../../negocio/catalogo/dominio/receta/receta';
import { InsumoListado } from '../../negocio/catalogo/aplicacion/listar-insumos/listar-insumos';
import { TamanoNegocio } from '../../negocio/configuracion/dominio/configuracion-negocio';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

/**
 * Reglas de empaque vivas contra IndexedDB. Signal Forms para la validación
 * por campo; la unicidad de la terna (receta, tamaño, empaque) y el resto de
 * reglas de negocio viven en el dominio y llegan como aviso si el caso de uso
 * las rechaza. En EDICIÓN solo se permiten cambiar empaque y cantidad: receta
 * y tamaño quedan deshabilitados vía el schema del formulario.
 */
@Component({
  selector: 'app-pantalla-reglas-empaque',
  imports: [...UI_FORMULARIOS, FormField],
  templateUrl: './pantalla-reglas-empaque.html',
})
export class PantallaReglasEmpaque {
  private readonly negocio = inject(Negocio);

  protected readonly reglas = signal<ReglaEmpaquePrimitivos[]>([]);
  protected readonly recetas = signal<RecetaPrimitivos[]>([]);
  protected readonly tamanos = signal<TamanoNegocio[]>([]);
  protected readonly empaques = signal<InsumoListado[]>([]);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  protected readonly edicionId = signal<string | null>(null);

  // Mapas id→nombre para resolver los nombres en la tabla.
  protected readonly nombreReceta = computed(() => {
    const m = new Map<string, string>();
    for (const r of this.recetas()) m.set(r.id, r.nombre);
    return m;
  });
  protected readonly nombreEmpaque = computed(() => {
    const m = new Map<string, string>();
    for (const e of this.empaques()) m.set(e.id, e.nombre);
    return m;
  });

  // Modelo + formulario con validación por campo.
  protected readonly modelo = signal({
    recetaId: '',
    tamano: '',
    insumoEmpaqueId: '',
    cantidad: 0,
  });
  protected readonly formulario = form(this.modelo, campo => {
    required(campo.recetaId, { message: 'Elige una receta.' });
    required(campo.tamano, { message: 'Elige un tamaño.' });
    required(campo.insumoEmpaqueId, { message: 'Elige un empaque.' });
    min(campo.cantidad, 0.0001, { message: 'Cantidad mayor que 0.' });
    // En edición el dominio solo permite cambiar empaque/cantidad.
    disabled(campo.recetaId, () => this.edicionId() !== null);
    disabled(campo.tamano, () => this.edicionId() !== null);
  });

  constructor() {
    void this.cargarCatalogos();
    void this.recargar();
  }

  private async cargarCatalogos(): Promise<void> {
    this.recetas.set(await this.negocio.listarRecetas.ejecutar());
    this.empaques.set(await this.negocio.listarInsumos.ejecutar({ tipo: 'empaque' }));
    const config = await this.negocio.obtenerConfiguracion.ejecutar();
    this.tamanos.set([...config.tamanos]);
  }

  protected async recargar(): Promise<void> {
    this.cargando.set(true);
    this.reglas.set(await this.negocio.listarReglasEmpaque.ejecutar());
    this.cargando.set(false);
  }

  protected etiquetaTamano(t: TamanoNegocio): string {
    return `${t.nombre} (×${t.factor})`;
  }

  protected editar(regla: ReglaEmpaquePrimitivos): void {
    this.edicionId.set(regla.id);
    this.modelo.set({
      recetaId: regla.recetaId,
      tamano: regla.tamano,
      insumoEmpaqueId: regla.insumoEmpaqueId,
      cantidad: regla.cantidad,
    });
    this.formulario().reset();
    this.aviso.set(null);
  }

  protected limpiar(): void {
    this.edicionId.set(null);
    this.modelo.set({ recetaId: '', tamano: '', insumoEmpaqueId: '', cantidad: 0 });
    this.formulario().reset();
    this.aviso.set(null);
  }

  /** submit() marca todos los campos como touched y solo corre si es válido. */
  protected guardar(): void {
    void submit(this.formulario, async () => {
      this.guardando.set(true);
      this.aviso.set(null);
      try {
        const r = await this.negocio.guardarReglaEmpaque.ejecutar({
          id: this.edicionId() ?? undefined,
          ...this.modelo(),
        });
        this.aviso.set({ tipo: 'ok', texto: `Regla ${r.id} guardada.` });
        this.limpiar();
        await this.recargar();
      } catch (error) {
        const texto = error instanceof ErrorDominio ? error.message : 'No se pudo guardar.';
        this.aviso.set({ tipo: 'err', texto });
      } finally {
        this.guardando.set(false);
      }
    });
  }
}
