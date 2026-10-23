# Migrar una app con el catálogo copiado al paquete

El modelo anterior de esta skill copiaba el catálogo de Untitled UI a `src/components/` (con
`npx untitledui init`) y ponía la marca en `src/styles/brand-dpb.css`, encima de `theme.css`. Ahora el
catálogo y el tema vienen de `@desarrollospaloblanco/ui`. Esta receta pasa una app del modelo anterior
(como app-presupuestos) al paquete.

**Solo con el sí del usuario.** Cambia el aspecto (Inter en vez de Open Sans, y la rampa del paquete,
con el oficial en el 600) y toca casi todos los archivos de la app. Se hace en una rama propia, con
commits separados, y el árbol compila al final de cada paso.

**Todavía no se ha corrido de punta a punta.** Lo que sí se midió en app-presupuestos (23/10/2026):
usa 23 rutas del catálogo, todas presentes en el paquete 0.2.0; `src/components/` no tiene cambios
propios después del commit del starter; y `@/utils/cx` aparece en 140 imports. La primera vez que se
corra, anota aquí lo que faltó.

## Antes de empezar

1. **Árbol limpio y rama nueva.**
2. **¿La app cambió el catálogo?** `git log --oneline -- src/components`. Si solo aparece el commit del
   starter, no hay cambios propios. Si hay más, cada uno es una decisión del usuario: llevarlo al
   paquete (PR en `desarrollospaloblanco/dpb-ui`) o dejar ese archivo como copia local fuera de
   `src/components/` (por ejemplo, en `src/features/`), sabiendo que ya no recibe las actualizaciones
   del paquete.
3. **¿Qué usa la app del catálogo?** Las rutas que importa fuera de `src/components/`:

   ```bash
   grep -rhoE 'from "@/(components|utils|hooks)/[^"]+"' src --include=*.ts --include=*.tsx --exclude-dir=components | sort -u
   ```

   Comprueba cada una con `catalogo.mjs ver <ruta>` después de instalar. Lo que no esté en el paquete
   (una pieza PRO, una que se quitó) también es una decisión del usuario, antes de seguir.

## Pasos

1. **Acceso e instalación**, como en el paso 2 del `SKILL.md`: la línea del scope en el `.npmrc` del
   proyecto y `npm install @desarrollospaloblanco/ui`. El catálogo copiado sigue funcionando mientras
   tanto: los dos conviven hasta el paso 4.
2. **Imports al paquete.** `@/components/<ruta>` → `@desarrollospaloblanco/ui/components/<ruta>`, y lo
   mismo con las utilidades y hooks del catálogo (`@/utils/cx`, `@/utils/is-react-component`,
   `@/hooks/use-breakpoint`…) → `@desarrollospaloblanco/ui/utils/…` y `…/hooks/…`. Solo las que existen
   en el paquete: lo propio de la app (`@/utils/formato`) se queda en `@/`. Los imports del paquete van
   en el grupo de dependencias externas, no entre los `@/`. Typecheck: con el catálogo más nuevo del
   paquete puede cambiar alguna prop, y aquí es donde se ve.
3. **CSS y fuente.** `src/styles/globals.css` queda como el fragmento: `@import
   "@desarrollospaloblanco/ui/styles.css"` en lugar de `tailwindcss`, `theme.css`, `brand-dpb.css`,
   `typography.css`, los `@plugin`, los `@custom-variant` y la fuente de `html, body` (todo eso ya lo
   trae el paquete), y después `scrollbars.css` y lo propio de la app (`graficas.css`, por ejemplo). En
   `index.html`, el enlace de Open Sans se cambia por el de Inter del fragmento.
4. **Quitar el catálogo copiado.** Cuando `grep -r '@/components/' src --exclude-dir=components` ya no
   devuelva nada: borra `src/components/`, `src/styles/theme.css`, `typography.css` y `brand-dpb.css`, y
   las utilidades y hooks del catálogo que ya no importa nadie. Luego las dependencias que solo usaba el
   catálogo (`tailwind-merge`, `motion`, `react-aria`, los plugins de Tailwind…): quita **solo** las que
   la app ya no importa directamente (búscalas una por una) y deja `react-aria-components`,
   `@untitledui/icons`, `react-router`, `sonner`, `tailwindcss` y `@tailwindcss/vite`. Después,
   `npm install` y `npm ls react-aria-components`: una sola versión.
5. **La rampa.** En el código de la app, busca `brand-500`, `accent-500` y los demás pasos crudos.
   Donde querían decir «el azul oficial» o «el rojo oficial», ahora es el 600. `bg-brand-solid` pasa de
   #234B85 a #2C589A: el texto blanco sigue por encima de 7:1, pero revisa a ojo los botones primarios.
6. **Las piezas DPB.** `copiar-plantilla.mjs --dry-run`: casi todas las piezas saldrán en conflicto,
   porque cambiaron sus imports. Para cada una, el diff: si solo difieren los imports y comentarios,
   aplica la plantilla; si la app les hizo cambios, decide con el usuario. Quita el `className` que la
   app le pasaba a `TarjetaDialogo` para el catálogo anterior: el paquete ya trae el `Modal` actual.
7. **`CLAUDE.md`.** Cambia la sección «Capa DPB» por la de `assets/fragmentos/claude-md-capa-dpb.md`, y
   quita las instrucciones del `AGENT.md` de Untitled UI que mandan editar `theme.css` o usar su CLI.
   Pregunta antes.
8. **Verifica** con la checklist del `SKILL.md`, y compara pantalla por pantalla con la versión
   anterior (claro y oscuro): la migración no debe cambiar nada más que la fuente y el tono de azul.

## Commits

Uno por paso: dependencias y `.npmrc` · imports al paquete · CSS y fuente · quitar el catálogo copiado ·
la rampa · las piezas DPB · `CLAUDE.md`. Así, si algo se ve distinto, el diff dice en qué paso entró.
