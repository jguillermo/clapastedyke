/** Tipos del juego-tutorial. El contenido vive en `contenido.ts`. */

export type Dificultad = 'basico' | 'intermedio' | 'avanzado';

/** Cómo se dibuja la escena SVG instructiva de un paso. */
export type EscenaTipo = 'menu' | 'formulario' | 'hoja' | 'lista' | 'intro';

export interface CampoSvg {
  etiqueta: string;
  tipo: 'texto' | 'select' | 'numero' | 'check';
  valor?: string;
  /** El cursor animado viaja a este campo y lo resalta. */
  resaltado?: boolean;
}

export interface EscenaSvg {
  tipo: EscenaTipo;
  /** Camino de menú a recorrer, p.ej. ['Sistema', 'Mantenimiento', 'Instalar o reparar (todo)']. */
  ruta?: string[];
  /** Título del formulario modal (tipo 'formulario') o de la lista (tipo 'lista'). */
  titulo?: string;
  campos?: CampoSvg[];
  /** Pestañas visibles de la hoja de cálculo (tipo 'hoja'); la primera se resalta. */
  pestanas?: string[];
  /** Aviso emergente que muestra la hoja (tipo 'hoja'), p.ej. 'Listo: 14 hojas'. */
  aviso?: string;
  /** Qué botón del pie resaltar en un formulario: 'guardar' | 'cancelar'. */
  boton?: 'guardar' | 'cancelar';
}

/** Un reto: una sola acción que el usuario hace en el software real. */
export interface Paso {
  /** Estable; se persiste en localStorage. Formato `f01-1`. */
  id: string;
  titulo: string;
  /** Qué hacer AHORA, una sola acción. Admite <span class="tag"> para botones del sistema. */
  instruccion: string;
  /** Contexto adicional (el "det" del manual). */
  detalle?: string;
  /** Se muestra al completar: qué acaba de pasar en el sistema. */
  quePasa?: string;
  pista?: string;
  escena: EscenaSvg;
}

/** Una misión = un flujo del manual (f01..f13). */
export interface Mision {
  /** Coincide con el id del flujo en el manual (ancla `Manual_de_usuario.html#f01`). */
  id: string;
  titulo: string;
  /** Para qué sirve este flujo, en una frase. */
  paraQue: string;
  pasos: Paso[];
}

export interface Nivel {
  id: Dificultad;
  titulo: string;
  /** Frase corta que presenta el nivel en el mapa. */
  lema: string;
  orden: number;
  misiones: Mision[];
}
