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

/** Renderiza una cara de página a textura. */
export function renderPageTexture(content: PageContent): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (ctx) {
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
        paintRecipe(ctx, content);
        break;
      case 'blank':
        break;
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
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
function paintRecipe(ctx: CanvasRenderingContext2D, content: PageContent): void {
  const marginL = W * 0.12;
  const marginR = W * 0.08;
  const right = W - marginR;
  let y = H * 0.14;

  // Título.
  ctx.fillStyle = COLOR.heading;
  ctx.font = `bold 64px ${FONT_SERIF}`;
  y = wrapText(ctx, content.title ?? '', marginL, y, right - marginL, 72, 'left');

  // Subtítulo (baseline bien por debajo del título para no solaparse).
  if (content.subtitle) {
    y += 60;
    ctx.fillStyle = MUTED;
    ctx.font = `italic 38px ${FONT_SERIF}`;
    y = wrapText(ctx, content.subtitle, marginL, y, right - marginL, 48, 'left');
  }

  // Chips.
  if (content.chips?.length) {
    y += 56;
    y = paintChips(ctx, content.chips, marginL, y, right);
  }

  // Filete de separación.
  y += 36;
  rule(ctx, marginL, y, right - marginL, COLOR.accent, 4);
  y += 48;

  // Tabla.
  if (content.columns?.length) {
    y = paintTable(ctx, content.columns, content.rows ?? [], marginL, y, right);
  }

  // Pie.
  if (content.footer) {
    ctx.fillStyle = MUTED;
    ctx.font = `italic 34px ${FONT_SERIF}`;
    ctx.textAlign = 'right';
    ctx.fillText(content.footer, right, H * 0.93);
    ctx.textAlign = 'left';
  }
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
