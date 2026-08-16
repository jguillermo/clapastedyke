import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '@components/icon/icon';
import type { IconName } from '@components/icon/icon.registry';

/**
 * Qué está pasando con la copia remota, desde el punto de vista de quien mira.
 *
 * Son los estados que **cambian lo que el usuario ve o puede hacer**, no los del motor: `syncing` y
 * `idle` se pintan igual de discretos porque a nadie le importa el instante exacto; `pending` y
 * `reconnect` sí, porque uno dice «lo tuyo aún no ha salido» y el otro pide una acción.
 */
export type SyncIndicatorState = 'hidden' | 'pending' | 'syncing' | 'reconnect' | 'error';

/**
 * Iconos del registro que ya existían. No se añaden nuevos por esto: `mat:refresh` girando dice
 * «sincronizando» igual que un `sync`, y `mat:warning` dice «hace falta algo tuyo» igual que un
 * `cloud_off` — y cada icono nuevo es una entrada más que mantener en el registro tipado.
 */
const ICONS: Record<Exclude<SyncIndicatorState, 'hidden'>, IconName> = {
  pending: 'mat:cloud_upload',
  syncing: 'mat:refresh',
  reconnect: 'mat:warning',
  error: 'mat:error',
};

/** Color del punto por estado. Solo `reconnect` y `error` piden atención. */
const TONES: Record<Exclude<SyncIndicatorState, 'hidden'>, string> = {
  pending: 'text-muted',
  syncing: 'text-muted',
  reconnect: 'text-warning',
  error: 'text-error',
};

/**
 * Aviso discreto del estado de la copia remota.
 *
 * ## Discreto de verdad: cuando está al día, no existe
 *
 * Un indicador que siempre se ve enseña a no mirarlo. Con `hidden` el componente **no pinta nada**, así
 * que aparecer ya es la señal. Es la diferencia entre un cartel y un aviso.
 *
 * ## Presentacional, como todo aquí
 *
 * No sabe qué es una hoja de cálculo ni cuántas filas hay pendientes de subir: recibe un estado y un
 * número y los pinta. Quién decide el estado es la app — este componente vive en la librería y no importa
 * nada de ella (ni el `Logger`: ver la regla de `components/`).
 *
 * ## Va por encima de todo, a propósito
 *
 * Se monta en el armazón y flota sobre el mundo 3D y sobre los diálogos, porque el mensaje que da —«esto
 * aún no ha salido de aquí»— importa igual mientras se cocina que mientras se rellena un formulario.
 */
@Component({
  selector: 'migo-sync-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (state() !== 'hidden') {
      <button
        type="button"
        class="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-3 shadow-md transition-colors duration-base ease-out hover:bg-surface-sunken focus-visible:shadow-focus focus-visible:outline-none motion-reduce:transition-none"
        [attr.aria-label]="label()"
        (click)="activated.emit()"
      >
        <migo-icon
          [name]="icon()"
          [class]="spinning() ? 'animate-spin motion-reduce:animate-none' : ''"
          size="sm"
        />
        <span [class]="'font-body text-sm ' + tone()">{{ text() }}</span>
      </button>
    }
  `,
  // `fixed` + `pointer-events-none` en el host: flota sobre el canvas y sobre los diálogos sin robarle
  // el clic a nada; solo el botón de dentro vuelve a aceptar puntero.
  host: {
    class: 'pointer-events-none fixed bottom-4 end-4 z-50 flex',
  },
})
export class SyncIndicator {
  /** Qué está pasando. `hidden` no pinta nada, que es el caso normal. */
  readonly state = input<SyncIndicatorState>('hidden');

  /** Cuántos cambios llevan sin salir de aquí. Solo se enseña si hay alguno. */
  readonly pending = input<number>(0);

  /** Filas del destino que no se pueden leer, si hay. */
  readonly unreadable = input<number>(0);

  /** Se pulsó el aviso: quien lo monta decide a dónde lleva (hoy, a la pantalla de cuenta). */
  readonly activated = output<void>();

  protected readonly icon = computed<IconName>(() => ICONS[this.visible()]);
  protected readonly tone = computed(() => TONES[this.visible()]);
  protected readonly spinning = computed(() => this.visible() === 'syncing');

  /**
   * El texto, lo más corto que siga siendo cierto.
   *
   * `pending` lleva el número porque «1 sin subir» y «40 sin subir» no significan lo mismo para quien
   * decide si puede cerrar el portátil.
   */
  protected readonly text = computed(() => {
    switch (this.visible()) {
      case 'pending':
        return this.pending() === 1 ? '1 sin subir' : `${this.pending()} sin subir`;
      case 'syncing':
        return 'Sincronizando';
      case 'reconnect':
        return 'Reconectar';
      case 'error':
        return this.unreadable() > 0 ? 'Revisa tu hoja' : 'Sin sincronizar';
    }
  });

  /** Nombre accesible: dice además qué pasa al pulsarlo, que el texto corto no cabe. */
  protected readonly label = computed(
    () => `${this.text()}. Abrir el estado de la sincronización.`,
  );

  /** El estado, ya sin `hidden`, para poder indexar las tablas sin ramas de más. */
  private readonly visible = computed<Exclude<SyncIndicatorState, 'hidden'>>(() => {
    const state = this.state();
    return state === 'hidden' ? 'pending' : state;
  });
}
