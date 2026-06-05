import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Home3d } from './home-3d';
import { StatusBadge } from '../../../_common/ui/status-badge';
import { GoalTracker } from '../../../_common/ui/goal-tracker';
import { ProgressionFacade } from '../../../_common/progression/progression-facade';
import { ListRecipes } from '../../../../core/catalog/application/list-recipes/list-recipes';
import { SaveRecipe } from '../../../../core/catalog/application/save-recipe/save-recipe';
import { SaveSupply } from '../../../../core/catalog/application/save-supply/save-supply';
import { RecipePrimitives } from '../../../../core/catalog/domain/recipe/recipe';
import { ListSupplies, SupplyListItem } from '../../../../core/catalog/application/list-supplies/list-supplies';
import { CheckIngredients } from '../../../../core/kitchen/application/check-ingredients/check-ingredients';
import { CookRecipe } from '../../../../core/kitchen/application/cook-recipe/cook-recipe';
import { BuyIngredient } from '../../../../core/kitchen/application/buy-ingredient/buy-ingredient';
import { RecipeCheck, IngredientCheck } from '../../../../core/kitchen/domain/ingredient-check';
import { PublishProduction } from '../../../../core/reputation/application/publish-production/publish-production';
import { GetPopularity } from '../../../../core/reputation/application/get-popularity/get-popularity';
import { AttendInformalOrder } from '../../../../core/reputation/application/attend-informal-order/attend-informal-order';
import { Feature } from '../../../../core/progression/domain/feature';
import { ListCustomers } from '../../../../core/catalog/application/list-customers/list-customers';
import { SaveCustomer } from '../../../../core/catalog/application/save-customer/save-customer';
import { CustomerPrimitives } from '../../../../core/catalog/domain/customer/customer';
import { PlaceBasicOrder } from '../../../../core/sales/application/place-basic-order/place-basic-order';
import { DeliverBasicOrder } from '../../../../core/sales/application/deliver-basic-order/deliver-basic-order';
import { ListBasicOrders } from '../../../../core/sales/application/list-basic-orders/list-basic-orders';
import { BasicOrderPrimitives } from '../../../../core/sales/domain/basic-order/basic-order';

type Overlay = 'none' | 'goals' | 'recipes' | 'check' | 'cooked' | 'levelup' | 'social' | 'orders' | 'store' | 'pantry';

/** Popularidad a partir de la cual llega un pedido informal. */
const INFORMAL_ORDER_THRESHOLD = 60;

/**
 * Hub de la Fase 1 (cocina en casa). Mundo 3D de fondo + overlays de vidrio
 * que conducen el flujo: elegir receta → revisar ingredientes → comprar lo que
 * falta → cocinar. Las metas y desbloqueos vienen de `progression`.
 */
@Component({
  selector: 'app-home-shell',
  imports: [Home3d, StatusBadge, GoalTracker],
  templateUrl: './home-shell.html',
  styleUrl: './home-shell.scss',
})
export class HomeShell {
  private readonly facade = inject(ProgressionFacade);
  private readonly listRecipes = inject(ListRecipes);
  private readonly listSupplies = inject(ListSupplies);
  private readonly saveRecipe = inject(SaveRecipe);
  private readonly saveSupply = inject(SaveSupply);
  private readonly check = inject(CheckIngredients);
  private readonly cook = inject(CookRecipe);
  private readonly buy = inject(BuyIngredient);
  private readonly publishProduction = inject(PublishProduction);
  private readonly getPopularity = inject(GetPopularity);
  private readonly attendInformalOrder = inject(AttendInformalOrder);
  private readonly listCustomers = inject(ListCustomers);
  private readonly saveCustomer = inject(SaveCustomer);
  private readonly placeBasicOrder = inject(PlaceBasicOrder);
  private readonly deliverBasicOrder = inject(DeliverBasicOrder);
  private readonly listBasicOrders = inject(ListBasicOrders);
  private readonly router = inject(Router);
  private readonly home3d = viewChild(Home3d);

