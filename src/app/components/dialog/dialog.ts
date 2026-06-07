import { A11yModule } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';

let nextDialogId = 0;

/**
 * Diálogo modal presentacional. Declarativo: se controla con `[open]` y emite `(closed)`.
 * El comportamiento (overlay, backdrop, scroll-lock, focus-trap, ESC) lo aporta Angular CDK;
 * el estilo, los tokens Migo. Sin lógica de negocio.
 *
 * El panel vive en un `<ng-template>` dentro del componente, por lo que la encapsulación
 * emulada sigue aplicando los estilos scoped aunque se renderice en el contenedor del overlay.
 *
 * Uso:
 * ```html
 * <app-dialog [open]="open()" title="Confirmar" (closed)="open.set(false)">
 *   <p>¿Seguro?</p>
 *   <button app-button dialog-footer variant="ghost" (click)="open.set(false)">Cancelar</button>
 *   <button app-button dialog-footer (click)="open.set(false)">Aceptar</button>
 * </app-dialog>
 *
 * Las acciones del pie se marcan con el atributo `dialog-footer` en cada elemento (no en un
 * envoltorio): así son hijos directos del footer y el diálogo controla su separación (gap).
 * ```
 */
@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule],
  template: `
    <ng-template #panel>
      <div
        class="app-dialog__panel"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="title() ? titleId : null"
        cdkTrapFocus
        cdkTrapFocusAutoCapture
      >
        <header class="app-dialog__header">
          @if (title()) {
            <h2 class="app-dialog__title" [id]="titleId">{{ title() }}</h2>
          }
          <ng-content select="[dialog-header]" />
          @if (dismissable()) {
            <button
              type="button"
              class="app-dialog__close"
              aria-label="Cerrar"
              (click)="requestClose()"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          }
        </header>

        <div class="app-dialog__body">
          <ng-content />
        </div>

        <footer class="app-dialog__footer">
          <ng-content select="[dialog-footer]" />
        </footer>
      </div>
    </ng-template>
  `,
  styleUrl: './dialog.css',
})
export class Dialog implements OnDestroy {
  readonly open = input(false, { transform: booleanAttribute });
  readonly title = input('');
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  readonly dismissable = input(true, { transform: booleanAttribute });

  readonly closed = output<void>();

  protected readonly titleId = `app-dialog-${nextDialogId++}-title`;

  private readonly panelTemplate = viewChild<TemplateRef<unknown>>('panel');
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);

  private overlayRef?: OverlayRef;
  private overlaySubscriptions?: Subscription;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.attach();
      } else {
        this.detach();
      }
    });
  }

  ngOnDestroy(): void {
    this.detach();
  }

  protected requestClose(): void {
    this.closed.emit();
  }

  private attach(): void {
    const template = this.panelTemplate();
    if (!template || this.overlayRef) {
      return;
    }

    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'app-dialog__backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    });

    this.overlayRef.attach(new TemplatePortal(template, this.viewContainerRef));

    this.overlaySubscriptions = new Subscription();
    this.overlaySubscriptions.add(
      this.overlayRef.backdropClick().subscribe(() => {
        if (this.closeOnBackdrop()) {
          this.requestClose();
        }
      }),
    );
    this.overlaySubscriptions.add(
      this.overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape' && this.dismissable()) {
          event.preventDefault();
          this.requestClose();
        }
      }),
    );
  }

  private detach(): void {
    if (!this.overlayRef) {
      return;
    }
    this.overlaySubscriptions?.unsubscribe();
    this.overlaySubscriptions = undefined;
    this.overlayRef.detach();
    this.overlayRef.dispose();
    this.overlayRef = undefined;
  }
}
