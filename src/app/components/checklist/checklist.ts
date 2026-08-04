import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '@components/icon/icon';
import { IconName } from '@components/icon/icon.registry';

/** En qué punto está un paso. `failed` es terminal: los que venían detrás se quedan en `pending`. */
export type ChecklistState = 'pending' | 'running' | 'done' | 'failed';

export interface ChecklistItem {
  /** Qué se está haciendo, en presente («Creando la hoja en tu Drive»). */
  label: string;
  state: ChecklistState;
  /** Una línea bajo el rótulo: el resultado del paso, o el motivo del fallo. Opcional. */
  detail?: string;
}

const ICONS: Record<ChecklistState, IconName> = {
  pending: 'mat:radio_button_unchecked',
  running: 'mat:refresh',
  done: 'mat:check_circle',
  failed: 'mat:error',
};

/**
 * Color + animación por estado. El giro solo lo lleva `running`; el salto de escala de `done`
 * ocurre porque el icono es **el mismo elemento** en los cuatro estados y solo cambia de clases.
 */
const ICON_BASE = 'transition motion-reduce:transition-none motion-reduce:animate-none ';

const ICON_CLASSES: Record<ChecklistState, string> = {
  pending: ICON_BASE + 'text-muted scale-90',
  running: ICON_BASE + 'text-brand scale-90 animate-spin',
  done: ICON_BASE + 'text-success scale-100',
  failed: ICON_BASE + 'text-error scale-100',
};

const LABEL_BASE = 'm-0 font-body text-sm ';

const LABEL_CLASSES: Record<ChecklistState, string> = {
  pending: LABEL_BASE + 'text-muted',
  running: LABEL_BASE + 'text-body font-semibold',
  done: LABEL_BASE + 'text-body',
  failed: LABEL_BASE + 'text-body font-semibold',
};

/** Texto del estado para quien no ve el icono. Se puede sustituir con el input `stateLabels`. */
export const DEFAULT_CHECKLIST_STATE_LABELS: Record<ChecklistState, string> = {
  pending: 'Pendiente',
  running: 'En curso',
  done: 'Hecho',
  failed: 'Ha fallado',
};

/**
 * Lista de pasos que se van marcando conforme ocurren: cada uno con su icono de estado, su rótulo y
 * un detalle opcional, unidos por un raíl vertical que se colorea al completarse el paso.
 *
 * Presentacional puro: **no ejecuta nada ni sabe qué son los pasos**. Recibe `items` ya resueltos y
 * los pinta; quien los avanza es la feature, que es la que llama a los casos de uso.
 *
 * ## Accesibilidad
 *
 * El icono no es la única señal del estado (WCAG 1.4.1): cada paso lleva su estado **en texto**, en
 * un `sr-only`, y la lista es una región viva `polite`, así que al pasar de «En curso» a «Hecho» el
 * lector de pantalla lo anuncia sin interrumpir. La animación va con `motion-reduce:` para quien
 * pidió que la interfaz no se mueva.
 *
 * Uso: `<migo-checklist [items]="pasos()" label="Progreso de la conexión" />`
 */
@Component({
  selector: 'migo-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <!-- role="list" explícito: Safari retira la semántica de lista en cuanto se quita el marcador. -->
    <ol
      class="m-0 flex list-none flex-col p-0"
      role="list"
      [attr.aria-label]="label() || null"
      aria-live="polite"
      [attr.aria-busy]="busy() ? true : null"
    >
      @for (item of items(); track item.label; let last = $last) {
        <li class="flex gap-3">
          <!-- Columna del indicador: el icono y el raíl que lo une con el paso siguiente. -->
          <div class="flex flex-col items-center gap-1">
            <migo-icon size="md" [name]="iconOf(item)" [class]="iconClassesOf(item)" />
            @if (!last) {
              <span
                class="w-px flex-1 rounded-full transition-colors duration-slow motion-reduce:transition-none"
                [class.bg-success]="item.state === 'done'"
                [class.bg-border-subtle]="item.state !== 'done'"
              ></span>
            }
          </div>

          <div
            class="flex min-w-0 flex-1 flex-col gap-0.5 transition-opacity duration-slow motion-reduce:transition-none"
            [class.opacity-60]="item.state === 'pending'"
            [class.pb-4]="!last"
          >
            <p [class]="labelClassesOf(item)">
              {{ item.label }}
              <span class="sr-only">— {{ stateLabelOf(item) }}</span>
            </p>
            @if (item.detail) {
              <p class="m-0 break-words font-body text-caption text-muted">{{ item.detail }}</p>
            }
          </div>
        </li>
      }
    </ol>
  `,
  host: { class: 'block w-full' },
})
export class Checklist {
  readonly items = input.required<readonly ChecklistItem[]>();

  /** Nombre accesible de la lista. Sin él, el lector de pantalla solo dice «lista». */
  readonly label = input('');

  /** Textos de estado para lectores de pantalla. Se sustituyen enteros si la app no está en español. */
  readonly stateLabels = input<Record<ChecklistState, string>>(DEFAULT_CHECKLIST_STATE_LABELS);

  /** `aria-busy` mientras quede algún paso en curso: hay trabajo sin terminar en esta región. */
  protected readonly busy = computed(() => this.items().some((item) => item.state === 'running'));

  protected iconOf(item: ChecklistItem): IconName {
    return ICONS[item.state];
  }

  protected iconClassesOf(item: ChecklistItem): string {
    return ICON_CLASSES[item.state];
  }

  protected labelClassesOf(item: ChecklistItem): string {
    return LABEL_CLASSES[item.state];
  }

  protected stateLabelOf(item: ChecklistItem): string {
    return this.stateLabels()[item.state];
  }
}
