import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Button } from '@components/button/button';
import { Card } from '@components/card/card';
import { CardBody } from '@components/card/card-body';
import { CardHeader } from '@components/card/card-header';
import { CardTitle } from '@components/card/card-title';
import { Icon } from '@components/icon/icon';
import { MigoDialog, MigoDialogRef } from '@components/dialog/dialog.service';
import { ListRecipeBook, type RecipeBookCatalog } from '@core/recipe-book/application/use-cases/list-recipe-book.use-case';
import type { SpongeRecipe } from '@core/recipe-book/domain/entities/sponge-recipe';
import type { Ingredient } from '@core/recipe-book/domain/entities/ingredient';
import { SpongeForm, type SpongeFormData, type IngredientOption } from './sponge-form/sponge-form';

interface SpongeView {
  id: string;
  name: string;
  lineCount: number;
  chips: string[];
}

/**
 * Hub "Mi libro de recetas": contenido de un MigoDialog que abre el mundo 3D al
 * tocar el atril de recetas. Lee el catálogo con `ListRecipeBook` y, en este
 * slice, deja crear el primer **queque** (abre {@link SpongeForm}) y lista los
 * queques con sus características al costado. Inyecta solo use cases.
 */
@Component({
  selector: 'app-recipe-book',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, CardHeader, CardTitle, CardBody, Icon],
  templateUrl: './recipe-book.html',
})
export class RecipeBook {
  private readonly listRecipeBook = inject(ListRecipeBook);
  private readonly dialog = inject(MigoDialog);
  protected readonly ref = inject<MigoDialogRef>(MigoDialogRef);

  private readonly catalog = signal<RecipeBookCatalog | null>(null);

  protected readonly loaded = computed(() => this.catalog() !== null);
  protected readonly sponges = computed<SpongeView[]>(() =>
    (this.catalog()?.sponges ?? []).map((s) => ({
      id: s.id.value,
      name: s.name,
      lineCount: s.lines.length,
      chips: spongeChips(s),
    })),
  );

  constructor() {
    void this.reload();
  }

  protected createSponge(): void {
    const sponges = this.catalog()?.sponges ?? [];
    const ingredients = (this.catalog()?.ingredients ?? [])
      .filter((i) => i.usage === 'recipe')
      .map(toIngredientOption);
    const dialogRef = this.dialog.open<{ id: string }, SpongeFormData, SpongeForm>(SpongeForm, {
      data: { ingredients, valuesByType: valuesByType(sponges) },
      ariaLabel: 'Nuevo queque',
      width: '640px',
    });
    dialogRef.closed.subscribe((result) => {
      if (result) {
        void this.reload();
      }
    });
  }

  protected close(): void {
    this.ref.close();
  }

  private async reload(): Promise<void> {
    this.catalog.set(await this.listRecipeBook.execute());
  }
}

/** Proyecta un Ingredient del catálogo a una opción con precio para el formulario. */
function toIngredientOption(ingredient: Ingredient): IngredientOption {
  return {
    name: ingredient.name,
    baseUnit: ingredient.baseUnit,
    purchase: {
      amount: ingredient.purchasePrice.amount,
      per: { value: ingredient.purchasePrice.per.value, unit: ingredient.purchasePrice.per.unit },
    },
  };
}

/** Formatea gramos a una etiqueta legible (kg/g) — solo presentación. */
function formatWeight(grams: number): string {
  return grams >= 1000 ? `${+(grams / 1000).toFixed(2)} kg` : `${grams} g`;
}

/** Chips de características de un queque para el listado. */
function spongeChips(s: SpongeRecipe): string[] {
  const chips: string[] = [];
  if (s.flavor) chips.push(s.flavor);
  chips.push(formatWeight(s.referenceYield.weight.value));
  if (s.referenceYield.size) chips.push(s.referenceYield.size);
  if (s.referenceYield.servings) chips.push(`${s.referenceYield.servings} porciones`);
  return chips;
}

/** Valores ya usados por tipo, para alimentar las sugerencias del campo único. */
function valuesByType(sponges: readonly SpongeRecipe[]): Record<string, string[]> {
  const buckets: Record<string, Set<string>> = {
    sabor: new Set(),
    peso: new Set(),
    porciones: new Set(),
    'tamaño': new Set(),
  };
  for (const s of sponges) {
    if (s.flavor) buckets['sabor'].add(s.flavor);
    buckets['peso'].add(formatWeight(s.referenceYield.weight.value));
    if (s.referenceYield.size) buckets['tamaño'].add(s.referenceYield.size);
    if (s.referenceYield.servings) buckets['porciones'].add(String(s.referenceYield.servings));
  }
  return {
    sabor: [...buckets['sabor']],
    peso: [...buckets['peso']],
    porciones: [...buckets['porciones']],
    'tamaño': [...buckets['tamaño']],
  };
}
