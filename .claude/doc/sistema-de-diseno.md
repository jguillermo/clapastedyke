# Sistema de Diseño Migo — Referencia

## Fuente de la verdad: el skill `migo-design`

El sistema de diseño de Migo **no se documenta ni se duplica aquí**. Vive en el skill
`migo-design`, que ya está **instalado y configurado** en este entorno (Claude Code).

> **Regla:** toda referencia de color, tipografía, espaciado, radios, sombras y assets
> del proyecto se saca del skill `migo-design`. Es la **única fuente de la verdad** del
> sistema de diseño. No inventes hex codes, no copies paletas a mano, no definas tokens
> propios: léelos del skill.

Para trabajar con estilo en el proyecto, invoca el skill antes de crear o tocar UI:

```
/migo-design
```

Ahí está el guía de marca completo (voz/tono, fundamentos visuales, iconografía),
los tokens como CSS custom properties, los assets (logos, app icon) y los componentes.

## De dónde sacar cada cosa

Rutas dentro del skill `migo-design` (ver su `readme.md` y `SKILL.md` para el detalle):

| Necesitas | Dónde está en el skill |
|---|---|
| **Colores** (la paleta y los alias semánticos) | `tokens/colors.css` |
| Tipografía (escala, pesos) | `tokens/typography.css` |
| Fuentes (`@font-face`) | `tokens/fonts.css` |
| Espaciado (ritmo de 4 en 4) | `tokens/spacing.css` |
| Radios y sombras | `tokens/radii.css` |
| Punto de entrada que importa todo | `styles.css` |
| Logos, app icon, lockup | `assets/logos/` |
| Componentes (Button, Input, Card, BottomNav…) | `components/` |
| Guía de marca completa | `readme.md` |

## Colores — siempre vía tokens, nunca hex a mano

Los colores del proyecto son los definidos en `tokens/colors.css` del skill. En código
de producto usa los **alias semánticos**, no los tonos crudos:

- Superficies: `--surface-page`, `--surface-card`, `--surface-warm`, `--surface-sunken`
- Texto: `--text-heading`, `--text-body`, `--text-muted`, `--text-placeholder`
- Acciones de marca: `--brand`, `--brand-hover`, `--brand-soft`
- Acentos: `--accent` (terracota), `--fresh` (pistacho), `--celebrate` (fresa)
- Bordes: `--border-subtle`, `--border-strong`

Resumen de la paleta (el detalle exacto vive en el skill, no aquí):

- **Miel** — primario.
- **Terracota** — secundario / acento de apoyo.
- **Pistacho** — acento fresco.
- **Fresa** — solo celebración (subir de nivel); el color más escaso del sistema.
- **Neutros tibios** — crema (fondo), nata (superficie), masa (rellenos/bordes), cacao (texto).
- Cero grises fríos, cero morado, cero blanco de pared.

## Cómo se aplica

1. Antes de crear o modificar cualquier UI, invoca `/migo-design` y conviértete en experto
   de la marca leyendo su `readme.md` y sus tokens.
2. Enlaza/usa los tokens del skill (`styles.css` → tokens) — no redefinas valores.
3. Si necesitas un color, búscalo en `tokens/colors.css` del skill y usa su alias semántico.
4. Mantén la voz Migo: español, "tú" informal, sentence case, cálido, celebra los logros.

Ver también [brand-concept.md](brand-concept.md) para el concepto de marca y la identidad
visual a alto nivel.