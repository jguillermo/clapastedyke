import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, max, min, required, submit, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import { ClientePrimitivos } from '../../negocio/catalogo/dominio/cliente/cliente';
import { RecetaPrimitivos } from '../../negocio/catalogo/dominio/receta/receta';
import { InsumoListado } from '../../negocio/catalogo/aplicacion/listar-insumos/listar-insumos';
import { ReglaEmpaquePrimitivos } from '../../negocio/catalogo/dominio/regla-empaque/regla-empaque';
import {
  FactorEscalado,
  TamanoNegocio,
} from '../../negocio/configuracion/dominio/configuracion-negocio';
import { ModoEscalado } from '../../negocio/ventas/dominio/presupuesto/calculadora-presupuesto';
import { CalculoPlano } from '../../negocio/ventas/aplicacion/calcular-presupuesto/calcular-presupuesto';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

interface ModeloCotizador {
  clienteId: string;
  recetaId: string;
  modoEscalado: ModoEscalado;
  valorEscalado: number;
  tamano: string;
  margen: number;
  aplicaIgv: boolean;
  notas: string;
}

interface FilaEmpaque {
  insumoId: string;
  cantidad: number;
}

/**
 * COTIZADOR: el formulario estrella. Signal Forms valida los campos del modelo
 * por campo; los empaques viven en una señal aparte (filas dinámicas con
 * inputs controlados sencillos) porque NO escalan y porque las precargamos
 * desde las reglas de empaque. La vista previa en vivo llama a
 * `calcularPresupuesto` (no persiste) y pinta el `CalculoPlano` tal cual: la
 * vista NO calcula ni formatea, usa solo los *Formato del DTO.
 */
@Component({
  selector: 'app-cotizador',
  imports: [...UI_FORMULARIOS, FormField],
  templateUrl: './cotizador.html',
})
export class Cotizador {
  private readonly negocio = inject(Negocio);
  private readonly router = inject(Router);

  protected readonly clientes = signal<ClientePrimitivos[]>([]);
  protected readonly recetas = signal<RecetaPrimitivos[]>([]);
  protected readonly empaquesCatalogo = signal<InsumoListado[]>([]);
  protected readonly tamanos = signal<TamanoNegocio[]>([]);
  protected readonly factores = signal<FactorEscalado[]>([]);
  private reglas: ReglaEmpaquePrimitivos[] = [];

  protected readonly empaques = signal<FilaEmpaque[]>([]);
  protected readonly calculo = signal<CalculoPlano | null>(null);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  protected readonly modelo = signal<ModeloCotizador>({
    clienteId: '',
    recetaId: '',
    modoEscalado: 'personas',
    valorEscalado: 0,
    tamano: '',
    margen: 0,
    aplicaIgv: false,
    notas: '',
  });

  protected readonly formulario = form(this.modelo, campo => {
    required(campo.clienteId, { message: 'Elige un cliente.' });
    required(campo.recetaId, { message: 'Elige una receta.' });
    // tamaño obligatorio solo en modo tamaño.
    required(campo.tamano, {
      when: ({ valueOf }) => valueOf(campo.modoEscalado) === 'tamano',
      message: 'Elige un tamaño.',
    });
    // valorEscalado > 0 cuando el modo NO es tamaño (en tamaño se ignora).
    validate(campo.valorEscalado, ({ value, valueOf }) => {
      if (valueOf(campo.modoEscalado) === 'tamano') return undefined;
      return value() > 0 ? undefined : { kind: 'min', message: 'Indica un valor mayor que 0.' };
    });
    min(campo.margen, 0, { message: 'El margen no puede ser negativo.' });
    max(campo.margen, 99, { message: 'El margen máximo es 99.' });
  });

