Conéctate a mi Blender. Tengo abierta una escena que quiero exportar a GLB para usarla en Three.js como escena interactiva: lo FIJO se carga una vez y no se toca, lo MOVIBLE lo gestiono yo pieza por pieza (quitar, poner, mover, como en la vida real).

Sigue exactamente este proceso:

**1. Análisis (antes de exportar nada):**
- Lee la estructura: collections, objetos, jerarquías padre-hijo, cuántas copias hay de cada cosa.
- Toma un screenshot del viewport para entender qué es cada objeto.
- Ojo: una "cosa" real puede ser varios objetos sueltos sin emparentar (un refrigerador puede ser 6 mallas). Agrupa por sentido común y cercanía, no solo por jerarquía. Nunca separes las partes de un mismo objeto real (ej: la clara y la yema de un huevo frito van juntas; las mayólicas son parte de la pared).

**2. Clasificación:**
- FIJO (un solo archivo `kitchen.glb` o `room.glb`): paredes, pisos, techos, ventanas, cortinas, azulejos, repisas y estantes empotrados, electrodomésticos grandes (refrigerador, cocina/horno, campana, grifo/lavadero), muebles empotrados, rieles de pared. Todo junto, anclado al piso, conservando posiciones internas.
- MOVIBLE (un GLB por objeto): mesas, sillas, platos, tazas, vasos, cubiertos, comida, ollas y sartenes, electrodomésticos chicos (tostadora, cafetera), frascos (cada uno CON su tapa), decoración suelta.

**3. Deduplicación:**
- Si hay copias del mismo objeto (19 platos, 2 sillas), exporta UNA sola, comparando solo geometría (vértices/polígonos), IGNORANDO material, color y tamaño.
- Cada copia va al JSON como instancia con su posición, rotación, escala (calcula el factor si el tamaño difiere), dimensiones y color/material.

**4. Formato de exportación:**
- GLB con compresión Draco (nivel 6) y texturas WebP calidad 70 (es para web, debe pesar poco).
- Coordenadas Three.js: Y arriba (`export_yup`), posiciones convertidas (x, z, -y), cuaterniones convertidos.
- Origen de cada GLB = centro de su base, para apoyar objetos con position.set(x, alturaSuperficie, z).
- Los movibles se exportan sin rotación (la rotación original va en el JSON).

**5. Archivos JSON junto a los GLB:**
- `scene_layout.json`: por componente → archivo, fixed true/false, dimensiones, e instancias con blenderObject, position, quaternion, rotationYDeg, scale, dimensions, material/color. En meta incluye alturas de referencia de superficies (mesa, encimera, repisas, piso...) para poder apoyar objetos.
- `scene_objects.json`: características por componente → cada pieza con malla, vértices, polígonos, dimensiones y materiales completos (baseColor hex y rgba, metallic, roughness, alpha, emisión, texturas).

**6. Reglas del proceso:**
- ANTES de exportar, muéstrame la lista completa de qué va fijo y qué va movible, con tus dudas puntuales, y espera mi conformidad.
- No modifiques mi escena: guarda posiciones originales, exporta y restaura todo (usa try/finally).
- Exporta a una carpeta `export` junto al .blend, borrando la versión anterior si existe.
- Al terminar: verifica con un screenshot que la escena quedó intacta y dame la lista de archivos con sus pesos.
- Recuérdame que en Three.js necesito DRACOLoader y dame el snippet de carga.


- El conector se llama BlenderMCP (github.com/ahujasid/blender-mcp). Activar el servidor en Blender (panel N → BlenderMCP → puerto 9876) antes de empezar.
- Si la sesión anterior existe, puedo decir "haz lo mismo que hicimos con la cocina isométrica" y pegar este prompt igual.
- Resultado esperado: carpeta export con ~2 MB total, un GLB fijo grande y decenas de movibles chicos + 2 JSON.
