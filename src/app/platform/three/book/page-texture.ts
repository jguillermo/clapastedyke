import { CanvasTexture, SRGBColorSpace } from 'three';
import { PageContent } from './page-content';

/**
 * Dibuja un {@link PageContent} sobre un canvas 2D y lo devuelve como
 * {@link CanvasTexture} para mapearlo en una hoja del libro 3D.
 *
 * Estética de recetario: fondo de papel cálido, tipografía serif, una franja de
 * acento miel y una tabla rayada. Paleta tomada de los tokens Migo (los mismos
 * hex que usa `kitchen-scenery.ts`). Función pura, sin dominio.
 */

// Resolución de la cara (relación 2:3, retrato). Suficiente para leer de cerca.
const W = 1024;
const H = 1536;

// Chip de "editar" (lápiz) en la esquina superior derecha del papel. Geometría en px de canvas.
const EDIT_CHIP = { w: 76, h: 60, right: 40, top: 40 } as const;
const EDIT_CHIP_X0 = W - EDIT_CHIP.right - EDIT_CHIP.w;
const EDIT_CHIP_Y0 = EDIT_CHIP.top;

/**
 * Rect del chip de editar en espacio **UV** (0..1), ya con el eje Y invertido de `CanvasTexture`
 * (`uv.y = 1 - canvasY/H`). Lo comparte el engine para el hit-test del clic sin duplicar geometría.
 */
export const EDIT_CHIP_UV = {
  x0: EDIT_CHIP_X0 / W,
  x1: (EDIT_CHIP_X0 + EDIT_CHIP.w) / W,
  y0: 1 - (EDIT_CHIP_Y0 + EDIT_CHIP.h) / H,
  y1: 1 - EDIT_CHIP_Y0 / H,
} as const;

// Paleta Migo (hex).
const COLOR = {
  paper: '#fffbf4', // nata-tibia
  paperEdge: '#f2e7d3', // sombreado del borde interior
  ruled: '#ece0cb', // líneas de la tabla
  accent: '#e8a33d', // miel-400
  accentSoft: '#f4d9a8', // miel claro (chips)
  heading: '#4a3526', // cacao oscuro
  body: '#5a4632', // cacao
} as const;

const MUTED = '#9a886f'; // cacao apagado (subtítulos, pie)

const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// Geometría de la tabla scrollable de una receta (llena la hoja: del 30% al 90% del alto).
const ROW_H = 64;
const REGION_TOP = Math.round(H * 0.3);
const REGION_BOTTOM = Math.round(H * 0.9);

/** Zonas verticales de la tabla scrollable (compartidas por el pintado y el clamp de scroll). */
function scrollGeom(): { headerRuleY: number; clipTop: number; visibleH: number } {
  const headerRuleY = REGION_TOP + 30;
  const clipTop = headerRuleY + 6;
  return { headerRuleY, clipTop, visibleH: REGION_BOTTOM - clipTop };
}

/**
 * Máximo desplazamiento vertical (px) de la tabla de una receta scrollable: 0 si todo cabe. La
 * plataforma lo usa para acotar el scroll de la página.
 */
export function recipeScrollMax(content: PageContent): number {
  if (!content.scrollable || !content.rows?.length) {
    return 0;
  }
  return Math.max(0, content.rows.length * ROW_H - scrollGeom().visibleH);
}

/** Renderiza una cara de página a una nueva textura (con un scroll vertical opcional). */
export function renderPageTexture(content: PageContent, scroll = 0): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  paintInto(canvas, content, scroll);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/** (Re)dibuja el contenido de una cara sobre un canvas existente (para repintar al scrollear). */
export function paintInto(canvas: HTMLCanvasElement, content: PageContent, scroll = 0): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  paintPaper(ctx);
  switch (content.kind) {
    case 'cover':
      paintCover(ctx, content);
      break;
    case 'section':
      paintSection(ctx, content);
      break;
    case 'index':
    case 'recipe':
      paintRecipe(ctx, content, scroll);
      break;
    case 'blank':
      break;
  }
}

