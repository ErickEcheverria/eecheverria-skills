<!--
    Sección para el CLAUDE.md del proyecto: va AL INICIO, después del commit base y con la confirmación
    del usuario. Si no hay CLAUDE.md, créalo con un título `# <Nombre de la app>` y esta sección debajo.
    Copia la sección tal cual, sin este comentario; solo reemplaza <Nombre de la app>.
-->

## Capa DPB — manda sobre lo que sigue

<Nombre de la app> es una app interna de Desarrollos Palo Blanco: usa el paquete `@desarrollospaloblanco/ui`
(el design system de la organización, en `desarrollospaloblanco/dpb-ui`) y la capa `dpb-design-system`
encima. Donde este archivo y esa skill no coincidan en diseño, manda la skill:

- **Los componentes del catálogo y el tema vienen del paquete.** No copies componentes de Untitled UI a
  la app (ni con `npx untitledui add`) ni redefinas sus tokens en un `@theme` (`brand-*`, `accent-*`, la
  fuente). Si falta un componente o un token está mal, se pide en `desarrollospaloblanco/dpb-ui`.
- **Antes de usar un componente, lee su API en la versión instalada.** Desde la 0.3.0, su entrada en
  `node_modules/@desarrollospaloblanco/ui/ai/components.json` trae el import, las props (con las
  heredadas de React Aria) y ejemplos de uso; si no está ahí, el `.d.ts` de ese componente
  (`node_modules/@desarrollospaloblanco/ui/dist/components/<ruta>.d.ts`). Busca solo el que vas a usar,
  no cargues el catálogo entero. Se importa desde `@desarrollospaloblanco/ui/components/<ruta>`.
- **Las piezas DPB** están en `src/features/comunes/`, `src/features/shell/`, `src/layouts/` y `src/brand/`.
  Lo que cambia por app está en tres costuras: `src/features/shell/shell.config.ts`, `nav-items.ts` y
  `use-cuenta.ts`.
- **El `.npmrc` del proyecto lleva solo la línea del scope.** El token va en el `~/.npmrc` de cada
  usuario: nunca en el repo.
- **Todo el texto visible va en español**, y el modo oscuro se hereda de los tokens (sin `dark:`).
