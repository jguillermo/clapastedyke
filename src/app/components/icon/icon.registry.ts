/**
 * Registro de iconos del design system Migo.
 *
 * ## Prefijos de librería
 * - `mat:<name>` — Material Design Icons (Filled, viewBox 0 0 24 24, single-path).
 *   Fuente: `npm install -D @material-design-icons/svg`
 *   SVGs en `node_modules/@material-design-icons/svg/filled/<name>.svg`.
 *   El nombre original de Material usa snake_case (`expand_more`, `arrow_back`).
 * - `custom:<name>` — Iconos propios sin librería externa.
 *
 * ## Cómo añadir un icono de una librería existente
 * 1. Instalar la librería en dev: `npm install -D @material-design-icons/svg`
 * 2. Abrir el SVG en `node_modules/…` y copiar el atributo `d` del `<path>`.
 * 3. Añadir el nombre al sub-tipo (`MatIconName`, etc.) y el `d` a `ICON_PATHS`.
 * 4. Añadir un comentario inline: `// mat · <nombre original>`
 *
 * ## Cómo añadir iconos de una librería nueva
 * 1. `npm install -D <paquete>` — solo dev, no llega al bundle de producción.
 * 2. Definir un nuevo sub-tipo (p.ej. `PhIconName` para Phosphor) y documentar
 *    la fuente y la ruta de los SVGs en este bloque de cabecera.
 * 3. Ampliar `IconName` con la unión del nuevo sub-tipo.
 *
 * ## Iconos propios
 * Añadir el nombre al sub-tipo `CustomIconName` y el path a `ICON_PATHS`.
 * Comentar que es un icono propio: `// custom · descripción`
 *
 * ## No aplica a imágenes SVG
 * Esta convención es exclusivamente para **iconos** (glifos inline de la UI).
 * Las imágenes SVG (logos, ilustraciones, fondos) van en `src/assets/images/`
 * y se cargan con `<img>` / `NgOptimizedImage`, no con `<migo-icon>`.
 */

// Material Design — Filled
// Fuente: @material-design-icons/svg · https://github.com/marella/material-design-icons
export type MatIconName =
  | 'mat:check'
  | 'mat:close'
  | 'mat:expand_more'
  | 'mat:expand_less'
  | 'mat:chevron_right'
  | 'mat:warning'
  | 'mat:error'
  | 'mat:info'
  | 'mat:home'
  | 'mat:add'
  | 'mat:search'
  | 'mat:settings'
  | 'mat:arrow_back'
  | 'mat:layers'
  | 'mat:edit';

// Iconos propios sin librería externa
export type CustomIconName = never; // añadir: | 'custom:nombre'

export type IconName = MatIconName | CustomIconName;

export const ICON_PATHS: Record<IconName, string> = {
  'mat:check': 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z', // mat · check
  'mat:close':
    'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z', // mat · close
  'mat:expand_more': 'M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z', // mat · expand_more
  'mat:expand_less': 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z', // mat · expand_less
  'mat:chevron_right': 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z', // mat · chevron_right
  'mat:warning': 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z', // mat · warning
  'mat:error':
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z', // mat · error
  'mat:info':
    'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z', // mat · info
  'mat:home': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', // mat · home
  'mat:add': 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z', // mat · add
  'mat:search':
    'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z', // mat · search
  'mat:settings':
    'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z', // mat · settings
  'mat:arrow_back': 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z', // mat · arrow_back
  'mat:layers':
    'M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z', // mat · layers
  'mat:edit':
    'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z', // mat · edit
};
