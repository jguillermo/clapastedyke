/**
 * Modelo PLANO y AGNÓSTICO de una página del libro 3D.
 *
 * La plataforma (`platform/three/book/*`) sabe DIBUJAR este modelo sobre una
 * textura de papel, pero no conoce nada del dominio: el feature proyecta su
 * catálogo (recetas, insumos…) a un `PageContent[]` y se lo pasa al motor. Así
 * `platform/` no importa de `core/` ni de `features/` (regla de capas).
 */

/** Una fila de tabla en la página (p. ej. una línea de insumo). */
export interface PageRow {
  /** Celdas en el orden de `PageContent.columns`. */
  readonly cells: string[];
}

/** Tipo de página: decide el layout que dibuja `renderPageTexture`. */
export type PageKind = 'cover' | 'section' | 'index' | 'recipe' | 'blank';

/** Contenido de UNA cara de página, listo para pintar. Texto ya formateado. */
export interface PageContent {
  readonly kind: PageKind;
  /**
   * Etiqueta opaca de sección a la que pertenece la página (la fija y la lee el
   * feature; la plataforma no la interpreta). Permite al HUD saber qué editar.
   */
  readonly section?: string;
  /** Título principal (portada, sección, nombre de receta…). */
  readonly title?: string;
  /** Subtítulo / bajada (autor, tipo de sección, sabor…). */
  readonly subtitle?: string;
  /** Etiquetas cortas (peso, porciones, uso…). */
  readonly chips?: string[];
  /** Cabecera de la tabla (p. ej. `['Insumo', 'Cantidad']`). */
  readonly columns?: string[];
  /** Filas de la tabla (líneas de la receta). */
  readonly rows?: PageRow[];
  /** Pie de página (numeración, totales, nota). */
  readonly footer?: string;
  /**
   * `true` si esta cara **continúa** la anterior (la tabla no cabía en una hoja).
   * El feature la marca para no duplicarla en el índice; la plataforma no la usa.
   */
  readonly continued?: boolean;
}
