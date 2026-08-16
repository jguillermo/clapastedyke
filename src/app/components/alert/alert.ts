import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Icon } from '@components/icon/icon';
import { IconName } from '@components/icon/icon.registry';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/** Cómo se anuncia. `auto` lo deriva de la variante; `off` lo saca de las regiones vivas. */
export type AlertLive = 'auto' | 'polite' | 'assertive' | 'off';

/** Fondo suave + borde del color semántico. Literales: Tailwind solo emite clases escritas. */
const VARIANTS: Record<AlertVariant, string> = {
  info: 'bg-info-soft border-info',
  success: 'bg-success-soft border-success',
  warning: 'bg-warning-soft border-warning',
  error: 'bg-error-soft border-error',
};

const ICONS: Record<AlertVariant, IconName> = {
  info: 'mat:info',
  success: 'mat:check_circle',
  warning: 'mat:warning',
  error: 'mat:error',
};

/**
 * Aviso en línea: un mensaje con peso semántico que se queda en la página (a diferencia de un toast,
 * que pasa). Icono por variante, título opcional, cuerpo por proyección y una fila de acciones
 * opcional en el slot `[alert-actions]`.
 *
 * **El texto va en `text-body`, no en el color de la variante.** El color semántico se reserva al
 * icono y al borde: sobre `bg-*-soft`, un `text-error` se queda por debajo del 4.5:1 de WCAG AA. Y
 * el significado nunca lo lleva el color solo (WCAG 1.4.1) — para eso está `heading`.
 *
 * ## `live`, y por qué no basta con derivarlo de la variante
 *
 * Por defecto (`auto`) `error` y `warning` usan `role="alert"`, que **interrumpe** al lector de
 * pantalla, y `info`/`success` usan `role="status"`, que espera turno: son consecuencia de algo que
 * el usuario acaba de hacer frente a una simple confirmación.
 *
 * Pero un aviso que **ya está en el DOM cuando aparece su contenedor** —el cuerpo de un diálogo, por
 * ejemplo— se leería **dos veces**: una al enfocar el diálogo y otra por la región viva. Para eso
 * está `live="off"`. Regla: montado con su contenedor → `off`; aparecido por una acción → `auto`.
 *
 * Uso: `<migo-alert variant="warning" heading="Falta un paso">Activa la API…</migo-alert>`
 */
@Component({
  selector: 'migo-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (!iconless()) {
      <migo-icon class="mt-0.5" [name]="icon()" [color]="variant()" size="md" />
    }
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      @if (heading(); as title) {
        <p class="m-0 font-body text-sm font-semibold text-heading">{{ title }}</p>
      }
      <div class="text-sm text-body [&_a]:underline [&_ol]:m-0 [&_p]:m-0">
        <ng-content />
      </div>
      <!-- contents evita una caja vacía cuando no se proyecta nada; la variante de hijo estila
           el contenido proyectado sin ::ng-deep (mismo patrón que migo-card-header). -->
      <span class="contents [&>*]:mt-3 [&>*]:flex [&>*]:flex-wrap [&>*]:gap-2">
        <ng-content select="[alert-actions]" />
      </span>
    </div>
  `,
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'role()',
  },
})
export class Alert {
  readonly variant = input<AlertVariant>('info');
  /** Título breve sobre el cuerpo. Opcional, pero es lo que evita que el color sea el único indicio. */
  readonly heading = input('');
  readonly live = input<AlertLive>('auto');
  /** Quita el icono, para avisos apilados o listas densas. */
  readonly iconless = input(false, { transform: booleanAttribute });

  protected readonly icon = computed(() => ICONS[this.variant()]);

  protected readonly role = computed(() => {
    switch (this.live()) {
      case 'off':
        return null;
      case 'assertive':
        return 'alert';
      case 'polite':
        return 'status';
      default:
        return this.variant() === 'error' || this.variant() === 'warning' ? 'alert' : 'status';
    }
  });

  protected readonly hostClasses = computed(
    () =>
      `flex w-full items-start gap-3 rounded-xl border p-4 font-body text-sm text-body ${VARIANTS[this.variant()]}`,
  );
}
