import { Clipboard } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '@components/button/button';
import { FormField } from '@components/form-field/form-field';
import { Icon } from '@components/icon/icon';

/** Cuánto se queda la confirmación antes de volver al estado normal. */
const FEEDBACK_MS = 2400;

let nextId = 0;

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Un valor de solo lectura que el usuario tiene que llevarse a otro sitio: una URL que pegar en otra
 * pestaña, un identificador que teclear en una consola.
 *
 * **No es un control de formulario** (no edita nada), así que no implementa `ControlValueAccessor`.
 * Sí se engancha a un `migo-form-field` por DI opcional para heredar su `id` y su `aria-describedby`.
 *
 * ## Tres decisiones que no son obvias
 *
 * **1. Se copia con el `Clipboard` del CDK, no con `navigator.clipboard`.** El del CDK es síncrono y
 * devuelve un `boolean`, así que hay una rama de fallo de verdad que pintar; `writeText()` devuelve
 * una promesa que en algunos navegadores móviles rechaza en silencio, y exige contexto seguro. Y el
 * CDK ya resuelve la devolución del foco, que importa porque esto vive dentro de diálogos con
 * focus-trap.
 *
 * **2. El nombre accesible del botón NO cambia al copiar.** Cambiar el nombre de un elemento *que
 * tiene el foco* se anuncia de forma inconsistente entre lectores de pantalla — y cuando se anuncia,
 * duplica lo que ya dice la región viva. El botón dice siempre lo mismo; lo que cambia es el icono.
 *
 * **3. El `<input readonly>` no es decorativo.** Da selección con el ratón, scroll horizontal cuando
 * el valor no cabe (crítico a 375px con una URL de 90 caracteres) y, al enfocarlo, se autoselecciona:
 * Tab + Cmd/Ctrl+C funciona sin tocar el botón. Es también la salida cuando el portapapeles falla,
 * y la razón de que sea `readonly` y no `disabled` — un `disabled` no recibe foco ni se selecciona.
 *
 * El design system **no registra**: si la copia falla se pinta, y quien quiera traza la pone desde la
 * feature escuchando `copied`.
 *
 * Uso: `<migo-copy-field label="URL del script" [value]="url" />`
 */
@Component({
  selector: 'migo-copy-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  template: `
    <div class="flex w-full items-center gap-2">
      <input
        class="min-h-11 min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface-sunken px-4 font-body text-sm text-body focus:border-brand focus:shadow-focus focus:outline-none"
        [id]="controlId()"
        [value]="value()"
        [attr.aria-label]="field ? null : ariaLabel() || null"
        [attr.aria-describedby]="describedBy()"
        type="text"
        readonly
        spellcheck="false"
        (focus)="selectAll($event)"
      />
      <button migo-button type="button" variant="secondary" size="md" (click)="copy()">
        <migo-icon
          icon-leading
          [name]="state() === 'copied' ? 'mat:check' : 'mat:content_copy'"
          [color]="state() === 'copied' ? 'success' : 'current'"
          size="sm"
        />
        {{ copyLabel() }}
      </button>
    </div>
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
  host: { class: 'block' },
})
export class CopyField {
  readonly value = input.required<string>();
  /** Nombre accesible cuando no hay un `migo-form-field` que ponga la etiqueta. */
  readonly ariaLabel = input('');
  /** Rótulo del botón. Constante a propósito: no cambia al copiar. */
  readonly copyLabel = input('Copiar');

  /** Se emite con el valor copiado. El DS no registra; la feature sí puede. */
  readonly copied = output<string>();

  protected readonly field = inject(FormField, { optional: true });
  protected readonly state = signal<CopyState>('idle');

  private readonly clipboard = inject(Clipboard);
  private readonly fallbackId = `migo-copy-${nextId++}`;
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);

  constructor() {
    // El temporizador sobreviviría al componente y escribiría en un signal ya destruido.
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  protected copy(): void {
    const ok = this.clipboard.copy(this.value());
    this.state.set(ok ? 'copied' : 'failed');
    if (ok) {
      this.copied.emit(this.value());
    }
    this.clearTimer();
    this.timer = setTimeout(() => this.state.set('idle'), FEEDBACK_MS);
  }

  /** Enfocar el campo selecciona todo: la ruta de teclado no pasa por el botón. */
  protected selectAll(event: Event): void {
    (event.target as HTMLInputElement).select();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
