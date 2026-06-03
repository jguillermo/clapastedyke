import { Component, inject, signal } from '@angular/core';
import { FormField, disabled, form, maxLength, min, required, submit } from '@angular/forms/signals';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import { ProveedorPrimitivos } from '../../negocio/catalogo/dominio/proveedor/proveedor';
import { TipoInsumo } from '../../negocio/catalogo/dominio/insumo/insumo';
import { UnidadBase } from '../../negocio/compartido/dominio/cantidad';
import { InsumoListado } from '../../negocio/catalogo/aplicacion/listar-insumos/listar-insumos';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

/**
 * Pantalla de Insumos: ingredientes y empaques vivos contra IndexedDB.
 * La más rica del catálogo (selects, números, derivados). Signal Forms
 * para la validación POR CAMPO; las reglas de NEGOCIO (nombre único…)
 * llegan como aviso si el caso de uso las rechaza. En EDICIÓN, tipo y
 * unidad base quedan deshabilitados (definen la naturaleza del insumo) y
 * el stock inicial se oculta (el stock vivo se mueve por inventario).
 */
@Component({
  selector: 'app-pantalla-insumos',
  imports: [...UI_FORMULARIOS, FormField],
  templateUrl: './pantalla-insumos.html',
})
export class PantallaInsumos {
  private readonly negocio = inject(Negocio);

  protected readonly insumos = signal<InsumoListado[]>([]);
  protected readonly proveedores = signal<ProveedorPrimitivos[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // edicionId DEBE declararse antes del formulario: el schema lo lee en disabled().
  protected readonly edicionId = signal<string | null>(null);

  protected readonly modelo = signal({
    nombre: '',
    tipo: 'ingrediente' as TipoInsumo,
    unidadBase: 'g' as UnidadBase,
    tamanoPresentacion: 0,
    precioPresentacionSoles: 0,
    stockInicial: 0,
    stockMinimo: 0,
    proveedorRecomendadoId: '',
  });

  protected readonly formulario = form(this.modelo, campo => {
    required(campo.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(campo.nombre, 80, { message: 'Máximo 80 caracteres.' });
    min(campo.tamanoPresentacion, 0.0001, { message: 'Debe ser mayor que 0.' });
    min(campo.precioPresentacionSoles, 0.01, { message: 'Debe ser mayor que 0.' });
    min(campo.stockInicial, 0, { message: 'No puede ser negativo.' });
    min(campo.stockMinimo, 0, { message: 'No puede ser negativo.' });
    // En edición la naturaleza del insumo no cambia.
    disabled(campo.tipo, () => this.edicionId() !== null);
    disabled(campo.unidadBase, () => this.edicionId() !== null);
  });

  constructor() {
    void this.recargar();
    void this.cargarProveedores();
  }

  private async cargarProveedores(): Promise<void> {
    this.proveedores.set(await this.negocio.listarProveedores.ejecutar());
  }

  protected async recargar(): Promise<void> {
    this.cargando.set(true);
    this.insumos.set(await this.negocio.listarInsumos.ejecutar({}));
    this.cargando.set(false);
  }

  protected editar(insumo: InsumoListado): void {
    this.edicionId.set(insumo.id);
    this.modelo.set({
      nombre: insumo.nombre,
      tipo: insumo.tipo,
      unidadBase: insumo.unidadBase,
      tamanoPresentacion: insumo.tamanoPresentacion,
      precioPresentacionSoles: insumo.precioPresentacionSoles,
      stockInicial: 0,
      stockMinimo: insumo.stockMinimo,
      proveedorRecomendadoId: insumo.proveedorRecomendadoId ?? '',
    });
    this.formulario().reset();
    this.aviso.set(null);
  }

  protected limpiar(): void {
    this.edicionId.set(null);
    this.modelo.set({
      nombre: '',
      tipo: 'ingrediente',
      unidadBase: 'g',
      tamanoPresentacion: 0,
      precioPresentacionSoles: 0,
      stockInicial: 0,
      stockMinimo: 0,
      proveedorRecomendadoId: '',
    });
    this.formulario().reset();
    this.aviso.set(null);
  }

  /** submit() marca todos los campos como touched y solo corre si es válido. */
  protected guardar(): void {
    void submit(this.formulario, async () => {
      this.guardando.set(true);
      this.aviso.set(null);
      try {
        const m = this.modelo();
        const editando = this.edicionId() !== null;
        const r = await this.negocio.guardarInsumo.ejecutar({
          id: this.edicionId() ?? undefined,
          nombre: m.nombre,
          tipo: m.tipo,
          unidadBase: m.unidadBase,
          tamanoPresentacion: m.tamanoPresentacion,
          precioPresentacionSoles: m.precioPresentacionSoles,
          // El stock vivo se mueve por inventario: en edición NO se manda.
          ...(editando ? {} : { stockInicial: m.stockInicial }),
          stockMinimo: m.stockMinimo,
          proveedorRecomendadoId: m.proveedorRecomendadoId || undefined,
        });
        this.aviso.set({ tipo: 'ok', texto: `Insumo ${r.id} guardado.` });
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
