<!--
    Fragmento para el CLAUDE.md que deja `npx untitledui init` (es el AGENT.md del proveedor).
    Va AL INICIO de ese archivo, después del commit base del starter y con la confirmación del
    usuario. Copia la sección tal cual; solo reemplaza <Nombre de la app>.
-->

## Capa DPB — manda sobre lo que sigue

<Nombre de la app> es una app interna de Desarrollos Palo Blanco y usa la capa `dpb-design-system` encima
de Untitled UI. Donde este archivo y esa skill no coincidan en diseño, manda la skill:

- **La marca vive en `src/styles/brand-dpb.css`.** No edites `src/styles/theme.css` (aunque la sección
  de color de marca de abajo lo indique): lo reescribe `npx untitledui upgrade`.
- **No edites `src/components/`**: es el catálogo. Las piezas DPB están en `src/features/comunes/`,
  `src/features/shell/`, `src/layouts/` y `src/brand/`.
- **Lo que cambia por app está en tres costuras:** `src/features/shell/shell.config.ts`,
  `nav-items.ts` y `use-cuenta.ts`.
- **Todo el texto visible va en español**, y el modo oscuro se hereda de los tokens (sin `dark:`).
