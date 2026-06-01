Construye una web de una sola página (HTML + CSS + JavaScript, sin frameworks y sin
imágenes — solo SVG inline) con animaciones fluidas estilo Apple/corporativo.
Tema/contenido: ‹describe tu contenido, p. ej. un manual con secciones agrupadas en fases›.

PRINCIPIO #1 — FLUIDEZ (lo más importante):
- TODO es un único scroll continuo. Prohibido intercambiar/ocultar vistas y prohibido
  fijar la vista (nada de position:fixed/pin que detenga el scroll).
- Usa GSAP + ScrollTrigger por CDN.
- Las animaciones van ligadas al scroll con `scrub` y deben ser REVERSIBLES:
  la velocidad del scroll.
- Nada de overlays a pantalla completa de duración fija que "corten" el flujo.

ESTRUCTURA:
- Un hero de entrada elegante (título revelado palabra por palabra con máscara).
- El contenido fluye en línea, agrupado por "fases"/grupos.

REVELADOS AL SCROLLEAR (moderados, parte del scroll):
- Cada bloque aparece al entrar en pantalla (fade + slide up con stagger).
- Títulos: revelado palabra por palabra enmascarado.
- Iconos SVG de línea que se dibujan solos (stroke-dashoffset, sin plugins de pago).
- Listas/pasos: número con rebote (back.out) y línea conectora que se traza con el scroll.

SEPARACIÓN ENTRE GRUPOS DE FASES (más marcada, pero igual fluida, SIN pin):
- Entre grupos, el FONDO de toda la página cambia de color suavemente (cada grupo
  con su tono elegante, baja saturación, nada chillón), como parte del scroll y reversible.
- Cada cambio de grupo tiene una sección "intro" GRANDE pero que NO ocupa toda la
  pantalla (~60vh). Su animación es una escena controlada por scroll (scrub) y reversible.
- CADA grupo debe tener una coreografía DISTINTA (ej.: órbita y fusión / caída en cascada /
  abanico / espiral / estallido y reagrupación / entrada desde los lados).
- En la escena, varios iconos SVG aparecen, se separan y luego SE UNEN al centro,
  de donde nace el icono del grupo con anillos que se expanden; después brota el título.
- Un icono SVG grande y tenue de fondo que se MUEVE durante todo el paso de la sección
  (parallax propio: se desplaza, gira y escala de forma continua y reversible).

REQUISITOS:
- Responsive y que funcione muy bien en celular (desactiva efectos de puntero fino allí).
- Respeta prefers-reduced-motion y ten un fallback si GSAP no carga (scroll suave, todo visible).
- Paleta elegante y corporativa; tipografías con personalidad (serif para títulos).
- Barra de progreso de scroll arriba.

NO HAGAS: pin/fijar vistas, overlays que tapen toda la pantalla, transiciones de tiempo
fijo que rompan el scroll, ni colores chillones.