/** Fondo de papel con un leve degradado hacia el lomo. */
function paintPaper(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = COLOR.paper;
  ctx.fillRect(0, 0, W, H);
  // Sombra suave del borde interior (lomo), para dar volumen.
  const grad = ctx.createLinearGradient(0, 0, W * 0.18, 0);
  grad.addColorStop(0, COLOR.paperEdge);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W * 0.18, H);
}

/** Portada: título centrado con doble filete miel. */
function paintCover(ctx: CanvasRenderingContext2D, content: PageContent): void {
  const cx = W / 2;
  rule(ctx, W * 0.2, H * 0.32, W * 0.6, COLOR.accent, 6);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR.heading;
  ctx.font = `bold 96px ${FONT_SERIF}`;
  wrapText(ctx, content.title ?? '', cx, H * 0.46, W * 0.78, 110, 'center');
  if (content.subtitle) {
    ctx.fillStyle = MUTED;
    ctx.font = `italic 44px ${FONT_SERIF}`;
    ctx.fillText(content.subtitle, cx, H * 0.6);
  }
  rule(ctx, W * 0.2, H * 0.68, W * 0.6, COLOR.accent, 6);
  ctx.textAlign = 'left';
}

/** Página divisoria de sección: gran título y bajada. */
function paintSection(ctx: CanvasRenderingContext2D, content: PageContent): void {
  const cx = W / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR.accent;
  ctx.font = `bold 64px ${FONT_SANS}`;
  ctx.fillText((content.subtitle ?? '').toUpperCase(), cx, H * 0.42);
  ctx.fillStyle = COLOR.heading;
  ctx.font = `bold 88px ${FONT_SERIF}`;
  wrapText(ctx, content.title ?? '', cx, H * 0.52, W * 0.78, 100, 'center');
  rule(ctx, W * 0.32, H * 0.6, W * 0.36, COLOR.accentSoft, 4);
  ctx.textAlign = 'left';
}

/** Página de receta / índice: título, chips, tabla rayada y pie. */
function paintRecipe(ctx: CanvasRenderingContext2D, content: PageContent, scroll = 0): void {
  const marginL = W * 0.12;
  const marginR = W * 0.08;
  const right = W - marginR;
  let y = H * 0.14;

  // Título (fijo).
  ctx.fillStyle = COLOR.heading;
  ctx.font = `bold 64px ${FONT_SERIF}`;
  y = wrapText(ctx, content.title ?? '', marginL, y, right - marginL, 72, 'left');

  if (content.scrollable && content.columns?.length) {
    // Receta: la tabla llena la hoja (región fija) y scrollea; cabecera fija, filas desplazables.
    paintScrollTable(ctx, content.columns, content.rows ?? [], marginL, right, scroll);
  } else {
    // Insumos / otros: flujo clásico (subtítulo, chips, filete y tabla top-aligned, paginada).
    if (content.subtitle) {
      y += 60;
      ctx.fillStyle = MUTED;
      ctx.font = `italic 38px ${FONT_SERIF}`;
      y = wrapText(ctx, content.subtitle, marginL, y, right - marginL, 48, 'left');
    }
    if (content.chips?.length) {
      y += 56;
      y = paintChips(ctx, content.chips, marginL, y, right);
    }
    y += 36;
    rule(ctx, marginL, y, right - marginL, COLOR.accent, 4);
    y += 48;
    if (content.columns?.length) {
      paintTable(ctx, content.columns, content.rows ?? [], marginL, y, right);
    }
  }

  // Pie (fijo).
  if (content.footer) {
    ctx.fillStyle = MUTED;
    ctx.font = `italic 34px ${FONT_SERIF}`;
    ctx.textAlign = 'right';
    ctx.fillText(content.footer, right, H * 0.93);
    ctx.textAlign = 'left';
  }

  // Chip de editar (lápiz) sobre el papel, esquina superior derecha (fijo).
  if (content.editable) {
    paintEditChip(ctx);
  }
}

