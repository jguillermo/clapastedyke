import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, pattern, required, submit } from '@angular/forms/signals';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import { ProveedorPrimitivos } from '../../negocio/catalogo/dominio/proveedor/proveedor';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

/**
 * Pantalla real de Proveedores, viva contra IndexedDB. Mismo patrón canónico
 * que Clientes: Signal Forms (Angular 21) para validación POR CAMPO en la UI;
 * las reglas de NEGOCIO (nombre único…) siguen en el dominio y llegan como
 * aviso si el caso de uso las rechaza.
 */
@Component({
  selector: 'app-pantalla-proveedores',
  imports: [...UI_FORMULARIOS, FormField],
  templateUrl: './pantalla-proveedores.html',
})
export class PantallaProveedores {
  private readonly negocio = inject(Negocio);

  protected readonly proveedores = signal<ProveedorPrimitivos[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  protected readonly edicionId = signal<string | null>(null);

  // Modelo + formulario con validación por campo
  protected readonly modelo = signal({ nombre: '', whatsapp: '', notas: '' });
  protected readonly formulario = form(this.modelo, campo => {
    required(campo.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(campo.nombre, 80, { message: 'Máximo 80 caracteres.' });
    required(campo.whatsapp, { message: 'El WhatsApp es obligatorio.' });
    pattern(campo.whatsapp, /^[+\d][\d\s()-]{7,}$/, {
      message: 'WhatsApp con código de país, mínimo 8 dígitos.',
    });
    maxLength(campo.whatsapp, 20, { message: 'Máximo 20 caracteres.' });
    maxLength(campo.notas, 200, { message: 'Máximo 200 caracteres.' });
  });

  constructor() {
    void this.recargar();
  }

  protected async recargar(): Promise<void> {
    this.cargando.set(true);
    this.proveedores.set(await this.negocio.listarProveedores.ejecutar());
    this.cargando.set(false);
  }

  /** Solo dígitos para armar el enlace https://wa.me/<número>. */
  protected soloDigitos(whatsapp: string): string {
    return whatsapp.replace(/\D/g, '');
  }

  protected editar(proveedor: ProveedorPrimitivos): void {
    this.edicionId.set(proveedor.id);
    this.modelo.set({ nombre: proveedor.nombre, whatsapp: proveedor.whatsapp, notas: proveedor.notas });
    this.formulario().reset();
    this.aviso.set(null);
  }

  protected limpiar(): void {
    this.edicionId.set(null);
    this.modelo.set({ nombre: '', whatsapp: '', notas: '' });
    this.formulario().reset();
    this.aviso.set(null);
  }

  /** submit() marca todos los campos como touched y solo corre si es válido. */
  protected guardar(): void {
    void submit(this.formulario, async () => {
      this.guardando.set(true);
      this.aviso.set(null);
      try {
        const r = await this.negocio.guardarProveedor.ejecutar({
          id: this.edicionId() ?? undefined,
          ...this.modelo(),
        });
        this.aviso.set({ tipo: 'ok', texto: `Proveedor ${r.id} guardado.` });
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
