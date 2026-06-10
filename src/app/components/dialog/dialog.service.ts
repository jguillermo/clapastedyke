import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { inject, Injectable } from '@angular/core';

/** Config de un diálogo Migo. Es la `DialogConfig` de CDK (data, ariaLabel, width, etc.). */
export type MigoDialogConfig<D = unknown, R = unknown, C = unknown> = DialogConfig<
  D,
  DialogRef<R, C>
>;

/**
 * Servicio de diálogos del design system. Abre un **componente** dentro de un overlay
 * estilado Migo. El componente abierto **es** el diálogo: inyecta `MigoDialogRef` para
 * cerrarse (`ref.close(resultado)`) y `MIGO_DIALOG_DATA` para recibir datos.
 *
 * Comportamiento (overlay centrado, backdrop, focus-trap + restauración de foco, ESC,
 * bloqueo de scroll) lo aporta `@angular/cdk/dialog`. El estilo de la tarjeta y el backdrop
 * son globales (`src/styles.css`, clases `migo-dialog__panel` / `migo-dialog__backdrop`).
 * Sin lógica de negocio.
 *
 * ```ts
 * const ref = migoDialog.open<boolean>(ConfirmDialog, { data: { message }, ariaLabel: 'Confirmar' });
 * ref.closed.subscribe((result) => { ... });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MigoDialog {
  private readonly cdkDialog = inject(Dialog);

  open<R = unknown, D = unknown, C = unknown>(
    component: ComponentType<C>,
    config: MigoDialogConfig<D, R, C> = {},
  ): DialogRef<R, C> {
    const panelClass = ['migo-dialog__panel', ...[config.panelClass ?? []].flat()];
    const backdropClass = ['migo-dialog__backdrop', ...[config.backdropClass ?? []].flat()];
    return this.cdkDialog.open<R, D, C>(component, { ...config, panelClass, backdropClass });
  }
}

// Re-exports con nombre de marca (misma clase / mismo token de CDK).
export { DialogRef as MigoDialogRef } from '@angular/cdk/dialog';
export { DIALOG_DATA as MIGO_DIALOG_DATA } from '@angular/cdk/dialog';
