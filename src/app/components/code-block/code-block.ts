import { Clipboard } from '@angular/cdk/clipboard';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '@components/button/button';
import { Icon } from '@components/icon/icon';

/** Cuánto se queda la confirmación antes de volver al estado normal. */
const FEEDBACK_MS = 2400;

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Un bloque de texto largo que el usuario tiene que **llevarse entero a otro sitio**: el código de un
 * script, un manifiesto, una configuración que pegar en la consola de otro servicio.
 *
 * Es el hermano largo de `migo-copy-field`: aquel es un `<input>` de una línea para un valor suelto;
 * este es un `<pre>` con scroll para cientos de líneas, y **su razón de ser es el botón de copiar** —
 * nadie va a seleccionar 900 líneas a mano en un móvil.
 *
 * ## Decisiones que no son obvias
 *
 * **1. Plegado por defecto.** Un script entero empuja el resto de la página fuera de la pantalla y
 * convierte una guía de doce pasos en un scroll infinito. Se enseña una ventana (`collapsed`) y se
 * despliega si alguien quiere leerlo; el botón de copiar funciona igual esté como esté, porque copiar
 * no requiere haber leído.
 *
 * **2. El `<pre>` es enfocable y tiene rol de región.** Un bloque con scroll propio al que no se llega
 * con el teclado es una trampa (WCAG 2.1.1): sin `tabindex="0"` no hay forma de desplazarlo sin ratón.
 *
 * **3. El nombre accesible del botón NO cambia al copiar** — mismo motivo que en `migo-copy-field`:
 * cambiar el nombre de un elemento enfocado se anuncia de forma inconsistente. Cambia el icono, y la
 * confirmación va en una región viva aparte.
 *
 * El design system **no registra**: quien quiera traza la pone desde la feature escuchando `copied`.
 *
 * Uso: `<migo-code-block label="Code.gs" [code]="script()" />`
 */
@Component({
  selector: 'migo-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 items-baseline gap-2">
        @if (label(); as name) {
          <span class="truncate font-body text-sm font-semibold text-heading">{{ name }}</span>
        }
        @if (code()) {
          <span class="shrink-0 font-body text-caption text-muted">{{ lineLabel() }}</span>
        }
      </div>

      <div class="flex flex-wrap items-center gap-2">
        @if (expandable()) {
          <button migo-button type="button" variant="ghost" size="sm" (click)="toggle()">
            <migo-icon
              icon-leading
              size="sm"
              [name]="expanded() ? 'mat:expand_less' : 'mat:expand_more'"
            />
            {{ expanded() ? 'Plegar' : 'Ver entero' }}
          </button>
        }
        <button
          migo-button
          type="button"
          variant="secondary"
          size="sm"
          [disabled]="!code()"
          (click)="copy()"
        >
          <migo-icon
            icon-leading
            size="sm"
            [name]="state() === 'copied' ? 'mat:check' : 'mat:content_copy'"
            [color]="state() === 'copied' ? 'success' : 'current'"
          />
          {{ copyLabel() }}
        </button>
      </div>
    </div>

    @if (code(); as text) {
      <pre
        class="m-0 overflow-auto rounded-lg border border-border-subtle bg-surface-sunken p-4 font-mono text-caption text-body focus-visible:shadow-focus focus-visible:outline-none"
        tabindex="0"
        role="region"
        [class.max-h-64]="!expanded()"
        [attr.aria-label]="regionLabel()"
      ><code>{{ text }}</code></pre>
    } @else {
      <p class="m-0 font-body text-sm text-muted">{{ emptyLabel() }}</p>
    }

    <!-- La confirmación vive aquí, y no en el nombre del botón, para que se anuncie una sola vez. -->
    <span class="sr-only" role="status">
      @switch (state()) {
        @case ('copied') {
          Copiado al portapapeles
        }
        @case ('failed') {
          No se ha podido copiar. Selecciona el texto y cópialo a mano.
        }
      }
    </span>
  `,
  host: { class: 'flex w-full flex-col gap-2' },
})
export class CodeBlock {
  /** El texto íntegro. Vacío = no se pudo obtener; se pinta `emptyLabel` en su lugar. */
  readonly code = input.required<string>();

  /** Nombre del fichero o del bloque. Es también el nombre accesible de la región con scroll. */
  readonly label = input('');

  /** Rótulo del botón. Constante a propósito: no cambia al copiar. */
  readonly copyLabel = input('Copiar');

  /** Qué se dice cuando no hay nada que enseñar. */
  readonly emptyLabel = input('No se ha podido cargar el contenido.');

  /** Empieza desplegado, sin ventana de altura. Para bloques de tres líneas. */
  readonly open = input(false, { transform: booleanAttribute });

  /** Se emite con el texto copiado. El DS no registra; la feature sí puede. */
  readonly copied = output<string>();

  protected readonly state = signal<CopyState>('idle');

  private readonly clipboard = inject(Clipboard);
  private readonly unfolded = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly expanded = computed(() => this.open() || this.unfolded());

  /** Solo tiene sentido ofrecer «Ver entero» si hay más de lo que cabe en la ventana. */
  protected readonly expandable = computed(() => !this.open() && this.lines() > 12);

  protected readonly lineLabel = computed(() => {
    const total = this.lines();
    return total === 1 ? '1 línea' : `${total} líneas`;
  });

  protected readonly regionLabel = computed(() => this.label() || 'Bloque de código');

  private readonly lines = computed(() => this.code().split('\n').length);

  constructor() {
    // El temporizador sobreviviría al componente y escribiría en un signal ya destruido.
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  protected toggle(): void {
    this.unfolded.update((open) => !open);
  }

  protected copy(): void {
    const ok = this.clipboard.copy(this.code());
    this.state.set(ok ? 'copied' : 'failed');
    if (ok) {
      this.copied.emit(this.code());
    }
    this.clearTimer();
    this.timer = setTimeout(() => this.state.set('idle'), FEEDBACK_MS);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
