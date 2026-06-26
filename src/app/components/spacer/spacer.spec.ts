import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Spacer, SpacerSize } from './spacer';

@Component({
  imports: [Spacer],
  template: `<migo-spacer [size]="size()" [hideOnMobile]="hideOnMobile()" />`,
})
class Host {
  readonly size = signal<SpacerSize>('md');
  readonly hideOnMobile = signal(false);
}

describe('Spacer', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const spacer = fixture.nativeElement.querySelector('migo-spacer') as HTMLElement;
    return { fixture, spacer };
  }

  it('is an inline-block box with the default md width and is decorative', () => {
    const { spacer } = setup();
    expect(spacer.classList).toContain('inline-block');
    expect(spacer.classList).toContain('w-2');
    expect(spacer.classList).toContain('shrink-0');
    expect(spacer.getAttribute('aria-hidden')).toBe('true');
  });

  it('maps size to the theme width token', () => {
    const { fixture, spacer } = setup();
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect(spacer.classList).toContain('w-3');
    expect(spacer.classList).not.toContain('w-2');
  });

  it('hides on mobile and shows from sm when hideOnMobile is set', () => {
    const { fixture, spacer } = setup();
    fixture.componentInstance.hideOnMobile.set(true);
    fixture.detectChanges();
    expect(spacer.classList).toContain('hidden');
    expect(spacer.classList).toContain('sm:inline-block');
    expect(spacer.classList).not.toContain('inline-block');
  });
});
