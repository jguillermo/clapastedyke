# Assets del mundo 3D — origen y exportación

El mundo 3D del juego **no se modela en código**: se **saca de la carpeta `3dmodel/`** (en la raíz del repo), que contiene las fuentes en **Blender (`.blend`)** y **FBX**, más los **GLB ya exportados** que Three.js carga en tiempo de ejecución. Este documento es transversal (no pertenece a un capítulo): describe de dónde salen los assets y cómo se exportan.

---

## 1. La carpeta `3dmodel/`

Hoy **todo son fuentes** (Blender `.blend` y FBX). **No hay exports todavía** (no quedan GLB ni JSON): cada escena que entre al juego se **exporta** con el proceso de §3.

```
3dmodel/
├── Isometric Rooms Collection/                 ← escenas .blend de interiores (fuentes)
│   ├── isometric cozy kitchen.blend                    (8,1 MB) ┐
│   ├── Isometric Kitchen Nook.blend                    (21 MB)  ├─ candidatas a WorldScene.KITCHEN
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

- **`Isometric Rooms Collection/`** — interiores en `.blend`. Hay **tres candidatas a cocina** (`isometric cozy kitchen`, `Isometric Kitchen Nook`, `Isometric Kitchen Scene`); cuál es la `WorldScene.KITCHEN` del juego es decisión de producto pendiente. El resto (café, salas, dormitorios, sala retro) quedan como interiores disponibles para escenas futuras.
- **`SimplePoly City.*`** — fuentes del pueblo (`WorldScene.TOWN`), por exportar en su fase (la Regla de oro no permite adelantar trabajo de fases futuras).
- **Importante:** el export previo `kitchen/` (con `kitchen.glb` + movibles + JSONs) **ya no existe**; debe regenerarse desde la `.blend` de cocina elegida con el proceso de §3.

---

## 2. Herramientas

- **Blender** instalado en la máquina.
- **BlenderMCP** ya configurado (conector `github.com/ahujasid/blender-mcp`). Antes de exportar: activar el servidor en Blender (panel **N → BlenderMCP → puerto 9876**).

---

## 3. Cómo se exporta (procedimiento canónico)

El procedimiento **exacto y obligatorio** vive en **`.claude/3dmodel/export.md`** — es la fuente de verdad. Ahí se le indica a Blender (vía MCP) cómo convertir una escena abierta en GLB para Three.js. Resumen del flujo:

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

- **KITCHEN (Fases 0–3):** se **exporta** la `.blend` de cocina elegida (de `Isometric Rooms Collection/`) con el proceso de §3 → carpeta `export` con su GLB fijo + movibles + `scene_layout.json`/`scene_objects.json`. El juego (Three.js + `GLTFLoader` con `DRACOLoader`) carga el GLB fijo y monta los movibles según el `scene_layout.json`, usando las alturas de superficie para apoyar objetos.
- **Otros interiores** (café, salas, dormitorios): fuentes disponibles para escenas futuras; se exportan igual cuando su fase lo requiera.
- **TOWN (Fase 4+):** se exportará desde `SimplePoly City.blend` con el mismo procedimiento cuando llegue su fase.

> Resultado esperado de una exportación: una carpeta con ~2 MB en total — un GLB fijo grande, decenas de movibles chicos y los 2 JSON.
