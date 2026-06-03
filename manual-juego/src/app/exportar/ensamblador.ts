/**
 * Ensamblador del export: convierte el innerHTML renderizado de un componente
 * de formulario en el HTML autónomo final que se escribe en src/XForm.html.
 * Sin dependencias de Angular: funciones puras de texto.
 */

/** Limpia los rastros de Angular del markup renderizado. */
export function limpiarMarkup(html: string): string {
  return (
    html
      // Comentarios (anclas de bindings de Angular y comentarios propios)
      .replace(/<!--[\s\S]*?-->/g, '')
      // Etiquetas de componentes (app-*): se quitan conservando su contenido
      .replace(/<\/?app-[\w-]+[^>]*>/g, '')
      // Atributos de Angular en modo dev / encapsulación
      .replace(/\s+ng-reflect-[\w-]+="[^"]*"/g, '')
      .replace(/\s+ng-version="[^"]*"/g, '')
      .replace(/\s+_ng(host|content)-[\w-]+(="[^"]*")?/g, '')
      // data-onclick / data-oninput / data-onchange → atributos on* reales
      .replace(/\bdata-on([a-z]+)=/g, 'on$1=')
      // Líneas en blanco sobrantes
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

export interface PiezasExport {
  /** Nombre del archivo GAS (sin .html), para la cabecera. */
  archivoGas: string;
  /** Markup ya limpio del cuerpo del formulario. */
  markup: string;
  /** CSS Tailwind compilado (tmp/export.css). */
  css: string;
  /** CSS específico del formulario (gas/estilos/XForm.css) o ''. */
  cssPropio: string;
  /** gas/fx-bootstrap.js (va en <head>, síncrono). */
  fxBootstrap: string;
  /** gas/s-helper.js (objeto S). */
  sHelper: string;
  /** gas/shim-preview.js (inerte en GAS real). */
  shim: string;
  /** gas/logica/XForm.js (lógica propia del formulario). */
  logica: string;
}

/** Arma el HTML autónomo final (sin ninguna dependencia externa salvo fonts). */
export function ensamblarHtml(p: PiezasExport): string {
  return `<!-- ARCHIVO GENERADO por manual-juego (npm run exportar:formularios) — NO EDITAR A MANO.
     Fuente visual: manual-juego/src/app/formularios/ · Lógica: manual-juego/gas/logica/${p.archivoGas}.js -->
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<base target="_top">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Figtree:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=optional" rel="stylesheet">
<style>
${p.css}
${p.cssPropio ? '\n/* --- estilos propios de ' + p.archivoGas + ' --- */\n' + p.cssPropio : ''}
</style>
<script>
${p.fxBootstrap}
</script>
</head>
<body class="gas-form">

${p.markup}

<script>
${p.sHelper}
</script>
<script>
${p.shim}
</script>
<script>
${p.logica}
</script>
</body>
</html>
`;
}
