import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Marks our OWN static SVG icon strings (svg/icons.ts) as trusted so
 * [innerHTML] keeps their strokes — Angular's sanitizer would strip them.
 * Never use it on user-provided content.
 */
@Pipe({ name: 'safeSvg' })
export class SafeSvgPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
