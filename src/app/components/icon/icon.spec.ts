import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';
import { ICON_PATHS } from './icon.registry';

describe('Icon', () => {
  function setup() {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'mat:check');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg') as SVGElement;
    return { fixture, host, svg };
  }

  it('renders the SVG path from the registry for the given name', () => {
    const { svg } = setup();
    const path = svg.querySelector('path') as SVGPathElement;
    expect(path.getAttribute('d')).toBe(ICON_PATHS['mat:check']);
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('currentColor');
  });

  it('maps size and color inputs to theme utility classes on the svg', () => {
    const { fixture, svg } = setup();
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('color', 'brand');
    fixture.detectChanges();
    expect(svg.classList).toContain('size-6');
    expect(svg.classList).toContain('text-brand');
  });

  it('defaults to md size and inherited color (no text-* utility)', () => {
    const { svg } = setup();
    expect(svg.classList).toContain('size-5');
    expect(svg.className.baseVal).not.toContain('text-');
  });

  it('is decorative by default and labelled when ariaLabel is set', () => {
    const { fixture, host } = setup();
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('role')).toBeNull();

    fixture.componentRef.setInput('ariaLabel', 'Hecho');
    fixture.detectChanges();
    expect(host.getAttribute('role')).toBe('img');
    expect(host.getAttribute('aria-label')).toBe('Hecho');
    expect(host.getAttribute('aria-hidden')).toBeNull();
  });
});
