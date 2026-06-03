import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import { InsumoListado } from '../../negocio/catalogo/aplicacion/listar-insumos/listar-insumos';
import { MovimientoListado } from '../../negocio/inventario/aplicacion/listar-movimientos/listar-movimientos';
import { TipoAjuste } from '../../negocio/configuracion/dominio/configuracion-negocio';
import { Semaforo } from '../../negocio/catalogo/dominio/insumo/insumo';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

interface Previa {
  stockActual: number;
  stockResultante: number;
  semaforo: Semaforo;
}

/**
 * Pantalla de Inventario (Flujo 06): ajustes manuales + kardex.
 * El signo del ajuste lo decide el TIPO (configuración): por eso la
 * cantidad no lleva `min` en el schema — `conteo` admite negativos y es el
 * dominio (`cantidadFirmadaDeAjuste`) quien valida y rechaza el 0 o el tipo
 * desconocido; ese error llega como aviso. La VISTA PREVIA en vivo llama a
 * `previsualizarAjuste` (no persiste) y pinta el stock resultante con su
 * semáforo. La vista NO calcula: la previa y el kardex vienen ya resueltos.
 */
@Component({
  selector: 'app-pantalla-inventario',
  imports: [...UI_FORMULARIOS, FormField],
  templateUrl: './pantalla-inventario.html',
})
export class PantallaInventario {
  private readonly negocio = inject(Negocio);

  protected readonly insumos = signal<InsumoListado[]>([]);
  protected readonly tiposAjuste = signal<TipoAjuste[]>([]);
  protected readonly movimientos = signal<MovimientoListado[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  /** Vista previa en vivo (null = sin datos suficientes o tras un error). */
  protected readonly previa = signal<Previa | null>(null);

  /** Filtro del kardex: '' = todos. */
  protected readonly filtroInsumo = signal<string>('');

  protected readonly modelo = signal({ insumoId: '', tipo: '', cantidad: 0, motivo: '' });
  protected readonly formulario = form(this.modelo, campo => {
    required(campo.insumoId, { message: 'Elige un insumo.' });
    required(campo.tipo, { message: 'Elige un tipo de ajuste.' });
    // OJO: la cantidad NO lleva `min` — el signo lo da el tipo y `conteo`
    // admite negativos. El dominio valida (cantidad ≠ 0) y avisa.
    maxLength(campo.motivo, 200, { message: 'Máximo 200 caracteres.' });
  });

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    const [insumos, config] = await Promise.all([
      this.negocio.listarInsumos.ejecutar({}),
      this.negocio.obtenerConfiguracion.ejecutar(),
    ]);
    this.insumos.set(insumos);
    this.tiposAjuste.set([...config.tiposAjuste]);
    await this.recargarKardex();
    this.cargando.set(false);
  }

  protected async recargarKardex(): Promise<void> {
    const filtro = this.filtroInsumo();
    this.movimientos.set(
      await this.negocio.listarMovimientos.ejecutar(filtro ? { insumoId: filtro } : {}),
    );
  }

  protected cambiarFiltro(insumoId: string): void {
    this.filtroInsumo.set(insumoId);
    void this.recargarKardex();
  }

  /** Etiqueta del tipo según su signo (mapeo de presentación permitido). */
  protected etiquetaTipo(t: TipoAjuste): string {
    const sufijo = t.signo === -1 ? ' (resta)' : t.signo === 1 ? ' (suma)' : ' (con signo)';
    return t.nombre + sufijo;
  }

  /** Recalcula la vista previa cuando hay insumo + tipo + cantidad. */
  protected async actualizarPrevia(): Promise<void> {
    const m = this.modelo();
    if (!m.insumoId || !m.tipo || !m.cantidad) {
      this.previa.set(null);
      return;
    }
    try {
      const r = await this.negocio.previsualizarAjuste.ejecutar({
        insumoId: m.insumoId,
        tipo: m.tipo,
        cantidad: m.cantidad,
      });
      this.previa.set(r);
    } catch {
      // Tipo desconocido / cantidad 0: sin previa.
      this.previa.set(null);
    }
  }

  protected limpiar(): void {
    this.modelo.set({ insumoId: '', tipo: '', cantidad: 0, motivo: '' });
    this.formulario().reset();
    this.previa.set(null);
    this.aviso.set(null);
  }

  /** submit() marca todos los campos como touched y solo corre si es válido. */
  protected guardar(): void {
    void submit(this.formulario, async () => {
      this.guardando.set(true);
      this.aviso.set(null);
      try {
        const m = this.modelo();
        const r = await this.negocio.ajustarInventario.ejecutar({
          insumoId: m.insumoId,
          tipo: m.tipo,
          cantidad: m.cantidad,
          motivo: m.motivo || undefined,
        });
        this.aviso.set({ tipo: 'ok', texto: `Ajuste registrado: stock ${r.stockResultante}.` });
        this.limpiar();
        await this.cargar();
      } catch (error) {
        const texto = error instanceof ErrorDominio ? error.message : 'No se pudo registrar el ajuste.';
        this.aviso.set({ tipo: 'err', texto });
      } finally {
        this.guardando.set(false);
      }
    });
  }
}
