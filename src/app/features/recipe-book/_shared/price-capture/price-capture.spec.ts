import { TestBed } from '@angular/core/testing';
import type { FormControl, FormGroup } from '@angular/forms';
import type { UnitToken } from '@components/unit-input/unit-input';
import { PriceCapture, type PurchaseValue } from './price-capture';

type Kind = 'count' | 'mass' | 'any';

interface PriceCaptureInternals {
  form: FormGroup<{ presentation: FormControl<string>; price: FormControl<string> }>;
  setUnit(token: UnitToken): void;
  confirmPrice(): void;
}

describe('PriceCapture', () => {
  function setup(kind: Kind, initial: PurchaseValue | null = null) {
    TestBed.configureTestingModule({ imports: [PriceCapture] });
    const fixture = TestBed.createComponent(PriceCapture);
    fixture.componentRef.setInput('name', 'Ingrediente');
    fixture.componentRef.setInput('kind', kind);
    if (initial) {
      fixture.componentRef.setInput('initial', initial);
    }
    fixture.detectChanges();

    const internals = fixture.componentInstance as unknown as PriceCaptureInternals;
    let emitted: PurchaseValue | null = null;
    fixture.componentInstance.confirmed.subscribe((value) => (emitted = value));

    const fill = (presentation: string, price: string) => {
      internals.form.controls.presentation.setValue(presentation);
      internals.form.controls.price.setValue(price);
    };
    const confirm = (): PurchaseValue | null => {
      internals.confirmPrice();
      return emitted;
    };
    return { internals, fill, confirm };
  }

  it('count → la presentación queda fijada en unidades (teclear g/k no cambia la familia)', () => {
    const { internals, fill, confirm } = setup('count');
    fill('30', '12');
    internals.setUnit('g'); // ignorado en conteo
    internals.setUnit('k'); // ignorado en conteo

    expect(confirm()).toEqual({ amount: 12, per: { value: 30, unit: 'u' }, currency: 'PEN' });
  });

  it('mass → alterna kg↔g (factor 1000, base g) e ignora u', () => {
    const { internals, fill, confirm } = setup('mass');
    fill('1', '5');
    // 1 < 10 ⇒ kg ⇒ 1000 g
    expect(confirm()).toEqual({ amount: 5, per: { value: 1000, unit: 'g' }, currency: 'PEN' });

    internals.setUnit('g'); // ahora gramos ⇒ 1 g
    expect(confirm()).toEqual({ amount: 5, per: { value: 1, unit: 'g' }, currency: 'PEN' });

    internals.setUnit('u'); // se ignora en masa ⇒ sigue en g
    expect(confirm()).toEqual({ amount: 5, per: { value: 1, unit: 'g' }, currency: 'PEN' });
  });

  it('any (sin cantidad aún) → el usuario elige la familia libremente', () => {
    const { internals, fill, confirm } = setup('any');
    fill('30', '12');
    internals.setUnit('u');

    expect(confirm()).toEqual({ amount: 12, per: { value: 30, unit: 'u' }, currency: 'PEN' });
  });

  it('precarga la presentación y el precio al editar un precio existente', () => {
    const { internals } = setup('mass', { amount: 5, per: { value: 1000, unit: 'g' }, currency: 'PEN' });
    expect(internals.form.controls.presentation.value).toBe('1'); // 1000 g ⇒ 1 kg
    expect(internals.form.controls.price.value).toBe('5');
  });
});
