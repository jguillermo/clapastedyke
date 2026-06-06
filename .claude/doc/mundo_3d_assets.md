# Assets del mundo 3D — origen y exportación

El mundo 3D del juego **no se modela en código**: se **saca de la carpeta `3dmodel/`** (en la raíz del repo), que contiene las fuentes en **Blender (`.blend`)** y **FBX**, más los **GLB ya exportados** que Three.js carga en tiempo de ejecución. Este documento es transversal (no pertenece a un capítulo): describe de dónde salen los assets y cómo se exportan.

---

## 0. Principio crítico — lo más ligero posible (es web)

> **El render debe ser MUY ligero y rápido. Es web.** Cada pieza y cada megabyte cuentan: a más piezas, más lento el render y la carga. La meta es **la menor cantidad de piezas** y el **menor peso** posibles. Esto manda sobre cualquier otra consideración al exportar.

Reglas que gobiernan cada exportación:

- **Mínimo de piezas.** Fusionar todo lo que se pueda en una sola malla. Nunca exportar como objetos sueltos cosas que jamás se mueven.
- **FIJO = todo lo que NO se mueve, en un solo GLB.** Paredes, **azulejos/mayólicas**, piso, techo, ventanas, repisas y muebles empotrados, electrodomésticos grandes… todo **junto y anclado** en `kitchen.glb`. No se toca en runtime: se carga **una sola vez**.
- **MOVIBLE = solo lo que de verdad se mueve.** Utensilios, **vasos**, tazas, platos, cubiertos, comida, frascos, ollas, decoración suelta… un GLB **chico** por objeto, para gestionarlos pieza por pieza (quitar/poner/mover).
- **Peso al mínimo.** Draco (nivel 6) + WebP (calidad 70); **deduplicar** copias (una sola geometría; las demás como instancias en el JSON). Resultado objetivo: **~2 MB en total**.

---

## 1. La carpeta `3dmodel/`

Hoy **todo son fuentes** (Blender `.blend` y FBX). **No hay exports todavía** (no quedan GLB ni JSON): cada escena que entre al juego se **exporta** con el proceso de §3.

```
3dmodel/
├── Isometric Rooms Collection/                 ← escenas .blend de interiores (fuentes)
│   ├── isometric cozy kitchen.blend                    (8,1 MB) ★ WorldScene.KITCHEN (oficial)
│   ├── Isometric Kitchen Nook.blend                    (21 MB)  ┐ otras cocinas (no usadas)
│   ├── Isometric Kitchen Scene.blend                   (66 MB)  ┘
│   ├── isometrc cafe.blend                             (296 MB)
│   ├── isometric living room.blend                     (96 MB)
│   ├── Isometric Cozy Living Room – Low Poly…blend      (56 MB)
│   ├── Isometric Living Room – Stylized…blend          (275 MB)
│   ├── isometric bedroom.blend                         (72 MB)
│   ├── isometric  bedroom WINTER.blend                 (62 MB)
│   ├── Romantic Isometric Bedroom…blend                (14 MB)
│   ├── Cozy Gamer Bedroom.blend                        (20 MB)
│   └── Isometric Retro Room – Stylized…blend           (33 MB)
├── SimplePoly City.blend/
│   └── DemoScene_City.blend                    ← fuente Blender del pueblo (TOWN)
├── SimplePoly City.FBX/
│   ├── FBX Model/   → Buildings · Full City · Natures · Props · Road · Vehicles
│   └── Textures/    (50 texturas)
└── Archive.zip                                 ← respaldo (504 MB), no se consume en runtime
```

- **`Isometric Rooms Collection/`** — interiores en `.blend`. La cocina **oficial** del juego (`WorldScene.KITCHEN`) es **`isometric cozy kitchen.blend`**. `Isometric Kitchen Nook` e `Isometric Kitchen Scene` son cocinas alternativas no usadas. El resto (café, salas, dormitorios, sala retro) quedan como interiores disponibles para escenas futuras.
- **`SimplePoly City.*`** — fuentes del pueblo (`WorldScene.TOWN`), por exportar en su fase (la Regla de oro no permite adelantar trabajo de fases futuras).
- **Importante:** el export previo `kitchen/` (con `kitchen.glb` + movibles + JSONs) **ya no existe**; debe regenerarse desde la `.blend` de cocina elegida con el proceso de §3.

