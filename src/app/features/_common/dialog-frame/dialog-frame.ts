import { Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';

/**
 * Dialog chrome: header (icon chip + title + close X), scrollable body, and
 * footer button bar — all Tailwind utilities over the design tokens. The host
 * is display:contents: the column layout comes from the container (viewer
 * `.ventana` / game `.form-zona`), which must be flex-col with a height.
 *
 * Body goes in <ng-content>; footer in <ng-content select="[footer]">.
 *
 * The `title` input is now a translation KEY resolved by the transloco pipe in
 * this template. `data-onclick` attributes are kept verbatim (legacy GAS
 * contract; decorative in the game today).
 */
@Component({
  selector: 'app-dialog-frame',
  imports: [TranslocoPipe],
  providers: [provideTranslocoScope('formsCatalog')],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    <div class="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-sheet/85 px-5 py-3.5 backdrop-blur">
      <div class="flex min-w-0 items-center gap-3">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-accent-soft bg-accent-soft text-accent">
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            [innerHTML]="safeIcon()"
          ></svg>
        </span>
        <h3 class="m-0 truncate font-heading text-lg font-semibold text-ink" [attr.id]="titleId()">
          {{ title() | transloco }}
        </h3>
      </div>
      <!-- data-onclick: inherited from the GAS contract (decorative in the game today) -->
      <button
        class="cursor-pointer border-0 bg-transparent text-2xl leading-none text-muted transition hover:rotate-90 hover:text-ink"
        data-onclick="S.cerrar()"
        title="Cerrar"
      >&times;</button>
    </div>

    <div class="flex-1 overflow-auto bg-paper px-5 py-4 font-body text-ink antialiased">
      <div id="flash" class="mb-3.5 hidden rounded-field px-3 py-2.5 text-[13px]"></div>
      <ng-content />
    </div>

    <div class="flex shrink-0 items-center justify-end gap-2.5 border-t border-line bg-sheet px-5 py-3" [attr.id]="footerId()">
      <ng-content select="[footer]" />
    </div>
  `,
})
export class DialogFrame {
  private readonly sanitizer = inject(DomSanitizer);

  /** Translation key for the dialog title (resolved by the transloco pipe). */
  readonly title = input.required<string>();
  /** Inner SVG strokes of the icon (paths/circles), as a string. */
  readonly icon = input.required<string>();
  /** Optional chrome ids (used by the detail forms). */
  readonly titleId = input<string | null>(null);
  readonly footerId = input<string | null>(null);

  /** The strokes are static and own (form registry): trusted. */
  protected readonly safeIcon = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.icon()),
  );
}