/**
 * Tabla de receta que **llena la hoja** (región fija `REGION_TOP`..`REGION_BOTTOM`): cabecera fija
 * arriba, filas desplazables por `scroll` (recortadas a la región) y filete tipo cuaderno que
 * rellena el alto aunque haya pocos insumos. Chevrons ▲/▼ indican que hay más.
 */
function paintScrollTable(
  ctx: CanvasRenderingContext2D,
  columns: string[],
  rows: { cells: string[] }[],
  x: number,
  right: number,
  scroll: number,
): void {
  const { headerRuleY, clipTop, visibleH } = scrollGeom();

  // Filete de acento sobre la cabecera + cabecera (fijos).
  rule(ctx, x, REGION_TOP - 24, right - x, COLOR.accent, 4);
  paintTableHeader(ctx, columns, x, REGION_TOP + 8, right);
  rule(ctx, x, headerRuleY, right - x, COLOR.ruled, 2);

  const contentH = rows.length * ROW_H;
  const max = Math.max(0, contentH - visibleH);
  const clamped = Math.min(Math.max(scroll, 0), max);
  const fillToY = clipTop + Math.max(contentH, visibleH);

  // Filas desplazables, recortadas a la región visible.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, clipTop, W, visibleH);
  ctx.clip();
  ctx.translate(0, -clamped);
  paintTableRows(ctx, columns, rows, x, clipTop, right, fillToY);
  ctx.restore();

  // Indicadores (fijos): hay más arriba / abajo.
  if (clamped > 0.5) {
    drawChevron(ctx, W / 2, clipTop + 26, 'up');
  }
  if (clamped < max - 0.5) {
    drawChevron(ctx, W / 2, REGION_BOTTOM - 26, 'down');
  }
}

/** Cabecera de la tabla (INSUMO … CANTIDAD), alineada como `paintTable`. */
function paintTableHeader(
  ctx: CanvasRenderingContext2D,
  columns: string[],
  x: number,
  y: number,
  right: number,
): void {
  const anchors = columnAnchors(columns.length, x, right);
  ctx.fillStyle = MUTED;
  ctx.font = `bold 30px ${FONT_SANS}`;
  ctx.fillText(columns[0]?.toUpperCase() ?? '', x, y);
  ctx.textAlign = 'right';
  for (let c = 1; c < columns.length; c++) {
    ctx.fillText(columns[c].toUpperCase(), anchors[c], y);
  }
  ctx.textAlign = 'left';
}

/**
 * Filas en "slots" de alto `ROW_H`: las primeras llevan texto; el resto quedan como renglones
 * rayados vacíos hasta `fillToY` (relleno de cuaderno) para que la hoja se vea llena.
 */
function paintTableRows(
  ctx: CanvasRenderingContext2D,
  columns: string[],
  rows: { cells: string[] }[],
  x: number,
  top: number,
  right: number,
  fillToY: number,
): void {
  const w = right - x;
  const anchors = columnAnchors(columns.length, x, right);
  const nameMax = columns.length > 2 ? anchors[1] - x - w * 0.2 : right - x - 24;
  const slots = Math.max(rows.length, Math.ceil((fillToY - top) / ROW_H));

  for (let i = 0; i < slots; i++) {
    const slotTop = top + i * ROW_H;
    const baseline = slotTop + ROW_H * 0.62;
    const row = rows[i];
    if (row) {
      ctx.fillStyle = COLOR.body;
      ctx.font = `40px ${FONT_SERIF}`;
      ctx.fillText(ellipsize(ctx, row.cells[0] ?? '', nameMax), x, baseline);
      ctx.textAlign = 'right';
      for (let c = 1; c < columns.length; c++) {
        const last = c === columns.length - 1;
        const cell = row.cells[c] ?? '';
        const price = last ? /^S\/\s*(.+)$/.exec(cell) : null;
        if (price) {
          drawPrice(ctx, price[1], anchors[c], baseline);
        } else {
          ctx.fillStyle = last ? COLOR.heading : COLOR.body;
          ctx.font = `${last ? 'bold ' : ''}40px ${FONT_SERIF}`;
          ctx.fillText(cell, anchors[c], baseline);
        }
      }
      ctx.textAlign = 'left';
    }
    rule(ctx, x, slotTop + ROW_H, right - x, COLOR.ruled, 1);
  }
}

