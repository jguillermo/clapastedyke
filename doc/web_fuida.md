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


===============================================================================
ADAPTACIÓN PARA FORMULARIOS DENTRO DE UN MODAL
===============================================================================
Cuando el destino NO es una landing de scroll largo sino un formulario que se
carga dentro de un modal (p. ej. diálogos de Google Apps Script: encabezado
fijo arriba, cuerpo scrolleable, pie con botones), no hay "contenido largo que
fluye". Traduce los mismos principios al espacio reducido del modal así:

PRINCIPIO #1 — FLUIDEZ EN EL MODAL (lo más importante):
- El "scroll continuo de la página" se reduce al CUERPO scrolleable del modal
  (la zona entre el encabezado fijo y el pie fijo). Dentro del modal NO
  intercambies/ocultes vistas ni metas pasos a pantalla completa: un solo
  formulario continuo. Encabezado y pie pueden quedar fijos (es el chrome del
  modal), pero NO pines el contenido del formulario.
- NO necesitas GSAP/ScrollTrigger: basta CSS (transiciones + keyframes) y un
  IntersectionObserver pequeño que observe el cuerpo del modal. Si igual usas
  GSAP, que sea ligero y solo para reveals, nunca para pin.
- Las animaciones siguen siendo suaves y REVERSIBLES: si el usuario vuelve a
  subir en el cuerpo, los elementos se re-ocultan/reaparecen acompañando el scroll.
- Nada de overlays que tapen el modal ni de animaciones de duración fija que
  bloqueen la captura de datos.

ENTRADA DEL MODAL (en vez de hero a pantalla completa):
- Al abrir, el modal entra con un fade + leve elevación/escala (≤ ~250 ms),
  sin rebotes bruscos.
- El título del encabezado se revela palabra por palabra enmascarado, una sola
  vez al abrir.
- Las tarjetas/secciones del formulario aparecen escalonadas (fade + slide up
  con stagger) según entran en la parte visible del cuerpo.

REVELADOS AL SCROLLEAR EL CUERPO (moderados, parte del scroll):
- Cada tarjeta, sección o grupo de campos aparece al entrar en el área visible
  del cuerpo (fade + slide up, con stagger por orden de aparición).
- Iconos SVG de línea que se dibujan solos (stroke-dashoffset) en los títulos
  de sección, sin plugins de pago.
- Listas de pasos o filas que se agregan (ingredientes, líneas, reglas):
  número con rebote (back.out) y línea conectora que se traza.

SEPARACIÓN ENTRE GRUPOS (con aire, SIN coreografías que tapen):
- En un modal NO cambies el fondo por "fases" ni metas escenas intro grandes
  (~60vh): el espacio es reducido y el objetivo es capturar datos.
- Marca la separación entre grupos con espaciado generoso, líneas/tarjetas
  suaves y el color de acento — no con escenas a pantalla ni parallax.

MICROINTERACCIONES DE FORMULARIO (lo que aquí sustituye a las escenas):
- Foco de campo con transición suave del borde/realce.
- Validación: el error entra con un desplazamiento corto + color y es reversible
  al corregir (se desvanece solo).
- Botón primario con feedback al guardar (estado "cargando"/disabled) sin
  congelar la interfaz.
- Avisos (flash de éxito/error) entran con fade + slide y los de éxito se
  autoocultan.

BARRA DE PROGRESO:
- Si el cuerpo del modal scrollea, una barra fina de progreso ARRIBA (dentro
  del modal, ligada al scroll del cuerpo — no position:fixed global) refleja
  el avance. Si el formulario cabe sin scroll, ocúltala.

REQUISITOS:
- Responsive: el modal y sus animaciones funcionan bien en celular; atenúa los
  efectos de hover de puntero fino allí.
- Respeta prefers-reduced-motion: sin transforms/animaciones, todo visible e
  instantáneo.
- Fallback si el JS no carga o falla: NADA debe quedar oculto por defecto. El
  estado oculto inicial solo se aplica cuando el JS añade una clase marcadora al
  body (p. ej. `body.fx`); sin JS, todo se ve.
- Paleta elegante y coherente con el resto del formulario; tipografías con
  personalidad (serif para títulos); nada chillón.

NO HAGAS (en modales): pin/fijar el contenido del formulario, overlays que tapen
el modal, cambiar el fondo por fases, escenas intro de ~60vh, parallax de SVG
gigante de fondo, transiciones de tiempo fijo que bloqueen la captura, ni cargar
GSAP pesado solo para esto.
