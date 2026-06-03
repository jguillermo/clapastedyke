import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { Negocio } from '../../composicion/negocio';
import { ErrorDominio } from '../../negocio/compartido/dominio/errores';
import { ClientePrimitivos } from '../../negocio/catalogo/dominio/cliente/cliente';
import { UI_FORMULARIOS } from '../../formularios/ui/ui';

/**
 * PRIMERA PANTALLA REAL del sistema: Clientes vivo contra IndexedDB.
 * Signal Forms (Angular 21) para la validación POR CAMPO en la UI;
 * las reglas de NEGOCIO (nombre único…) siguen en el dominio y llegan
 * como aviso si el caso de uso las rechaza.
 */
@Component({
  selector: 'app-pantalla-clientes',
  imports: [...UI_FORMULARIOS, FormField],
  templateUrl: './pantalla-clientes.html',
})
export class PantallaClientes {
  private readonly negocio = inject(Negocio);

  protected readonly clientes = signal<ClientePrimitivos[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly aviso = signal<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  protected readonly edicionId = signal<string | null>(null);

  // Modelo + formulario con validación por campo
  protected readonly modelo = signal({ nombre: '', telefono: '', notas: '' });
  protected readonly formulario = form(this.modelo, campo => {
    required(campo.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(campo.nombre, 80, { message: 'Máximo 80 caracteres.' });
    maxLength(campo.telefono, 40, { message: 'Máximo 40 caracteres.' });
    maxLength(campo.notas, 200, { message: 'Máximo 200 caracteres.' });
  });

  constructor() {
    void this.recargar();
  }

  protected async recargar(): Promise<void> {
    this.cargando.set(true);
    this.clientes.set(await this.negocio.listarClientes.ejecutar());
    this.cargando.set(false);
  }

  protected editar(cliente: ClientePrimitivos): void {
    this.edicionId.set(cliente.id);
    this.modelo.set({ nombre: cliente.nombre, telefono: cliente.telefono, notas: cliente.notas });
    this.formulario().reset();
    this.aviso.set(null);
  }

  protected limpiar(): void {
    this.edicionId.set(null);
    this.modelo.set({ nombre: '', telefono: '', notas: '' });
    this.formulario().reset();
    this.aviso.set(null);
  }

  /** submit() marca todos los campos como touched y solo corre si es válido. */
  protected guardar(): void {
    void submit(this.formulario, async () => {
      this.guardando.set(true);
      this.aviso.set(null);
      try {
        const r = await this.negocio.guardarCliente.ejecutar({
          id: this.edicionId() ?? undefined,
          ...this.modelo(),
        });
        this.aviso.set({ tipo: 'ok', texto: `Cliente ${r.id} guardado.` });
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