/** Chevron (triángulo) que indica que hay más contenido hacia arriba/abajo. */
function drawChevron(ctx: CanvasRenderingContext2D, cx: number, cy: number, dir: 'up' | 'down'): void {
  const s = 16;
  const dy = dir === 'up' ? -1 : 1;
  ctx.fillStyle = MUTED;
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - (s / 2) * dy);
  ctx.lineTo(cx + s, cy - (s / 2) * dy);
  ctx.lineTo(cx, cy + (s / 2) * dy);
  ctx.closePath();
  ctx.fill();
}

// Icono "editar" de Material Design (viewBox 24×24). Copiado como dato de ruta para que la
// plataforma sea autónoma (no importa del layer `components/`, prohibido por capas).
const EDIT_ICON_PATH =
  'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z';

/** Dibuja el chip de editar: botón ghost (fondo = papel, solo borde) con el icono de Material. */
function paintEditChip(ctx: CanvasRenderingContext2D): void {
  const { w, h } = EDIT_CHIP;
  const x = EDIT_CHIP_X0;
  const y = EDIT_CHIP_Y0;

  // Ghost: fondo igual al papel (se funde con la hoja), solo el borde define el botón.
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = COLOR.paper;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLOR.accent;
  ctx.stroke();

  // Icono Material (24×24) escalado y centrado en la píldora.
  const iconSize = 36;
  const scale = iconSize / 24;
  ctx.save();
  ctx.translate(x + (w - iconSize) / 2, y + (h - iconSize) / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = COLOR.heading;
  ctx.fill(new Path2D(EDIT_ICON_PATH));
  ctx.restore();
}

/** Dibuja chips tipo etiqueta, devolviendo la `y` siguiente. */
function paintChips(
  ctx: CanvasRenderingContext2D,
  chips: string[],
  x: number,
  y: number,
  right: number,
): number {
  ctx.font = `34px ${FONT_SANS}`;
  const padX = 22;
  const h = 56;
  const gap = 16;
  let cx = x;
  let cy = y;
  for (const chip of chips) {
    const w = ctx.measureText(chip).width + padX * 2;
    if (cx + w > right) {
      cx = x;
      cy += h + gap;
    }
    roundRect(ctx, cx, cy, w, h, 28);
    ctx.fillStyle = COLOR.accentSoft;
    ctx.fill();
    ctx.fillStyle = COLOR.heading;
    ctx.textBaseline = 'middle';
    ctx.fillText(chip, cx + padX, cy + h / 2 + 2);
    ctx.textBaseline = 'alphabetic';
    cx += w + gap;
  }
  return cy + h;
}

/**
 * Dibuja una tabla rayada (cabecera + filas), devolviendo la `y` siguiente.
 *
 * Maquetación tipo "celdas invisibles": la 1ª columna va a la izquierda (nombre);
 * las demás se alinean a la derecha sobre **anclas equiespaciadas** para que queden
 * bien separadas (p. ej. Insumo · Cantidad · Precio), no apretadas al borde.
 */
function paintTable(
  ctx: CanvasRenderingContext2D,
  columns: string[],
  rows: { cells: string[] }[],
  x: number,
  y: number,
  right: number,
): number {
  const rowH = 64;
  const w = right - x;
  const anchors = columnAnchors(columns.length, x, right);
  // El nombre (col 0) no invade la 2ª columna: deja aire antes de su zona.
  const nameMax = columns.length > 2 ? anchors[1] - x - w * 0.2 : right - x - 24;

  // Cabecera.
  ctx.fillStyle = MUTED;
  ctx.font = `bold 30px ${FONT_SANS}`;
  ctx.fillText(columns[0]?.toUpperCase() ?? '', x, y);
  ctx.textAlign = 'right';
  for (let c = 1; c < columns.length; c++) {
    ctx.fillText(columns[c].toUpperCase(), anchors[c], y);
  }
  ctx.textAlign = 'left';
  y += 20;
  rule(ctx, x, y, right - x, COLOR.ruled, 2);
  y += rowH * 0.55;

  // Filas.
  for (const row of rows) {
    ctx.fillStyle = COLOR.body;
    ctx.font = `40px ${FONT_SERIF}`;
    ctx.fillText(ellipsize(ctx, row.cells[0] ?? '', nameMax), x, y);
    ctx.textAlign = 'right';
    for (let c = 1; c < columns.length; c++) {
      const last = c === columns.length - 1;
      const cell = row.cells[c] ?? '';
      const price = last ? /^S\/\s*(.+)$/.exec(cell) : null;
      if (price) {
        drawPrice(ctx, price[1], anchors[c], y);
      } else {
        // Columna del medio (cantidad): normal; última no-precio: en negrita.
        ctx.fillStyle = last ? COLOR.heading : COLOR.body;
        ctx.font = `${last ? 'bold ' : ''}40px ${FONT_SERIF}`;
        ctx.fillText(cell, anchors[c], y);
      }
    }
    ctx.textAlign = 'left';
    y += rowH * 0.4;
    rule(ctx, x, y, right - x, COLOR.ruled, 1);
    y += rowH * 0.6;
  }
  return y;
}

/**
 * Anclas X (alineadas a la derecha) por columna. La 0 es la izquierda (`x`).
 * Con 3 columnas, cantidad y precio se **agrupan a la derecha** (no repartidas a
 * lo ancho) para que se lean juntas y el nombre tenga espacio. `ctx` right-align
 * + precio a 2 decimales hace que los puntos decimales queden al mismo nivel.
 */
function columnAnchors(count: number, x: number, right: number): number[] {
  const w = right - x;
  if (count <= 2) {
    return [x, right];
  }
  if (count === 3) {
    return [x, x + w * 0.74, right];
  }
  const anchors = [x];
  for (let c = 1; c < count; c++) {
    anchors.push(x + (w * c) / (count - 1));
  }
  return anchors;
}

/**
 * Dibuja un precio right-aligned: el **monto** en serif negrita (color cabecera)
 * y el símbolo `S/` más fino, pequeño y apagado a su izquierda, para que no se
 * sature. Asume `ctx.textAlign = 'right'`.
 */
function drawPrice(ctx: CanvasRenderingContext2D, amount: string, anchorRight: number, y: number): void {
  ctx.fillStyle = COLOR.heading;
  ctx.font = `bold 40px ${FONT_SERIF}`;
  ctx.fillText(amount, anchorRight, y);
  const amountW = ctx.measureText(amount).width;
  ctx.fillStyle = MUTED;
  ctx.font = `300 28px ${FONT_SANS}`;
  ctx.fillText('S/', anchorRight - amountW - 12, y);
}

// ---------- utilidades de dibujo ----------

/** Filete horizontal. */
function rule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
  thickness: number,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, thickness);
}

/** Rectángulo redondeado (path; el caller hace fill/stroke). */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Escribe texto con ajuste de línea; devuelve la `y` tras la última línea. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center',
): number {
  const words = text.split(/\s+/);
  let line = '';
  let cy = y;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = align;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cy);
  }
  ctx.textAlign = prevAlign;
  return cy;
}

/** Trunca con "…" si excede el ancho. */
function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}
