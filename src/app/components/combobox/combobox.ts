import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormField } from '@components/form-field/form-field';

let nextComboboxId = 0;

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

/** Estilo común del control; el borde/padding cambian con `seamless`/`paper`. */
const CONTROL_COMMON =
  'w-full min-h-11 box-border bg-transparent font-body text-base transition duration-base ease-out ' +
  'placeholder:text-placeholder focus:outline-none disabled:bg-surface-sunken disabled:text-muted ' +
  'disabled:cursor-not-allowed motion-reduce:transition-none';

/**
 * Combobox de texto con **dos modos** según las coincidencias de lo tecleado:
 * - **1 coincidencia que empieza por** lo escrito → **fantasma en línea** (el resto de
 *   la sugerencia aparece tenue dentro del propio campo; se acepta con Tab, → o Enter).
 * - **2+ coincidencias**, o **1 que solo contiene** lo escrito → **desplegable** debajo
 *   (CDK Overlay + listbox) para elegir con ratón o teclado.
 *
 * La coincidencia del desplegable es **por contenido** (substring); el fantasma solo
 * puede completar **por prefijo**. Presentacional: las sugerencias llegan por
 * `suggestions` (el consumidor las obtiene del dominio). Implementa
 * `ControlValueAccessor` (valor `string`) y se integra con `<migo-form-field>`.
 */
@Component({
  selector: 'migo-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayModule],
  template: `
    <span #wrapper class="relative block" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <input
        #control
        class="relative {{ controlClasses() }}"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="both"
        [id]="controlId()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [attr.aria-label]="field ? null : ariaLabel() || null"
        [attr.aria-invalid]="isInvalid() ? true : null"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-expanded]="showDropdown()"
        [attr.aria-controls]="showDropdown() ? listboxId : null"
        [attr.aria-activedescendant]="showDropdown() ? optionId(activeIndex()) : null"
        (keydown)="onKeydown($event)"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (scroll)="syncGhost()"
        (blur)="onBlur()"
      />
      <!-- El fantasma va DESPUÉS del input para pintarse ENCIMA (si no, el fondo de foco del
           input lo taparía). El tramo tecleado es invisible: deja ver el texto real del input. -->
      @if (ghostSuffix()) {
        <span #ghost [class]="ghostClasses()" aria-hidden="true">
          <span class="invisible">{{ value() }}</span><span class="text-placeholder">{{ ghostSuffix() }}</span>
        </span>
      }
    </span>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="showDropdown()"
      [cdkConnectedOverlayWidth]="overlayWidth()"
      [cdkConnectedOverlayPositions]="positions"
      (overlayOutsideClick)="close()"
      (detach)="close()"
    >
      <ul
        [id]="listboxId"
        class="mt-0 p-1 list-none max-h-72 overflow-y-auto bg-surface-card border border-border-subtle rounded-md shadow-lg"
        role="listbox"
      >
        @for (option of dropdownOptions(); track option; let i = $index) {
          <li
            class="flex items-center gap-2 px-3 py-2 min-h-11 rounded-sm text-sm text-body cursor-pointer"
            [class.bg-surface-sunken]="i === activeIndex()"
            role="option"
            [id]="optionId(i)"
            [attr.aria-selected]="i === activeIndex()"
            (mousedown)="$event.preventDefault()"
            (click)="pick(option)"
          >
            <span class="flex-1">{{ option }}</span>
          </li>
        }
      </ul>
    </ng-template>
  `,
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Combobox), multi: true },
  ],
})
export class Combobox implements ControlValueAccessor {
  protected readonly field = inject(FormField, { optional: true });

  readonly suggestions = input<readonly string[]>([]);
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Variante sin borde/fondo para incrustarse en una celda de grilla. */
  readonly seamless = input(false, { transform: booleanAttribute });
  /** Variante "papel": como `seamless` pero con renglón inferior y realce cálido del libro. */
  readonly paper = input(false, { transform: booleanAttribute });

  /**
   * Emite la sugerencia elegida cuando el usuario **termina** la selección (Tab / Enter, o
   * clic en el desplegable). El consumidor puede avanzar el foco al siguiente campo. No se
   * emite al **completar en línea con →** (eso solo rellena, deja seguir escribiendo).
   */
  readonly selected = output<string>();

  protected readonly positions = POSITIONS;
  private readonly wrapper = viewChild.required<ElementRef<HTMLElement>>('wrapper');
  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly ghost = viewChild<ElementRef<HTMLElement>>('ghost');

  private readonly fallbackId = `migo-combobox-${nextComboboxId++}`;
  protected readonly listboxId = `${this.fallbackId}-listbox`;
  protected readonly value = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly overlayWidth = signal(0);
  private readonly disabledByForm = signal(false);

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fallbackId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly isInvalid = computed(() => (this.field?.invalid() ?? false) || this.invalid());
  protected readonly isDisabled = computed(() => this.disabledByForm() || this.disabled());

  /** Coincidencias por **contenido** (substring), excluyendo la igual exacta. */
  private readonly matches = computed(() => {
    const typed = this.value().trim();
    if (!typed) return [];
    const lower = typed.toLowerCase();
    return this.suggestions().filter((s) => {
      const sl = s.toLowerCase();
      return sl.includes(lower) && sl !== lower;
    });
  });

