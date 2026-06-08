import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormField } from '@components/form-field/form-field';
import { Icon } from '@components/icon/icon';

/** Un tipo de etiqueta: sus valores, si admite crear, su sufijo y su validación. */
export interface SelectTagType {
  key: string;
  label: string;
  values: readonly string[];
  allowCreate?: boolean;
  /** Valida un valor para este tipo; devuelve el mensaje de error o `null` si es válido. */
  validate?: (value: string) => string | null;
}

type OptionKind = 'value' | 'create' | 'group';
interface Option {
  kind: OptionKind;
  id: string;
  typeKey?: string;
  typeLabel?: string;
  value: string;
  display: string;
}

let nextId = 0;

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

const BOX_BASE =
  'flex flex-wrap items-center gap-1.5 w-full min-h-11 box-border px-3 py-1.5 rounded-md bg-surface-card ' +
  'border cursor-text transition duration-base ease-out hover:border-border-strong motion-reduce:transition-none';

/**
 * Campo único estilo "Select2": caja con chips de lo elegido + un input donde se
 * escribe; al teclear, un panel (CDK Overlay) muestra sugerencias **agrupadas por
 * tipo**. **Una por tipo** (los ya elegidos no se vuelven a ofrecer). Para crear un
 * valor nuevo hay **un único "Añadir"**, que **pregunta a qué grupo** añadirlo y
 * **valida** el valor según ese tipo (`validate`). Presentacional: la validación y
 * los tipos los aporta el consumidor; aquí solo se ejecutan.
 */
@Component({
  selector: 'migo-select-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayModule, Icon],
  template: `
    <div #box cdkOverlayOrigin #origin="cdkOverlayOrigin" [class]="boxClasses()" (click)="focusInput()">
      @for (chip of chips(); track chip.key) {
        <span class="inline-flex items-center gap-1 min-h-7 ps-3 pe-1 rounded-full bg-brand text-on-brand text-sm">
          {{ chip.display }}
          <button
            type="button"
            class="inline-flex items-center justify-center size-5 rounded-full hover:bg-brand-hover focus-visible:outline-none focus-visible:shadow-focus"
            [attr.aria-label]="'Quitar ' + chip.display"
            (click)="removeChip(chip.key); $event.stopPropagation()"
          >
            <migo-icon name="mat:close" size="xs" />
          </button>
        </span>
      }
      <input
        #input
        class="flex-1 min-w-24 field-sizing-content bg-transparent border-0 p-0 min-h-9 font-body text-base text-body placeholder:text-placeholder focus:outline-none"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        [id]="controlId()"
        [value]="query()"
        [placeholder]="inputPlaceholder()"
        [attr.aria-label]="field ? null : ariaLabel() || null"
        [attr.aria-expanded]="open()"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-activedescendant]="activeId()"
        (focus)="onFocus()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
      />
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="boxWidth()"
      [cdkConnectedOverlayPositions]="positions"
      (overlayOutsideClick)="close()"
      (detach)="close()"
    >
      <ul
        class="mt-0 p-1 list-none max-h-72 overflow-y-auto bg-surface-card border border-border-subtle rounded-md shadow-lg"
        role="listbox"
      >
        @if (creating() !== null) {
          <li class="px-3 pt-2 pb-1 text-caption text-muted">¿A qué grupo añadir «{{ creating() }}»?</li>
        }
        @for (opt of options(); track opt.id; let i = $index) {
          <li
            class="flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-body cursor-pointer"
            [class.bg-surface-sunken]="i === activeIndex()"
            role="option"
            [id]="opt.id"
            [attr.aria-selected]="i === activeIndex()"
            (mousedown)="$event.preventDefault()"
            (click)="pick(opt)"
          >
            @switch (opt.kind) {
              @case ('value') {
                <span class="shrink-0 text-caption text-muted">{{ opt.typeLabel }}</span>
                <span class="flex-1">{{ opt.display }}</span>
              }
              @case ('create') {
                <migo-icon name="mat:add" size="sm" color="muted" />
                <span class="flex-1">Añadir «{{ opt.value }}»…</span>
              }
              @case ('group') {
                <span class="flex-1">{{ opt.typeLabel }}</span>
              }
            }
          </li>
        } @empty {
          <li class="px-3 py-2 text-sm text-muted">{{ pending().length ? 'Sin coincidencias' : 'Ya las elegiste todas' }}</li>
        }
        @if (createError()) {
          <li class="px-3 py-2 text-caption font-medium text-error" role="alert">{{ createError() }}</li>
        }
      </ul>
    </ng-template>
  `,
  host: { class: 'block' },
})
export class SelectTag {
  protected readonly field = inject(FormField, { optional: true });

  readonly types = input<readonly SelectTagType[]>([]);
  readonly value = input<Record<string, string>>({});
  readonly placeholder = input('');
  readonly ariaLabel = input('');

  readonly valueChange = output<Record<string, string>>();

  protected readonly positions = POSITIONS;
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly fieldId = `migo-select-tag-${nextId++}`;

  protected readonly selected = signal<Record<string, string>>({});
  private readonly extras = signal<Record<string, string[]>>({});
  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly boxWidth = signal(0);
  /** Valor en proceso de creación mientras se pregunta a qué grupo (null = no creando). */
  protected readonly creating = signal<string | null>(null);
  protected readonly createError = signal('');

  protected readonly controlId = computed(() => this.field?.controlId ?? this.fieldId);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly isInvalid = computed(() => this.field?.invalid() ?? false);

  protected readonly boxClasses = computed(() =>
    this.isInvalid()
      ? `${BOX_BASE} border-error focus-within:shadow-focus-error`
      : `${BOX_BASE} border-border-subtle focus-within:border-brand focus-within:shadow-focus`,
  );

