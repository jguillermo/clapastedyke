import { Component, inject, signal } from '@angular/core';
import { FormField, applyEach, form, maxLength, min, required, submit } from '@angular/forms/signals';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import { RecetaPrimitivos, TipoBase } from '../../negocio/catalogo/dominio/receta/receta';
import { InsumoListado } from '../../negocio/catalogo/aplicacion/listar-insumos/listar-insumos';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

interface ModeloReceta {
  nombre: string;
  categoria: string;
  tipoBase: TipoBase;
  racionesBase: number;
  tiempoManoObraHoras: number;
  ingredientes: { insumoId: string; cantidadBase: number }[];
}

/**
 * Pantalla de Recetas: ÚNICA con FILAS DINÁMICAS (ingredientes). Usa el array
 * del modelo con `applyEach` de Signal Forms para validar cada línea por campo;
 * las reglas de NEGOCIO (nombre único, ≥1 ingrediente, insumo de tipo
 * ingrediente…) siguen en el dominio y llegan como aviso si el caso de uso
 * las rechaza. Mismo patrón canónico que Clientes.
 */
@Component({
  selector: 'app-pantalla-recetas',
  imports: [...UI_FORMULARIOS, FormField],
  templateUrl: './pantalla-recetas.html',
})
export class PantallaRecetas {
  private readonly negocio = inject(Negocio);

  protected readonly recetas = signal<RecetaPrimitivos[]>([]);
  protected readonly insumos = signal<InsumoListado[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  protected readonly edicionId = signal<string | null>(null);

  // Modelo + formulario con validación por campo. El array de ingredientes es
  // la parte dinámica: applyEach valida cada fila.
  protected readonly modelo = signal<ModeloReceta>({
    nombre: '',
    categoria: '',
    tipoBase: 'personas',
    racionesBase: 0,
    tiempoManoObraHoras: 0,
    ingredientes: [],
  });
  protected readonly formulario = form(this.modelo, campo => {
    required(campo.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(campo.nombre, 80, { message: 'Máximo 80 caracteres.' });
    min(campo.racionesBase, 0.0001, { message: 'La base debe ser mayor que 0.' });
    min(campo.tiempoManoObraHoras, 0, { message: 'No puede ser negativo.' });
    applyEach(campo.ingredientes, ing => {
      required(ing.insumoId, { message: 'Elige un insumo.' });
      min(ing.cantidadBase, 0.0001, { message: 'Cantidad mayor que 0.' });
    });
  });

  constructor() {
    void this.recargar();
    void this.cargarInsumos();
  }

  protected async recargar(): Promise<void> {
    this.cargando.set(true);
    this.recetas.set(await this.negocio.listarRecetas.ejecutar());
    this.cargando.set(false);
  }

  private async cargarInsumos(): Promise<void> {
    this.insumos.set(await this.negocio.listarInsumos.ejecutar({ tipo: 'ingrediente' }));
  }

  protected agregarIngrediente(): void {
    this.modelo.update(m => ({
      ...m,
      ingredientes: [...m.ingredientes, { insumoId: '', cantidadBase: 0 }],
    }));
  }

  protected quitarIngrediente(indice: number): void {
    this.modelo.update(m => ({
      ...m,
      ingredientes: m.ingredientes.filter((_, i) => i !== indice),
    }));
  }

  protected editar(receta: RecetaPrimitivos): void {
    this.edicionId.set(receta.id);
    this.modelo.set({
      nombre: receta.nombre,
      categoria: receta.categoria,
      tipoBase: receta.tipoBase,
      racionesBase: receta.racionesBase,
      tiempoManoObraHoras: receta.tiempoManoObraHoras,
      ingredientes: receta.ingredientes.map(i => ({ insumoId: i.insumoId, cantidadBase: i.cantidadBase })),
    });
    this.formulario().reset();
    this.aviso.set(null);
  }

  protected limpiar(): void {
    this.edicionId.set(null);
    this.modelo.set({
      nombre: '',
      categoria: '',
      tipoBase: 'personas',
      racionesBase: 0,
      tiempoManoObraHoras: 0,
      ingredientes: [],
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
        const r = await this.negocio.guardarReceta.ejecutar({
          id: this.edicionId() ?? undefined,
          ...this.modelo(),
        });
        this.aviso.set({ tipo: 'ok', texto: `Receta ${r.id} guardada.` });
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
