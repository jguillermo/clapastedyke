import { EntityId } from '../../../_common/entity-id';
import { SupplyLine } from '../value-objects/supply-line';

interface RecipeData {
  id: EntityId;
  categoryId: EntityId;
  name: string;
  lines: SupplyLine[];
  flavorId: EntityId | null;
  portionsCapacityId: EntityId | null;
  moldCapacityId: EntityId | null;
}

/**
 * Una RECETA. Pertenece a una categoría (por id) y siempre tiene título y al menos
 * una línea de insumo. Puede tener un sabor y, independientemente, una capacidad por
 * porciones y/o una por molde (ambas opcionales y coexisten — son dos dimensiones
 * de tamaño distintas, no una sola elección). Aggregate root; las líneas se
 * modifican solo a través de la raíz.
 */
export class Recipe {
  readonly id: EntityId; // Nivel 1: identidad única de la receta
  readonly categoryId: EntityId; // Nivel 2: categoría a la que pertenece (id de otra raíz del contexto)
  readonly name: string; // Nivel 1: título de la receta
  readonly lines: readonly SupplyLine[]; // Nivel 3: líneas de insumo; solo se modifican vía la raíz
  readonly flavorId: EntityId | null; // Nivel 2: sabor de la receta (id de otra raíz del contexto), opcional
  readonly portionsCapacityId: EntityId | null; // Nivel 2: capacidad por porciones (id de otra raíz del contexto), opcional
  readonly moldCapacityId: EntityId | null; // Nivel 2: capacidad por molde (id de otra raíz del contexto), opcional

  private constructor(data: RecipeData) {
    this.id = data.id;
    this.categoryId = data.categoryId;
    this.name = data.name;
    this.lines = data.lines;
    this.flavorId = data.flavorId;
    this.portionsCapacityId = data.portionsCapacityId;
    this.moldCapacityId = data.moldCapacityId;
  }

  static create(
    id: EntityId,
    categoryId: EntityId,
    name: string,
    lines: SupplyLine[],
    flavorId: EntityId | null = null,
    portionsCapacityId: EntityId | null = null,
    moldCapacityId: EntityId | null = null,
  ): Recipe {
    if (!name.trim()) {
      throw new Error('Recipe name is required');
    }
    if (lines.length === 0) {
      throw new Error('Recipe needs at least one supply line');
    }
    return new Recipe({
      id,
      categoryId,
      name: name.trim(),
      lines: [...lines],
      flavorId,
      portionsCapacityId,
      moldCapacityId,
    });
  }

  addLine(line: SupplyLine): Recipe {
    return this.with({ lines: [...this.lines, line] });
  }

  equals(other: Recipe): boolean {
    return this.id.equals(other.id);
  }

  private with(changes: Partial<RecipeData>): Recipe {
    return new Recipe({
      id: this.id,
      categoryId: this.categoryId,
      name: this.name,
      lines: [...this.lines],
      flavorId: this.flavorId,
      portionsCapacityId: this.portionsCapacityId,
      moldCapacityId: this.moldCapacityId,
      ...changes,
    });
  }
}