---

## 2. Herramientas

- **Blender** instalado en la máquina.
- **BlenderMCP** ya configurado (conector `github.com/ahujasid/blender-mcp`). Antes de exportar: activar el servidor en Blender (panel **N → BlenderMCP → puerto 9876**).

---

## 3. Cómo se exporta (procedimiento canónico)

El procedimiento **exacto y obligatorio** vive en **`.claude/3dmodel/export.md`** — es la fuente de verdad. Ahí se le indica a Blender (vía MCP) cómo convertir una escena abierta en GLB para Three.js. **Todo el proceso se rige por el Principio crítico (§0): mínimo de piezas y mínimo peso.** Resumen del flujo:

1. **Analizar** la escena: collections, jerarquías padre-hijo, número de copias, y un screenshot del viewport para entender cada objeto.
2. **Clasificar** cada cosa:
   - **FIJO** → un solo GLB de la sala (`kitchen.glb` / `room.glb`): paredes, pisos, techos, ventanas, azulejos, repisas empotradas, electrodomésticos grandes, todo anclado y con sus posiciones internas.
   - **MOVIBLE** → un GLB por objeto: mesas, sillas, platos, tazas, comida, ollas, electrodomésticos chicos, frascos (cada uno con su tapa), decoración suelta.
3. **Deduplicar**: de N copias del mismo objeto se exporta **una** geometría; las demás van como **instancias** en el JSON (posición, rotación, escala, dimensiones, material).
4. **Exportar** GLB con **Draco nivel 6** + texturas **WebP calidad 70**, coordenadas **Y-up** de Three.js, origen de cada GLB en el **centro de su base** (para apoyar con `position.set(x, alturaSuperficie, z)`); los movibles sin rotación (la rotación va en el JSON).
5. Generar junto a los GLB: **`scene_layout.json`** (layout e instancias + alturas de superficie) y **`scene_objects.json`** (mallas y materiales).
6. **No modificar la escena** (guardar posiciones y restaurar con try/finally); exportar a una carpeta `export`; verificar con screenshot que quedó intacta.

**Filosofía:** lo **FIJO** se carga una vez y no se toca; lo **MOVIBLE** se gestiona pieza por pieza (quitar, poner, mover), como en la vida real.

> Para repetir el proceso en otra escena basta abrirla en Blender y pegar el prompt de `export.md` (o decir "haz lo mismo que hicimos con la cocina").

---

## 4. Cómo lo consume el juego

- **KITCHEN (Fases 0–3):** se **exporta** `Isometric Rooms Collection/isometric cozy kitchen.blend` con el proceso de §3 → carpeta `export` con su GLB fijo + movibles + `scene_layout.json`/`scene_objects.json`. El juego (Three.js + `GLTFLoader` con `DRACOLoader`) carga el GLB fijo y monta los movibles según el `scene_layout.json`, usando las alturas de superficie para apoyar objetos.
- **Sombras (realismo de los movibles).** Cada objeto movible **proyecta sombra** (`castShadow`) sobre el fijo para que se vea **apoyado y real**, no flotando; el fijo la **recibe** (`receiveShadow`). Se mantiene **barato** acorde al §0: una sola luz direccional con un shadow map ajustado (o sombras de contacto), sin sombras por cada luz. El fijo, al no moverse, puede llevar su sombra/oclusión **horneada** en textura.
- **Otros interiores** (café, salas, dormitorios): fuentes disponibles para escenas futuras; se exportan igual cuando su fase lo requiera.
- **TOWN (Fase 4+):** se exportará desde `SimplePoly City.blend` con el mismo procedimiento cuando llegue su fase.

> Resultado esperado de una exportación: una carpeta con ~2 MB en total — un GLB fijo grande, decenas de movibles chicos y los 2 JSON.
