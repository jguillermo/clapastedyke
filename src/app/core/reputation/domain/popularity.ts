import { AggregateRoot } from '../../_common/domain/aggregate';
import { domainEvent } from '../../_common/domain/domain-event';

export const POPULARITY_ID = 'POPULARITY';

export interface PopularityPrimitives {
  id: string;
  points: number;
}

/**
 * Popularidad (singleton): puntos acumulados de visibilidad en redes.
 * `award` suma y emite PopularityUpdated con el total (la progresión lo guarda
 * como máximo). Fuente: .claude/doc/plan_de_negocio.md (reputation).
 */
export class Popularity extends AggregateRoot {
  private constructor(private _points: number) {
    super();
  }

  static start(): Popularity {
    return new Popularity(0);
  }

  static fromPrimitives(p: PopularityPrimitives): Popularity {
    return new Popularity(p.points);
  }

  award(points: number): void {
    if (!(points > 0)) return;
    this._points += points;
    this.recordEvent(domainEvent('PopularityUpdated', POPULARITY_ID, { points: this._points }));
  }

  get points(): number {
    return this._points;
  }

  toPrimitives(): PopularityPrimitives {
    return { id: POPULARITY_ID, points: this._points };
  }
}