  protected readonly esModoTamano = computed(() => this.modelo().modoEscalado === 'tamano');
  protected readonly esModoFactor = computed(() => this.modelo().modoEscalado === 'factor');

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    const [clientes, recetas, empaques, config] = await Promise.all([
      this.negocio.listarClientes.ejecutar(),
      this.negocio.listarRecetas.ejecutar(),
      this.negocio.listarInsumos.ejecutar({ tipo: 'empaque' }),
      this.negocio.obtenerConfiguracion.ejecutar(),
    ]);
    this.reglas = await this.negocio.listarReglasEmpaque.ejecutar();
    this.clientes.set(clientes);
    this.recetas.set(recetas);
    this.empaquesCatalogo.set(empaques);
    this.tamanos.set([...config.tamanos]);
    this.factores.set([...config.factores]);
    // Prellenar margen y IGV con la configuración del negocio.
    this.modelo.update(m => ({
      ...m,
      margen: config.generales.margenDefecto,
      aplicaIgv: config.generales.aplicarIgv,
    }));
    this.cargando.set(false);
  }

  protected etiquetaTamano(t: TamanoNegocio): string {
    return `${t.nombre} (×${t.factor})`;
  }

  /* ---------- Empaques (filas dinámicas, señal aparte) ---------- */

  protected agregarEmpaque(): void {
    this.empaques.update(e => [...e, { insumoId: '', cantidad: 0 }]);
  }

  protected quitarEmpaque(indice: number): void {
    this.empaques.update(e => e.filter((_, i) => i !== indice));
    void this.recalcular();
  }

  protected cambiarEmpaqueInsumo(indice: number, insumoId: string): void {
    this.empaques.update(e => e.map((f, i) => (i === indice ? { ...f, insumoId } : f)));
    void this.recalcular();
  }

  protected cambiarEmpaqueCantidad(indice: number, valor: string): void {
    const cantidad = Number(valor) || 0;
    this.empaques.update(e => e.map((f, i) => (i === indice ? { ...f, cantidad } : f)));
    void this.recalcular();
  }

  /** El factor llega como string del select; va al modelo como número. */
  protected cambiarFactor(valor: string): void {
    const valorEscalado = Number(valor) || 0;
    this.modelo.update(m => ({ ...m, valorEscalado }));
    void this.recalcular();
  }

  /** Cambió receta o tamaño: precargar empaques sugeridos de las reglas. */
  protected aplicarEmpaquesSugeridos(): void {
    const { recetaId, tamano, modoEscalado } = this.modelo();
    if (!recetaId || modoEscalado !== 'tamano' || !tamano) {
      void this.recalcular();
      return;
    }
    const sugeridos = this.reglas
      .filter(r => r.recetaId === recetaId && r.tamano === tamano)
      .map(r => ({ insumoId: r.insumoEmpaqueId, cantidad: r.cantidad }));
    this.empaques.set(sugeridos);
    void this.recalcular();
  }

  /* ---------- Vista previa en vivo ---------- */

  /** Recalcula contra el negocio; si lanza (datos incompletos), limpia. */
  protected async recalcular(): Promise<void> {
    const m = this.modelo();
    if (!m.clienteId || !m.recetaId) {
      this.calculo.set(null);
      return;
    }
    try {
      const r = await this.negocio.calcularPresupuesto.ejecutar({
        recetaId: m.recetaId,
        modoEscalado: m.modoEscalado,
        valorEscalado: m.valorEscalado,
        tamano: m.tamano,
        empaques: this.empaques().filter(e => e.insumoId && e.cantidad > 0),
        margen: m.margen,
        aplicaIgv: m.aplicaIgv,
      });
      this.calculo.set(r);
    } catch {
      this.calculo.set(null);
    }
  }

  protected volver(): void {
    void this.router.navigateByUrl('/sistema/presupuestos');
  }

  protected guardar(): void {
    void submit(this.formulario, async () => {
      this.guardando.set(true);
      this.aviso.set(null);
      try {
        const m = this.modelo();
        const r = await this.negocio.guardarPresupuesto.ejecutar({
          clienteId: m.clienteId,
          recetaId: m.recetaId,
          modoEscalado: m.modoEscalado,
          valorEscalado: m.valorEscalado,
          tamano: m.tamano,
          empaques: this.empaques().filter(e => e.insumoId && e.cantidad > 0),
          margen: m.margen,
          aplicaIgv: m.aplicaIgv,
          notas: m.notas,
        });
        const precio = this.calculo()?.precioFinalFormato ?? '';
        this.aviso.set({ tipo: 'ok', texto: `${r.id} guardado: ${precio}` });
        void this.router.navigateByUrl('/sistema/presupuestos');
      } catch (error) {
        const texto = error instanceof ErrorDominio ? error.message : 'No se pudo guardar.';
        this.aviso.set({ tipo: 'err', texto });
      } finally {
        this.guardando.set(false);
      }
    });
  }
}