  protected readonly chips = computed(() =>
    Object.entries(this.selected()).map(([key, value]) => ({ key, value, display: this.displayFor(key, value) })),
  );

  /** Tipos aún sin valor (los ya elegidos no se vuelven a ofrecer). */
  protected readonly pending = computed(() => this.types().filter((t) => this.selected()[t.key] === undefined));

  protected readonly inputPlaceholder = computed(() => {
    if (this.chips().length) return '';
    if (this.placeholder()) return this.placeholder();
    const next = this.pending()[0];
    return next ? `Añade ${next.label.toLowerCase()}…` : '';
  });

  protected readonly options = computed<Option[]>(() => {
    // Modo "elegir grupo": tras pulsar Añadir, se listan los tipos pendientes creables.
    const creatingValue = this.creating();
    if (creatingValue !== null) {
      return this.pending()
        .filter((t) => t.allowCreate)
        .map((t) => ({ kind: 'group' as const, id: `${this.fieldId}-group-${t.key}`, typeKey: t.key, typeLabel: t.label, value: creatingValue, display: t.label }));
    }

    // Modo lista: valores existentes de los tipos pendientes + un único "Añadir".
    const q = this.query().trim().toLowerCase();
    const result: Option[] = [];
    for (const type of this.pending()) {
      for (const value of this.valuesFor(type.key, type.values)) {
        if (!q || value.toLowerCase().includes(q)) {
          result.push({ kind: 'value', id: `${this.fieldId}-${type.key}-${value}`, typeKey: type.key, typeLabel: type.label, value, display: value });
        }
      }
    }
    if (q && this.pending().some((t) => t.allowCreate)) {
      result.push({ kind: 'create', id: `${this.fieldId}-create`, value: this.query().trim(), display: this.query().trim() });
    }
    return result;
  });

  protected readonly activeId = computed(() => this.options()[this.activeIndex()]?.id ?? null);

  constructor() {
    effect(() => this.selected.set({ ...this.value() }));
  }

  protected focusInput(): void {
    this.boxWidth.set(this.box().nativeElement.offsetWidth);
    this.open.set(true);
    this.inputEl().nativeElement.focus();
  }

  protected onFocus(): void {
    this.boxWidth.set(this.box().nativeElement.offsetWidth);
    this.open.set(true);
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.creating.set(null); // teclear vuelve al modo lista
    this.createError.set('');
    this.activeIndex.set(0);
    this.open.set(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Enter': {
        const option = this.options()[this.activeIndex()];
        if (this.open() && option) {
          event.preventDefault();
          event.stopPropagation();
          this.pick(option);
        }
        break;
      }
      case 'Escape':
        if (this.creating() !== null) {
          event.stopPropagation();
          this.cancelCreate();
        } else if (this.open()) {
          event.stopPropagation();
          this.close();
        }
        break;
      case 'Backspace':
        if (!this.query() && this.creating() === null) {
          const keys = Object.keys(this.selected());
          if (keys.length) {
            this.removeChip(keys[keys.length - 1]);
          }
        }
        break;
    }
  }

  protected pick(option: Option): void {
    switch (option.kind) {
      case 'value':
        this.commit(option.typeKey!, option.value);
        break;
      case 'create':
        // Paso 2: preguntar a qué grupo. Si solo queda un grupo creable, resolver directo.
        this.creating.set(option.value);
        this.createError.set('');
        this.activeIndex.set(0);
        this.inputEl().nativeElement.focus();
        break;
      case 'group': {
        const type = this.types().find((t) => t.key === option.typeKey);
        const error = type?.validate?.(option.value) ?? null;
        if (error) {
          this.createError.set(error);
          return;
        }
        this.addExtra(option.typeKey!, option.value);
        this.commit(option.typeKey!, option.value);
        break;
      }
    }
  }

  protected removeChip(key: string): void {
    this.selected.update((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    this.emit();
  }

  protected close(): void {
    this.open.set(false);
    this.cancelCreate();
  }

  private cancelCreate(): void {
    this.creating.set(null);
    this.createError.set('');
    this.activeIndex.set(0);
  }

  private commit(typeKey: string, value: string): void {
    this.selected.update((current) => ({ ...current, [typeKey]: value }));
    this.emit();
    this.query.set('');
    this.cancelCreate();
    this.inputEl().nativeElement.focus();
  }

  private addExtra(typeKey: string, value: string): void {
    if (!this.valuesFor(typeKey, this.typeValues(typeKey)).some((v) => v.toLowerCase() === value.toLowerCase())) {
      this.extras.update((current) => ({ ...current, [typeKey]: [...(current[typeKey] ?? []), value] }));
    }
  }

  private move(delta: number): void {
    this.open.set(true);
    const count = this.options().length;
    if (count > 0) {
      this.activeIndex.set((this.activeIndex() + delta + count) % count);
    }
  }

  /** Valores del tipo (defaults + creados), deduplicados sin distinguir mayúsculas. */
  private valuesFor(key: string, defaults: readonly string[]): string[] {
    const seen = new Map<string, string>();
    for (const value of [...defaults, ...(this.extras()[key] ?? [])]) {
      const normalized = value.trim().toLowerCase();
      if (normalized && !seen.has(normalized)) {
        seen.set(normalized, value);
      }
    }
    return [...seen.values()];
  }

  private typeValues(key: string): readonly string[] {
    return this.types().find((t) => t.key === key)?.values ?? [];
  }

  private labelFor(key: string): string {
    return this.types().find((t) => t.key === key)?.label ?? key;
  }

  /** Chip con su categoría delante: "Sabor: Vainilla". */
  private displayFor(key: string, value: string): string {
    return `${this.labelFor(key)}: ${value}`;
  }

  private emit(): void {
    this.valueChange.emit({ ...this.selected() });
  }
}
