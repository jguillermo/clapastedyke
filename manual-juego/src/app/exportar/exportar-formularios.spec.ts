import { TestBed } from '@angular/core/testing';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FORMULARIOS } from '../formularios/registro-formularios';
import { ensamblarHtml, limpiarMarkup } from './ensamblador';

/**
 * Export de formularios: renderiza cada componente con TestBed (jsdom),
 * limpia el markup y escribe el HTML autónomo en ../src/XForm.html.
 *
 * Solo corre con EXPORTAR_FORMULARIOS=1 (lo lanza `npm run exportar:formularios`);
 * en `ng test` normal queda en skip para no escribir archivos.
 * Requiere tmp/export.css generado antes por la CLI de Tailwind.
 */

const EXPORTAR = process.env['EXPORTAR_FORMULARIOS'] === '1';
const RAIZ = resolve(process.cwd()); // manual-juego/
const GAS = join(RAIZ, 'gas');
const DESTINO = resolve(RAIZ, '..', 'src');

function leer(ruta: string): string {
  return readFileSync(ruta, 'utf8');
}

function leerOpcional(ruta: string): string {
  return existsSync(ruta) ? leer(ruta) : '';
}

describe('export de formularios a src/', () => {
  it.runIf(EXPORTAR)('genera los HTML autónomos', async () => {
    const css = leer(join(RAIZ, 'tmp', 'export.css'));
    const fxBootstrap = leer(join(GAS, 'fx-bootstrap.js'));
    const sHelper = leer(join(GAS, 's-helper.js'));
    const shim = leer(join(GAS, 'shim-preview.js'));
    mkdirSync(DESTINO, { recursive: true });

    for (const def of FORMULARIOS) {
      const fixture = TestBed.createComponent(def.componente);
      fixture.detectChanges();
      await fixture.whenStable();

      const markup = limpiarMarkup((fixture.nativeElement as HTMLElement).innerHTML);

      // El markup ya no debe tener rastros de Angular
      expect(markup).not.toMatch(/<app-|ng-reflect|_ngcontent|_nghost|ng-version|data-onclick/);
      expect(markup).toContain('class="dlg-head"');

      const html = ensamblarHtml({
        archivoGas: def.archivoGas,
        markup,
        css,
        cssPropio: leerOpcional(join(GAS, 'estilos', `${def.archivoGas}.css`)),
        fxBootstrap,
        sHelper,
        shim,
        logica: leer(join(GAS, 'logica', `${def.archivoGas}.js`)),
      });

      writeFileSync(join(DESTINO, `${def.archivoGas}.html`), html, 'utf8');
      TestBed.resetTestingModule();
    }
  });

  // Verificación sin efectos (corre siempre): el render queda limpio de Angular.
  it('el markup renderizado queda limpio de rastros de Angular', async () => {
    const def = FORMULARIOS[0];
    const fixture = TestBed.createComponent(def.componente);
    fixture.detectChanges();
    await fixture.whenStable();
    const markup = limpiarMarkup((fixture.nativeElement as HTMLElement).innerHTML);

    expect(markup).not.toMatch(/<app-|ng-reflect|_ngcontent|_nghost|ng-version|data-onclick/);
    expect(markup).toContain('class="dlg-head"');
    expect(markup).toContain('onclick="S.cerrar()"');
    expect(markup).toContain('id="flash"');
  });
});