  protected readonly overlay = signal<Overlay>('none');
  protected readonly recipes = signal<RecipePrimitives[]>([]);
  protected readonly pantry = signal<SupplyListItem[]>([]);
  protected readonly review = signal<RecipeCheck | null>(null);
  protected readonly busy = signal(false);
  protected readonly cookedName = signal('');
  protected readonly unlockedLabel = signal('');
  protected readonly popularity = signal(0);
  private readonly lastCooked = signal<{ id: string; name: string } | null>(null);

  protected readonly level = this.facade.currentLevel;
  protected readonly goals = this.facade.goals;
  protected readonly anyGoal = computed(() => this.goals().length > 0);

  /** Fase 2: redes desbloqueadas. */
  protected readonly social = computed(() => this.facade.isFeatureUnlocked(Feature.SOCIAL));
  protected readonly canPublish = computed(() => this.social() && this.lastCooked() !== null);
  protected readonly lastCookedName = computed(() => this.lastCooked()?.name ?? '');
  protected readonly informalReady = computed(() => this.social() && this.popularity() >= INFORMAL_ORDER_THRESHOLD);

  /** Fase 3: clientes y pedidos desbloqueados. */
  protected readonly ordersUnlocked = computed(() => this.facade.isFeatureUnlocked(Feature.ORDERS));
  protected readonly customers = signal<CustomerPrimitives[]>([]);
  protected readonly basicOrders = signal<BasicOrderPrimitives[]>([]);
  protected readonly newCustomerName = signal('');
  protected readonly orderCustomerId = signal('');
  protected readonly orderRecipeId = signal('');
  protected readonly orderPrice = signal(20);

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    await this.ensureSeed();
    this.recipes.set(await this.listRecipes.execute());
    await this.refreshPantry();
    await this.facade.refresh();
    await this.refreshPopularity();
  }

  private async refreshPantry(): Promise<void> {
    this.pantry.set(await this.listSupplies.execute({ type: 'ingredient' }));
  }

  private async refreshPopularity(): Promise<void> {
    this.popularity.set((await this.getPopularity.execute()).points);
  }

  /* ---------- flujo ---------- */

  protected onStation(id: string): void {
    // recipe/oven → elegir y cocinar; pantry → despensa (estado de almacenes).
    if (id === 'pantry') void this.openPantry();
    else this.openRecipes();
  }

  protected async openPantry(): Promise<void> {
    await this.refreshPantry();
    this.overlay.set('pantry');
  }

  protected openRecipes(): void {
    this.overlay.set('recipes');
  }

  protected openGoals(): void {
    this.overlay.set('goals');
  }

  protected close(): void {
    this.overlay.set('none');
  }

  protected async choose(recipe: RecipePrimitives): Promise<void> {
    this.busy.set(true);
    this.review.set(await this.check.execute({ recipeId: recipe.id }));
    this.busy.set(false);
    this.overlay.set('check');
  }

  protected async buyMissing(item: IngredientCheck): Promise<void> {
    this.busy.set(true);
    const amount = Math.max(1, Math.ceil(item.needed - item.have));
    await this.buy.execute({ supplyId: item.supplyId, quantity: amount });
    const current = this.review();
    if (current) this.review.set(await this.check.execute({ recipeId: current.recipeId, servings: current.servings }));
    await this.refreshPantry();
    await this.facade.refresh();
    this.busy.set(false);
  }

  protected async cookNow(): Promise<void> {
    const current = this.review();
    if (!current?.canCook) return;
    this.busy.set(true);
    const before = this.facade.currentLevel();
    await this.cook.execute({ recipeId: current.recipeId, servings: current.servings });
    await this.refreshPantry();
    await this.facade.refresh();
    this.busy.set(false);
    this.cookedName.set(current.recipeName);
    this.lastCooked.set({ id: current.recipeId, name: current.recipeName });

    if (this.facade.currentLevel() > before) {
      this.unlockedLabel.set('¡Desbloqueaste la siguiente etapa!');
      this.overlay.set('levelup');
    } else {
      this.overlay.set('cooked');
    }
  }

  /* ---------- Fase 2: redes ---------- */

  protected async openSocial(): Promise<void> {
    await this.refreshPopularity();
    this.overlay.set('social');
  }

  protected async publish(): Promise<void> {
    const last = this.lastCooked();
    if (!last) return;
    this.busy.set(true);
    const { points } = await this.publishProduction.execute({ recipeId: last.id, recipeName: last.name });
    this.popularity.set(points);
    await this.facade.refresh();
    this.busy.set(false);
  }

  protected async attendInformal(): Promise<void> {
    this.busy.set(true);
    await this.attendInformalOrder.execute({ recipeName: this.lastCooked()?.name ?? 'pastel' });
    await this.facade.refresh();
    this.busy.set(false);
  }

  /* ---------- Fase 3: clientes y pedidos ---------- */

  protected async openOrders(): Promise<void> {
    await this.refreshOrders();
    this.overlay.set('orders');
  }

  private async refreshOrders(): Promise<void> {
    this.customers.set(await this.listCustomers.execute());
    this.basicOrders.set(await this.listBasicOrders.execute());
  }

  protected async addCustomer(): Promise<void> {
    const name = this.newCustomerName().trim();
    if (!name) return;
    this.busy.set(true);
    const { id } = await this.saveCustomer.execute({ name });
    this.newCustomerName.set('');
    this.orderCustomerId.set(id);
    await this.facade.refresh();
    this.customers.set(await this.listCustomers.execute());
    this.busy.set(false);
  }

  protected async placeOrder(): Promise<void> {
    const customer = this.customers().find(c => c.id === this.orderCustomerId());
    const recipe = this.recipes().find(r => r.id === this.orderRecipeId());
    const price = Number(this.orderPrice());
    if (!customer || !recipe || !(price > 0)) return;
    this.busy.set(true);
    await this.placeBasicOrder.execute({
      customerId: customer.id,
      customerName: customer.name,
      recipeId: recipe.id,
      recipeName: recipe.name,
      priceSoles: price,
    });
    await this.facade.refresh();
    this.basicOrders.set(await this.listBasicOrders.execute());
    this.busy.set(false);
  }

  protected async deliverOrder(order: BasicOrderPrimitives): Promise<void> {
    const hadStore = this.facade.isFeatureUnlocked(Feature.PHYSICAL_STORE);
    this.busy.set(true);
    await this.deliverBasicOrder.execute({ orderId: order.id });
    await this.facade.refresh();
    this.basicOrders.set(await this.listBasicOrders.execute());
    this.busy.set(false);

    // Fase 4: la 5ª venta abre la tienda física → cinemática de salida al pueblo.
    if (!hadStore && this.facade.isFeatureUnlocked(Feature.PHYSICAL_STORE)) {
      this.home3d()?.flyOut();
      this.overlay.set('store');
    }
  }

  protected goToTown(): void {
    void this.router.navigate(['/town']);
  }

  /* ---------- seed (solo si la cocina está vacía) ---------- */

  private async ensureSeed(): Promise<void> {
    if ((await this.listRecipes.execute()).length > 0) return;

    const supply = (name: string, baseUnit: 'g' | 'u') =>
      this.saveSupply.execute({
        name,
        type: 'ingredient',
        baseUnit,
        presentationSize: 1,
        presentationPriceSoles: 0,
        initialStock: 0,
        minStock: 0,
      });

    const flour = (await supply('Harina', 'g')).id;
    const egg = (await supply('Huevos', 'u')).id;
    const sugar = (await supply('Azúcar', 'g')).id;

    await this.saveRecipe.execute({
      name: 'Galletas',
      baseType: 'people',
      baseServings: 1,
      ingredients: [
        { supplyId: flour, baseQuantity: 200 },
        { supplyId: egg, baseQuantity: 2 },
        { supplyId: sugar, baseQuantity: 100 },
      ],
    });
    await this.saveRecipe.execute({
      name: 'Bizcocho',
      baseType: 'people',
      baseServings: 1,
      ingredients: [
        { supplyId: flour, baseQuantity: 300 },
        { supplyId: egg, baseQuantity: 3 },
        { supplyId: sugar, baseQuantity: 150 },
      ],
    });
  }
}