  /** Hay fantasma cuando hay **una sola** coincidencia y **empieza por** lo tecleado. */
  private readonly isGhostMode = computed(() => {
    const matches = this.matches();
    return matches.length === 1 && matches[0].toLowerCase().startsWith(this.value().trim().toLowerCase());
  });

  /** El sufijo tenue que se pinta tras el texto del usuario (solo en modo fantasma). */
  protected readonly ghostSuffix = computed(() =>
    this.isGhostMode() ? this.matches()[0].slice(this.value().length) : '',
  );

  /** Opciones del desplegable: 2+ coincidencias, o 1 que solo contiene (no es prefijo). */
  protected readonly dropdownOptions = computed(() => (this.isGhostMode() ? [] : this.matches()));

  /** El overlay solo se muestra abierto si hay foco/tecleo y hay opciones que listar. */
  protected readonly showDropdown = computed(() => this.open() && this.dropdownOptions().length > 0);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Mantener el fantasma alineado con el desplazamiento horizontal del input al teclear
    // (nombres largos): así el sufijo queda en línea y no se desplaza/baja. El scroll manual
    // se cubre además con (scroll) en el input.
    afterRenderEffect(() => {
      this.value(); // re-ejecuta tras cada cambio de valor
      this.syncGhost();
    });
  }

  protected optionId(index: number): string {
    return `${this.fallbackId}-option-${index}`;
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
    this.activeIndex.set(0);
    this.open.set(true);
  }

  protected onFocus(): void {
    this.overlayWidth.set(this.wrapper().nativeElement.offsetWidth);
    this.open.set(true);
  }

  protected onBlur(): void {
    this.open.set(false);
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const hasDropdown = this.dropdownOptions().length > 0;

    // Las flechas abren/navegan el desplegable. Importante: además de preventDefault, se
    // **detiene la propagación** para que el (keydown) del migo-grid no cambie de celda.
    if (hasDropdown && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      event.stopPropagation();
      this.open.set(true);
      this.move(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (this.showDropdown()) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          this.pick(this.dropdownOptions()[this.activeIndex()]);
          return;
        case 'Tab':
          if (!event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            this.pick(this.dropdownOptions()[this.activeIndex()]);
          }
          return;
        case 'Escape':
          event.stopPropagation();
          this.close();
          return;
        default:
          return;
      }
    }

    // Modo fantasma: aceptar la única coincidencia por prefijo.
    if (!this.isGhostMode()) {
      return;
    }
    const match = this.matches()[0];
    const input = this.control().nativeElement;
    const caretAtEnd =
      input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
    const finishes = event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey);
    const completesInline = event.key === 'ArrowRight' && caretAtEnd;
    if (!finishes && !completesInline) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    // Tab/Enter cierran el campo → avanzan al siguiente; → solo completa en línea (sin avanzar).
    this.commit(match, finishes);
  }

  protected pick(option: string): void {
    this.commit(option, true); // elegir del desplegable termina la selección → avanza
  }

  protected close(): void {
    this.open.set(false);
  }

  private move(delta: number): void {
    const count = this.dropdownOptions().length;
    if (count > 0) {
      this.activeIndex.set((this.activeIndex() + delta + count) % count);
    }
  }

  /**
   * Acepta una sugerencia (respeta su capitalización), cierra el panel y deja el caret al final.
   * Si `advance`, emite `selected` para que el consumidor pase al siguiente campo.
   */
  private commit(match: string, advance: boolean): void {
    this.value.set(match);
    this.onChange(match);
    this.open.set(false);
    this.activeIndex.set(0);
    const input = this.control().nativeElement;
    input.value = match;
    input.setSelectionRange(match.length, match.length);
    if (advance) {
      this.selected.emit(match);
    }
  }

  /** Iguala el desplazamiento horizontal del fantasma al del input (nombres largos). */
  protected syncGhost(): void {
    const ghost = this.ghost()?.nativeElement;
    if (ghost) {
      ghost.scrollLeft = this.control().nativeElement.scrollLeft;
    }
  }

  protected readonly controlClasses = computed(() => {
    if (this.paper()) {
      const base = `${CONTROL_COMMON} px-3 border-x-0 border-t-0 border-b border-border-subtle rounded-none focus:bg-surface-warm`;
      return this.isInvalid() ? `${base} text-error` : `${base} text-body`;
    }
    if (this.seamless()) {
      const base = `${CONTROL_COMMON} px-3 border-0 rounded-none focus:bg-surface-sunken`;
      return this.isInvalid() ? `${base} text-error` : `${base} text-body`;
    }
    const base = `${CONTROL_COMMON} px-4 border rounded-md text-body hover:border-border-strong`;
    return this.isInvalid()
      ? `${base} border-error focus:border-error focus:shadow-focus-error`
      : `${base} border-border-subtle focus:border-brand focus:shadow-focus`;
  });

  /** El fantasma replica el padding/borde del control para alinearse; una sola línea recortada. */
  protected readonly ghostClasses = computed(() => {
    const pad = this.seamless() || this.paper() ? 'px-3' : 'px-4';
    const border = this.paper()
      ? 'border-x-0 border-t-0 border-b border-transparent'
      : this.seamless()
        ? ''
        : 'border border-transparent';
    return `absolute inset-0 flex items-center ${pad} ${border} box-border font-body text-base whitespace-pre overflow-hidden pointer-events-none`;
  });

  // ControlValueAccessor
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }
}
