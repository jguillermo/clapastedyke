import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { CatalogService } from '../../core/catalog/catalog.service';
import { InventoryService } from '../../core/inventory/inventory.service';
import { SettingsService } from '../../core/settings/settings.service';
import { DomainError } from '../../core/_common/domain/errors';
import { StockLight } from '../../core/catalog/domain/supply/supply';
import { SupplyListItem } from '../../core/catalog/application/list-supplies/list-supplies';
import { AdjustmentType } from '../../core/settings/domain/business-settings';
import { StockMovementListItem } from '../../core/inventory/application/list-stock-movements/list-stock-movements';
import { UI_FORMS } from '../_common/directives/ui';

interface Preview {
  currentStock: number;
  resultingStock: number;
  stockLight: StockLight;
}

/** Movement types that translate from the root `movement.*` bundle. */
const MOVEMENT_TYPES = ['initial', 'purchase', 'consumption', 'cancellation'];

/**
 * INVENTORY SCREEN (Flow 06): manual adjustments + kardex. The adjustment sign
 * is decided by the TYPE (settings): the quantity carries no `min` in the
 * schema — `count` allows negatives and it is the domain
 * (`signedAdjustmentQuantity`) that validates and rejects the 0 or an unknown
 * type; that error arrives as a notice. The live PREVIEW calls
 * `previewAdjustment` (no persist) and paints the resulting stock with its
 * light. The view does NOT compute: the preview and the kardex arrive resolved.
 */
@Component({
  selector: 'app-inventory-screen',
  imports: [...UI_FORMS, FormField, TranslocoPipe],
  templateUrl: './inventory-screen.html',
  providers: [provideTranslocoScope('operations')],
})
export class InventoryScreen {
  private readonly catalog = inject(CatalogService);
  private readonly inventory = inject(InventoryService);
  private readonly settings = inject(SettingsService);
  private readonly transloco = inject(TranslocoService);

  protected readonly supplies = signal<SupplyListItem[]>([]);
  protected readonly adjustmentTypes = signal<AdjustmentType[]>([]);
  protected readonly movements = signal<StockMovementListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  /** Live preview (null = not enough data or after an error). */
  protected readonly preview = signal<Preview | null>(null);

  /** Kardex filter: '' = all. */
  protected readonly supplyFilter = signal<string>('');

  protected readonly model = signal({ supplyId: '', type: '', quantity: 0, reason: '' });
  protected readonly form = form(this.model, field => {
    required(field.supplyId, { message: 'operations.inventory.supplyRequired' });
    required(field.type, { message: 'operations.inventory.typeRequired' });
    // NOTE: quantity carries no `min` — the sign comes from the type and `count`
    // allows negatives. The domain validates (quantity ≠ 0) and notifies.
    maxLength(field.reason, 200, { message: 'operations.inventory.reasonMax' });
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const [supplies, settings] = await Promise.all([
      this.catalog.listSupplies.execute({}),
      this.settings.getSettings.execute(),
    ]);
    this.supplies.set(supplies);
    this.adjustmentTypes.set([...settings.adjustmentTypes]);
    await this.reloadKardex();
    this.loading.set(false);
  }

  protected async reloadKardex(): Promise<void> {
    const filter = this.supplyFilter();
    this.movements.set(
      await this.inventory.listStockMovements.execute(filter ? { supplyId: filter } : {}),
    );
  }

  protected changeFilter(supplyId: string): void {
    this.supplyFilter.set(supplyId);
    void this.reloadKardex();
  }

  /** Adjustment type label: translated name + sign hint. */
  protected typeLabel(t: AdjustmentType): string {
    const name = this.transloco.translate('adjustment.' + t.name);
    const signKey =
      t.sign === -1 ? 'adjustment.sign.subtracts' : t.sign === 1 ? 'adjustment.sign.adds' : 'adjustment.sign.signed';
    return `${name} (${this.transloco.translate(signKey)})`;
  }

  /**
   * Kardex type column: system movements use the root `movement.*` bundle;
   * manual adjustment types fall back to the `adjustment.*` bundle.
   */
  protected movementTypeLabel(type: string): string {
    const bundle = MOVEMENT_TYPES.includes(type) ? 'movement.' : 'adjustment.';
    return this.transloco.translate(bundle + type);
  }

  /**
   * Maps the business StockLight ('red'|'yellow'|'green') to the shared
   * `uiDot` directive's color names, which are kept in Spanish.
   */

  /** Recomputes the preview when there is supply + type + quantity. */
  protected async updatePreview(): Promise<void> {
    const m = this.model();
    if (!m.supplyId || !m.type || !m.quantity) {
      this.preview.set(null);
      return;
    }
    try {
      const r = await this.inventory.previewAdjustment.execute({
        supplyId: m.supplyId,
        type: m.type,
        quantity: m.quantity,
      });
      this.preview.set(r);
    } catch {
      // Unknown type / quantity 0: no preview.
      this.preview.set(null);
    }
  }

  protected clear(): void {
    this.model.set({ supplyId: '', type: '', quantity: 0, reason: '' });
    this.form().reset();
    this.preview.set(null);
    this.notice.set(null);
  }

  /** submit() marks all fields touched and only runs if valid. */
  protected save(): void {
    void submit(this.form, async () => {
      this.saving.set(true);
      this.notice.set(null);
      try {
        const m = this.model();
        const r = await this.inventory.adjustInventory.execute({
          supplyId: m.supplyId,
          type: m.type,
          quantity: m.quantity,
          reason: m.reason || undefined,
        });
        this.notice.set({
          kind: 'ok',
          text: this.transloco.translate('operations.inventory.savedNotice', {
            resulting: r.resultingStock,
          }),
        });
        this.clear();
        await this.load();
      } catch (error) {
        const text =
          error instanceof DomainError
            ? error.message
            : this.transloco.translate('operations.inventory.couldNotAdjust');
        this.notice.set({ kind: 'err', text });
      } finally {
        this.saving.set(false);
      }
    });
  }
}
