# Trampas que ya mordieron

Lo que app-presupuestos descubrió a golpes, sin el negocio: síntoma, causa, arreglo y la plantilla que
ya lo resuelve. Las reglas generales de Untitled UI (props `is*`, imports `Aria*`, tokens semánticos,
nada de `dark:`) están en `eecheverria-untitled-ui`; aquí va solo lo que no es obvio. Cómo armar las
pantallas está en `patrones.md`.

## Contenido

1. [Con qué versiones se observó](#con-qué-versiones-se-observó)
2. [Instalación y toolchain](#instalación-y-toolchain)
3. [Tokens y Tailwind 4](#tokens-y-tailwind-4)
4. [Scroll, recortes y desbordes](#scroll-recortes-y-desbordes)
5. [Diálogos](#diálogos)
6. [Tablas y filas](#tablas-y-filas)
7. [Selects, campos y controles](#selects-campos-y-controles)
8. [Catálogo: textos en inglés y piezas PRO](#catálogo-textos-en-inglés-y-piezas-pro)
9. [Animación, SVG y remontajes](#animación-svg-y-remontajes)
10. [Datos en pantalla](#datos-en-pantalla)
11. [Sesión](#sesión)

---

## Con qué versiones se observó

| Pieza | app-presupuestos (lockfile al 22/10/2026) | Starter del 22/10/2026 |
| --- | --- | --- |
| Untitled UI React | starter del CLI del 17/09/2026 | `npx untitledui@latest init <carpeta> --vite -y` |
| react-aria-components | 1.21.1 | 1.21.1 / 1.22.1 |
| Tailwind CSS y `@tailwindcss/vite` | 4.3.3 | 4.3.3 |
| React y React DOM | 19.3.0 | 19.3 |
| Vite y rolldown | 8.3.0 y 1.2.11 | Vite 8.3 |
| react-router | 7.18.4 | 8.5 |
| TypeScript | 5.9.3 | 6.0.3 |
| sonner | 2.0.8 | 2.0.8 |

Cada título dice de qué capa depende; **revalidada** = se reprodujo con el starter del 22/10/2026 (sin
la marca, solo se vio en el origen). Cuándo revalidar cada capa:

- **CSS** y **diseño** (una decisión de la app): no caducan.
- **navegador** (el motor, el lector de pantalla o sus datos): al cambiar de navegador objetivo; `Intl`
  usa los datos de CLDR, que cambian con sus versiones.
- **catálogo** (lo que genera Untitled UI): tras cada `upgrade` o starter nuevo.
- **RAC** (react-aria-components) y **Tailwind 4**: al subir de minor. **React**: al subir de mayor.
- Una herramienta por su nombre (rolldown, MSAL, git): al subirla.

---

## Instalación y toolchain

### El typecheck falla recién generado el proyecto · catálogo · solo en starters anteriores

- **Síntoma:** 7 errores TS2307 en `src/components/` justo después de `init`: no encuentra
  `@react-aria/utils`, `@react-stately/utils` ni `@react-types/overlays`.
- **Causa:** varios componentes generados importaban esos paquetes directo, y el CLI no los declaraba.
- **Arreglo:** con el starter del 22/10/2026 no se reproduce: no los instales de oficio. Con uno
  anterior, `npm i -D` de los tres, y quítalos si un `upgrade` deja de importarlos.

### `calendar.tsx` no compila · catálogo + RAC · solo en starters anteriores

- **Síntoma:** `tsc` falla en `src/components/application/date-picker/calendar.tsx` y el build no pasa.
- **Causa:** el `CalendarContext` de react-aria-components tipa `onChange` con la unión que incluye la
  selección de rango (`readonly DateValue[]`), y el `CalendarContextProvider` de esos starters guardaba
  un solo valor.
- **Arreglo:** el `calendar.tsx` del starter del 22/10/2026 ya trae la corrección. Con uno anterior, la
  misma como parche local, la única excepción a «no tocar `src/components/`», con un comentario:

  ```ts
  // PARCHE LOCAL: RAC tipa onChange con la unión de rango. Revisar en cada upgrade.
  const onChange = (next: DateValue | readonly DateValue[] | null) => {
      setValue(Array.isArray(next) ? (next[0] ?? null) : next);
  };
  // …y pasar `onChange` en el `value` del provider en lugar de `setValue`.
  ```

  `upgrade` sobrescribe el archivo. Después de cada uno, corre `typecheck` sin el parche y vuelve a
  aplicarlo solo si falla.

### Vite se cae en Windows con «Rolldown panicked» · rolldown

- **Síntoma:** `npm run dev` y `vite build` caen con «Rolldown panicked… oxc_codegen sourcemap_builder…
  index out of bounds», o con un segfault sin mensaje, en cuanto `vite.config.ts` pasa de unas líneas.
- **Causa:** un bug de rolldown 1.2.9 en Windows.
- **Arreglo:** subir `rolldown` a 1.2.11 en el lockfile, que cabe en el `~1.2.6` que pide Vite 8.3.0. Si
  reaparece tras un `npm install`, revisa `npm ls rolldown` antes de tocar nada más.

### El tema parpadea o no respeta lo elegido al recargar · catálogo

- **Síntoma:** quien eligió oscuro ve un destello claro al cargar, o al revés: el guardia anti-parpadeo
  de `index.html` no coincide con la preferencia real.
- **Causa:** el starter leía en `index.html` la clave `theme`, mientras `ThemeProvider` escribe en
  `ui-theme`.
- **Arreglo:** la misma clave en los dos (`ui-theme`) y el mismo valor por defecto: `defaultTheme="light"`
  en el provider y «sin valor guardado, claro» en el guardia, que va en `try/catch`.
- **Ya resuelto en:** los fragmentos `index-head.html` y `main.tsx` de la skill.

### El tema «Sistema» no sobrevive a una recarga · catálogo · revalidada

- **Síntoma:** con un selector de tema, eliges «Sistema» y al recargar la app vuelve a claro.
- **Causa:** el `ThemeProvider` del starter borra la clave `ui-theme` cuando el tema es `system` y
  arranca con `savedTheme || defaultTheme`: sin clave, manda el `defaultTheme="light"` de la casa.
- **Arreglo:** DPB no trae selector. Si una app lo agrega, «Claro» y «Oscuro», que sí se guardan;
  «Sistema» pide cambiar el provider y el guardia de `index.html` a la vez: decídelo con el usuario.

### Quedan dos lockfiles · catálogo · revalidada

- **Síntoma:** después de `init` hay `bun.lock` y `package-lock.json`.
- **Causa:** `init` deja los dos, y cada gestor solo actualiza el suyo: con los dos, se desincronizan.
- **Arreglo:** elige uno antes del commit base. Con npm, borra `bun.lock`; con bun, `package-lock.json`.

### El commit base falla en Windows con «Filename too long» · git

- **Síntoma:** el primer `git add` o `git commit` del starter cae con «Filename too long».
- **Causa:** Git para Windows no acepta rutas largas mientras `core.longpaths` esté apagado.
- **Arreglo:** `git config core.longpaths true` en el repo, y vuelve a commitear. Antes, revisa la
  identidad (`git config user.email`): la del proyecto; en DPB, la cuenta de trabajo (`@paloblanco.com`).

---

## Tokens y Tailwind 4

### `ring-warning` y `border-warning` no existen · catálogo

- **Síntoma:** un aviso amarillo sale con un contorno casi negro.
- **Causa:** el tema trae `error_subtle` para bordes y anillos, pero ningún equivalente amarillo. Tailwind
  no avisa de un color que no existe, y el anillo cae al color del texto.
- **Arreglo:** `ring-warning_subtle` y `border-warning_subtle`, definidos sobre la rampa `yellow` del
  tema: yellow-300 en claro y yellow-500 en oscuro.
- **Ya resuelto en:** `src/styles/brand-dpb.css`.

### `bg-secondary_subtle` no existe · catálogo

- **Síntoma:** una fila «atenuada» sale sin fondo.
- **Causa:** el tema no define `secondary_subtle`, aunque haya aparecido en listas de tokens. Sí existen
  `bg-secondary_alt`, `bg-secondary_hover`, `bg-secondary-solid` y, de estado,
  `bg-{success,warning,error}-{primary,secondary,solid}`.
- **Arreglo:** `bg-secondary` para atenuar. Antes de usar un token de una lista, búscalo en `theme.css`.

### `bg-active` y las clases `fg-*` sueltas no pintan nada · catálogo · revalidada

- **Síntoma:** el ítem activo de una navegación sale sin fondo; un ícono con `fg-quaternary` sale con el
  color del texto.
- **Causa:** `bg-active` existía en el catálogo anterior y el del 22/10/2026 lo quitó. Los tokens `fg-*`
  solo generan CSS con prefijo de utilidad.
- **Arreglo:** el ítem activo es `bg-secondary hover:bg-secondary_hover`, como el `nav-item` del
  catálogo; los `fg-*`, como `text-fg-*`, `bg-fg-*` o `fill-fg-*`.
- **Ya resuelto en:** `sidebar.tsx`.

### Una variable de `@theme` no aparece en el CSS compilado · Tailwind 4

- **Síntoma:** `--color-accent-500` no está en el CSS del build, y parece que la rampa no se cargó.
- **Causa:** Tailwind 4 poda las variables de `@theme` que ninguna clase referencia.
- **Arreglo:** ninguno: es lo esperado, y la variable aparece en cuanto una clase la usa
  (`bg-accent-500`). No la des por rota al inspeccionar el CSS.

### El token propio genera `bg-bg-canvas` · Tailwind 4

- **Síntoma:** declaraste `--color-bg-canvas` y la utilidad que existe es `bg-bg-canvas`.
- **Causa:** Tailwind arma `bg-*` desde el espacio `--color-*`, así que el `bg-` del nombre se duplica.
  Untitled UI resuelve sus fondos con un segundo espacio, `--background-color-*`.
- **Arreglo:** dos variables. `--color-bg-canvas` guarda el valor; `--background-color-canvas:
  var(--color-bg-canvas)` es la que genera `bg-canvas`. Para un token de borde o de anillo, lo mismo con
  `--border-color-*` y `--ring-color-*`, como `warning_subtle`. En `.dark-mode` se redeclaran las dos:
  un alias declarado solo en la raíz resuelve ahí su `var()` y, bajo un `.dark-mode` anidado en un
  contenedor, se quedaría con el valor claro.
- **Ya resuelto en:** `src/styles/brand-dpb.css`.

### Los botones propios no muestran la mano · Tailwind 4

- **Síntoma:** un botón hecho con `AriaButton` o `<button>` muestra la flecha y parece no clicable. Lo
  mismo una `Table.Row` con `href`.
- **Causa:** el preflight de Tailwind 4 deja los botones con el cursor por defecto, y `Table.Row` no lo
  pone ni cuando navega.
- **Arreglo:** `cursor-pointer` explícito. `Button` y `ButtonUtility` del catálogo ya lo traen.
- **Ya resuelto en:** los botones propios de `src/features/shell/sidebar.tsx`.

### `transform-none` no anula un realce · Tailwind 4

- **Síntoma:** con «reducir movimiento» activado, el logo se sigue elevando al pasar el ratón.
- **Causa:** Tailwind 4 genera `translate-*` y `scale-*` como las propiedades CSS `translate` y `scale`,
  no como `transform`, y `transform-none` no las toca.
- **Arreglo:** anula cada una: `motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100`.

---

## Scroll, recortes y desbordes

### Un área con scroll se confunde con la página · CSS

- **Síntoma:** la rueda «no hace nada» o la página parece trabada; una lista larga se lee como página.
- **Causa:** un área con scroll sin borde no se distingue, y anidada en otra que también se desplaza, la
  rueda mueve la de dentro.
- **Arreglo:** el scroll va en un `div` con contorno (`rounded-lg ring-1 ring-secondary`) que lleva el
  `max-h-*` y el `overflow-y-auto`, no en el `<ul>` pelado. Y no anides áreas con scroll.
- **Ya resuelto en:** `AREA_TABLA` (`tabla.ts`).

### El encabezado fijo de la tabla se va con las filas · catálogo · revalidada

- **Síntoma:** le pusiste `sticky top-0` al `Table.Header` y al bajar se desplaza igual.
- **Causa:** `Table` envuelve la `<table>` en un `div` con `overflow-x-auto` (y a la tabla le pone
  `overflow-x-hidden`). `sticky` se pega al ancestro con scroll más cercano, ese `div`, que solo se mueve
  en horizontal.
- **Arreglo:** el área de fuera anula esos overflow (`[&>div]:overflow-visible
  [&_table]:overflow-visible`) y hace todo el scroll; el encabezado lleva `sticky top-0 z-10` (su fondo ya
  es opaco).
- **Ya resuelto en:** `AREA_TABLA` + `ENCABEZADO_FIJO` (`tabla.ts`).

### Aparece un segundo scroll, el de la página entera · CSS · revalidada

- **Síntoma:** además del scroll de la tabla, el documento crece y aparece otra barra encima.
- **Causa:** `sr-only` es `position: absolute`, y un `overflow` solo recorta a los `absolute` cuyo bloque
  contenedor es él o algo dentro de él. Sin un ancestro posicionado, el bloque contenedor es la ventana, y
  los `sr-only` de las celdas de la derecha y de abajo estiran el documento.
- **Arreglo:** toda área con scroll que envuelva contenido con `sr-only` es `relative`. `main` del layout
  también, como red.
- **Ya resuelto en:** `AREA_TABLA`, `AREA_TABLA_PROPIA` y `src/layouts/app-layout.tsx`.

### El diálogo entero se desplaza y la cabecera se va de la vista · CSS + RAC

- **Síntoma:** en una ventana baja, con una casilla o un interruptor al final del cuerpo, el fondo del
  diálogo se estira y el diálogo completo se mueve.
- **Causa:** `Checkbox` y `Toggle` de React Aria esconden su `<input>` con `position: absolute` y, como
  en la trampa anterior, si nada entre el input y el cuerpo con scroll es `relative`, escapa del recorte
  y estira el diálogo.
- **Arreglo:** el cuerpo con scroll es `relative`. No lo resuelvas con un margen negativo: dentro del área
  con scroll, lo que sube se recorta.
- **Ya resuelto en:** `TarjetaDialogo`.

### `sr-only` no achica una `<table>` · CSS

- **Síntoma:** scroll horizontal en móvil sin nada visible que desborde (la tabla accesible de una gráfica).
- **Causa:** `sr-only` pone `width: 1px`, pero una tabla ignora el ancho y se estira a su contenido.
- **Arreglo:** el `sr-only` va en un `<div>` que envuelve la tabla, nunca en la tabla.

### El scroll se va a `main` y se lleva los filtros y el paginador · CSS

- **Síntoma:** en un listado, en vez de desplazarse la tabla, se desplaza la pantalla entera.
- **Causa:** un hijo flex toma como alto mínimo el de su contenido; sin `min-h-0`, crece más allá de la
  tarjeta y quien se desplaza es `main`.
- **Arreglo:** `min-h-0` en cada nivel flex entre `main` y el área con scroll (el contenedor del cuerpo,
  `Tabs`, `Tabs.Panel`) y `flex-1` en el área. No lo contengas con `overflow-hidden`: recorta las filas
  de más en vez de dejar llegar a ellas.

### El anillo de foco o el borde sale recortado · CSS

- **Síntoma:** el primer o el último campo de un área con scroll, o un enlace de la navegación, muestran
  el anillo de foco cortado; la tarjeta que abre el contenido de la página pierde su borde de arriba.
- **Causa:** el `overflow` recorta lo que sale de la caja, y el anillo (`ring`) se pinta por fuera.
- **Arreglo:** holgura dentro del área: `-mx-1 px-1 pt-1` en la navegación, `py-1` en el cuerpo del
  diálogo y `pt-px` en `main`.
- **Ya resuelto en:** `sidebar.tsx`, `TarjetaDialogo` y `app-layout.tsx`.

---

## Diálogos

### `Modal` y `Dialog` no traen tarjeta ni límite de alto · catálogo · solo en el catálogo anterior

- **Síntoma:** el diálogo sale sin fondo, ocupa todo el ancho, o un formulario largo se desplaza entero
  y se lleva el título y «Guardar».
- **Causa:** en el catálogo anterior (el del origen, starter del 17/09/2026), `Modal` y `Dialog` solo
  ponían posición, animación y el fondo del overlay, y `Modal` era `w-full` sin ancho máximo.
- **Cómo saberlo:** si el `Dialog` de `src/components/application/modals/modal.tsx` no lleva
  `max-h-[inherit]`, es el catálogo anterior. La versión de react-aria-components no sirve de señal: el
  actual usa la misma.
- **Arreglo:** `<TarjetaDialogo className="bg-primary shadow-xl max-h-[85dvh]">` y el `max-w-*` en cada
  `Modal`. Con el catálogo actual, sin `className`.
- **Ya resuelto en:** la prop `className` de `src/features/comunes/tarjeta-dialogo.tsx`.

### El `Dialog` desplaza todo, cabecera y pie incluidos · catálogo · revalidada

- **Síntoma:** en un formulario largo, el título, la × y «Guardar» se van con el scroll.
- **Causa:** el `Dialog` del catálogo actual es `max-h-[inherit] overflow-y-auto`: el scroll es de todo su
  contenido, no solo del cuerpo.
- **Arreglo:** `TarjetaDialogo` como **hijo directo** de `Dialog`: toma `max-h-[inherit]` y deja el
  scroll solo en el cuerpo.
- **Ya resuelto en:** `src/features/comunes/tarjeta-dialogo.tsx`.

### El diálogo muestra datos viejos o se vacía con cada tecla · React

- **Síntoma:** «Editar» sobre otro registro muestra los valores del primero (o lo escrito antes de
  cancelar); o el formulario vuelve a sus valores iniciales con cada tecla.
- **Causa:** el diálogo no se desmonta al cerrarse, así que un `useState(prop)` leyó la prop una sola vez;
  y un efecto de reinicio que depende de un objeto que el padre arma en cada render corre con cada tecla.
- **Arreglo:** carga los valores en un efecto que corre al abrir (`if (!abierto) return;`, dependencias
  `[abierto, registro]`), con `registro` estable: el objeto que llegó del servidor.

### Escape y el clic fuera se saltan el botón Cancelar · RAC

- **Síntoma:** al reabrir, el error del intento anterior sigue a la vista; o Escape cierra el diálogo
  mientras guarda y el resultado se pierde.
- **Causa:** Escape y el clic fuera los dispara el overlay por `onOpenChange`; no pasan por el handler del
  botón Cancelar ni miran si se está guardando.
- **Arreglo:** todas las salidas por un solo handler conectado a `onOpenChange`, que limpia el error al
  cerrar, y `isDismissable={!trabajando} isKeyboardDismissDisabled={trabajando}` en el `ModalOverlay`.
- **Ya resuelto en:** `confirmar-dialog.tsx`. En los diálogos de formulario, va en cada uno.

---

## Tablas y filas

### `<Table size="sm">` no cambia el alto de las filas · catálogo · revalidada

- **Síntoma:** todas las filas salen de 72 px (`h-18`) aunque pidas `sm`; con `size="sm"` y `h-11` en
  cada fila, salen de 54 px.
- **Causa:** `TableRoot` resuelve `context?.size ?? size`, y `TableContext` trae `{ size: "md" }` por
  defecto: el contexto nunca es `undefined` y la prop no se lee jamás. `Table.Cell` toma su tamaño del
  mismo contexto, siempre `md` (`py-4`), y estira la fila.
- **Arreglo:** el `size` va en `Table.Header` y en cada `Table.Row`, que sí respetan el suyo, y la fila
  lleva `h-11 *:py-2`: la `h-11` gana a la `h-14` del componente (`cx` es tailwind-merge), y `*:py-2`
  baja el relleno de las celdas sin tocar el `px-6` que las alinea con `Table.Head` (`size="sm"` en cada
  celda las desalinea).
- **Ya resuelto en:** `FILA` (`tabla.ts`).

### Una celda muestra un dato viejo o un botón no se deshabilita · RAC

- **Síntoma:** una columna sale «—» según qué petición respondió primero; los botones de las filas siguen
  activos mientras se guarda.
- **Causa:** `Table.Body` con `items` memoriza cada fila por el objeto de su item. Lo que la celda lee de
  fuera (un mapa que llega después, `trabajando`, `puedeEditar`) no la refresca hasta que cambian los items.
- **Arreglo:** todo lo que una celda lea de fuera va en `dependencies={[…]}` del `Table.Body`. Una tabla
  cuyos items se rearman en cada render (`filas.map(…)`) no lo necesita.

### El encabezado numérico no se alinea a la derecha · catálogo

- **Síntoma:** `text-right` en `Table.Head` no mueve la etiqueta.
- **Causa:** `Table.Head` pinta la etiqueta dentro de un `flex`.
- **Arreglo:** `className="*:justify-end"` en el `Table.Head`; en la celda, `text-right tabular-nums`.

### El badge sale tachado, o un texto de la fila inactiva no · CSS · revalidada

- **Síntoma:** en una fila inactiva, el badge «Inactiva» queda tachado e ilegible; o, al revés, el texto
  que vive dentro de una caja `inline-flex` no se tacha.
- **Causa:** el `line-through` de la celda lo heredan todos sus hijos, en bloque y en flex, salvo las
  cajas en línea atómicas (`inline-block`, `inline-flex`).
- **Arreglo:** el badge, en un `inline-block` (`SIN_TACHAR`); dentro de una celda `flex`, en un `<span>`
  más, porque el hijo directo de un flex se *blockifica* y se tacha igual. El texto de una caja atómica,
  o con color propio, lleva el tachado explícito.
- **Ya resuelto en:** `claseFila`, `SIN_TACHAR` y `TACHADO_INACTIVO` (`estado-fila.ts`).

### La columna fija de una `<table>` propia casi no se mueve · CSS

- **Síntoma:** una celda `sticky left-0` con `colSpan` acompaña al scroll un par de columnas y se va, o no
  se mueve nada.
- **Causa:** un elemento `sticky` solo se desplaza dentro de su bloque contenedor, que para una celda es la
  tabla. Una celda que abarca casi todas las columnas no tiene a dónde moverse.
- **Arreglo:** en las filas con `colSpan`, ancla el contenido y no la celda: un hijo `sticky w-fit` con su
  `left-*` igual al padding de la celda. En las demás filas, `sticky left-0` en la `td` funciona.

### Abrir un diálogo desde una fila la guarda a medias · React

- **Síntoma:** en una rejilla que guarda la fila al perder el foco, abrir un diálogo desde esa fila
  dispara el guardado.
- **Causa:** los eventos de un portal suben por el árbol de React, no por el del DOM. El diálogo vive en
  `document.body`, pero su `blur` llega al `onBlur` de la tabla, con un `relatedTarget` que `contains()`
  no encuentra.
- **Arreglo:** mientras un diálogo de la fila está abierto, la tabla lo sabe (una bandera) e ignora ese
  `blur`.

### Pegar una celda de Excel se lee como un rango · navegador

- **Síntoma:** pegar una sola celda copiada de Excel en una rejilla se trata como un rango de dos filas.
- **Causa:** Excel copia con un salto de línea al final, aunque sea una sola celda.
- **Arreglo:** quita ese salto final antes de decidir si es un valor suelto o un rango.

---

## Selects, campos y controles

### Un `Select.ComboBox` con búsqueda en el servidor esconde resultados o no abre · RAC

- **Síntoma:** faltan coincidencias que el servidor sí devolvió (las que no llevan tilde, o las que
  coinciden por otro campo), o la lista nunca se abre mientras escribes.
- **Causa:** el ComboBox está pensado para filtrar en el cliente y, contra el servidor, falla en silencio:
  React Aria vuelve a filtrar por «contiene» lo que el servidor ya filtró, y vaciar los resultados en cada
  tecla hace que la lista no tenga nada que abrir.
- **Arreglo:** tres cosas que el local no necesita: `defaultFilter={() => true}`, `allowsEmptyCollection`
  mientras la búsqueda está en curso, y **conservar los últimos resultados** mientras llega la siguiente
  respuesta. La lista se abre al cambiar el texto y solo si tiene algo.

### `Select.Item` no baja el `supportingText` a otro renglón · catálogo

- **Síntoma:** el texto de apoyo sale en la misma línea que la etiqueta.
- **Causa:** el componente lo pinta en línea y solo lo baja si no cabe.
- **Arreglo:** para dos renglones fijos, compón los hijos a mano y pasa `textValue` explícito. Con hijos
  que no son texto, `textValue` queda vacío, y es lo que el ComboBox escribe en el campo al elegir y por
  lo que filtra.

### El ComboBox muestra solo la primera letra de la opción elegida · catálogo

- **Síntoma:** eliges «código · nombre» y en el campo queda una sola letra.
- **Causa:** el campo pinta la opción elegida partiendo su texto por el `supportingText`. Si este es el
  comienzo de la etiqueta (el código), queda casi nada.
- **Arreglo:** no repitas en `supportingText` lo que ya dice la etiqueta.

### `Toggle` abre un scroll horizontal o aplasta el interruptor · catálogo · revalidada

- **Síntoma:** un `Toggle` con `hint` largo abre scroll horizontal en el diálogo; con `w-full`, el
  interruptor sale aplastado.
- **Causa:** el componente es `w-max`: se estira al ancho de su texto y el hint no parte línea. Con
  `w-full`, el bloque de texto reclama todo el ancho y el flex encoge el interruptor. Tampoco se puede
  apuntar al interruptor con `:first-child`: el primer hijo del `Switch` es su `<input>` oculto.
- **Arreglo:** `w-full [&>:last-child]:min-w-0 [&>:last-child]:flex-1`: el texto, que es el último hijo,
  solo toma el hueco que sobra.
- **Ya resuelto en:** `TOGGLE_ANCHO_COMPLETO` (`toggle.ts`).

### `MultiSelect` borra la selección con Escape · RAC

- **Síntoma:** con la lista abierta, cerrar con Escape vacía todo lo elegido.
- **Causa:** comportamiento de React Aria dentro del componente generado.
- **Arreglo:** no hay salida sin tocar `src/components/`. Ciérralo con un clic fuera y, si la selección
  cuesta trabajo, muestra la lista de lo elegido fuera del campo y guarda de forma explícita.

### `type="number"` entrega vacío con «3e» · navegador

- **Síntoma:** un campo numérico con «3e» se guarda como vacío, que puede significar otra cosa.
- **Causa:** con `type="number"`, el navegador entrega una cadena vacía ante un valor que no es número.
- **Arreglo:** un `Input` de texto con `inputMode` (ver [Formularios](patrones.md#formularios-en-diálogo))
  y valida tú el texto.

### `Select` no vuelve a «Todos» · RAC

- **Síntoma:** una vez elegido un filtro, no hay forma de volver a «sin filtrar».
- **Causa:** `Select` necesita una clave, y `undefined` no lo es.
- **Arreglo:** una opción centinela (`"__todos__"`) que el filtro traduce a `undefined`, con texto corto
  («Todos») y el nombre del filtro en el `label` visible («Estado»): en `w-44`, «Todos los estados» se corta.

---

## Catálogo: textos en inglés y piezas PRO

### Textos fijos en inglés que no se pueden editar · catálogo

- **Síntoma:** «Previous» y «Next», el pie del `MultiSelect`, el `DropZone`, el `DateRangePicker`, el
  «Notifications» que anuncia el lector de pantalla, la 404 «We can't find that page». Revalidados con el
  starter del 22/10/2026: los de `PaginationPageDefault` y el de `sonner`.
- **Causa:** el catálogo trae texto fijo, y `src/components/` no se edita.
- **Arreglo:** apágalo por props o compón con otras piezas del catálogo (la tabla de salidas está en
  [Idioma](patrones.md#idioma)). Sin salida: el placeholder «Search» del buscador del `MultiSelect`.
- **Ya resuelto en:** `paginacion.tsx`, `notificaciones.tsx` y `no-encontrada.tsx`.

### El toast del catálogo pide `login` · catálogo · revalidada

- **Síntoma:** `npx untitledui@latest add` de las notificaciones pide iniciar sesión.
- **Causa:** el toast de Untitled UI (`notifications`) es PRO.
- **Arreglo:** `sonner`, sobre la que el catálogo monta el suyo, con el aspecto hecho con tokens.
- **Ya resuelto en:** `src/features/comunes/notificaciones.tsx`.

### `application/empty-state` no sigue los tokens · catálogo · revalidada

- **Síntoma:** el vacío del starter se ve distinto en oscuro y trae una ilustración ajena a la app.
- **Causa:** usa tokens no semánticos (`from-neutral-50 to-neutral-200`) y una ilustración decorativa.
- **Arreglo:** `EstadoVacio` de la plantilla.
- **Ya resuelto en:** `src/features/comunes/estado-vacio.tsx`.

---

## Animación, SVG y remontajes

### La transición no se repite al cambiar de registro · React

- **Síntoma:** al pasar de `/proveedores/1` a `/proveedores/2` no hay transición; entre módulos, sí.
- **Causa:** `animate-in` corre al montar. Entre páginas distintas React remonta todo y la entrada se
  dispara sola; cuando la misma página cambia de parámetro, la reconcilia en la misma posición y las
  clases ya aplicadas no vuelven a correr.
- **Arreglo:** una `key` con el `pathname` en lo que se anima, siempre con `motion-reduce:animate-none`.
- **Ya resuelto en:** `src/layouts/app-layout.tsx`.

### La cabecera sale duplicada · React

- **Síntoma:** con un elemento delante (una franja de aviso), la cabecera aparece dos veces en cada render.
- **Causa:** el header y el `main` eran hermanos con la misma `key` (el `pathname`), y React no sabía cuál
  era cuál.
- **Arreglo:** prefijos distintos: `encabezado:${pathname}` y `contenido:${pathname}`.
- **Ya resuelto en:** `src/layouts/app-layout.tsx`.

### Con dos SVG iguales en pantalla, uno sale sin degradado o sin patrón · navegador

- **Síntoma:** la segunda instancia de un SVG con `<linearGradient>` o `<pattern>` se pinta mal.
- **Causa:** dos `id` iguales en el documento; el `url(#id)` de la segunda apunta a la primera.
- **Arreglo:** el `id` sale de `useId()`. Una marca propia con degradados necesita lo mismo.
- **Ya resuelto en:** `src/brand/iso-pattern.tsx`.

### Lo que debe pasar una vez por sesión pasa en cada pantalla · React

- **Síntoma:** la entrada del logo, o la petición que arma el menú, se repite en cada navegación.
- **Causa:** cada ruta monta una página distinta con su `AppLayout`, y React remonta todo, sidebar
  incluida: un `useState` se pierde con ella.
- **Arreglo:** una bandera a nivel de módulo; los datos, en la caché de la capa de datos (la decide
  `eecheverria-frontend-react`). Márcala en un efecto, no en el inicializador del estado: en desarrollo,
  StrictMode llama dos veces al inicializador y en la segunda llamada ya no animaría.

---

## Datos en pantalla

### Una fecha sale un día antes · navegador

- **Síntoma:** «2026-10-31» se muestra como 30/10/2026.
- **Causa:** `new Date("2026-10-31")` es medianoche UTC, y en Guatemala (UTC−6) se pinta el día anterior.
- **Arreglo:** una fecha de calendario (`AAAA-MM-DD`) no pasa por `Date`: se muestra con
  `formatearFecha`, y para un `InputDate` se convierte con `parseDate` de `@internationalized/date`. El
  starter del 22/10/2026 ya lo declara (`^3.12.4`); solo en starters anteriores es transitiva sin
  declarar: si deja de resolver, decláralo en `package.json`.
- **Ya resuelto en:** `formatearFecha` (`src/utils/formato.ts`).

### Los montos compactos mezclan sufijos · navegador

- **Síntoma:** «1.7 K» (1700) y «184.5 k» (184500) en la misma columna.
- **Causa:** `Intl.NumberFormat` con `notation: "compact"` en `es-GT`.
- **Arreglo:** `formatearCompacto` («1.9k», «184.5k», «1.4M»), con el exacto (`formatearMonto`) a mano.
  `CifraKpi` lo pone en `title` y en `sr-only`, que no se alcanzan con toque ni solo con teclado: si el
  exacto importa en móvil, ponlo también en `detalle`, o no compactes bajo `sm`.
- **Ya resuelto en:** `src/utils/formato.ts` (el formato); el exacto en táctil lo resuelve la pantalla.

### Las fotos por fila agotan el rate limit · diseño

- **Síntoma:** un listado con fotos dispara una petición por persona y el backend responde 429.
- **Causa:** si la foto sale de una API autenticada, un `<img src>` no puede mandar el Bearer, así que
  cada foto es una petición propia contra el límite del usuario.
- **Arreglo:** iniciales en los listados (`Avatar` con `initials`); la foto, solo al abrir una persona, y la
  propia cacheada por sesión.

---

## Sesión

### «Cerrar sesión» saca al usuario de todo Microsoft 365 · MSAL

- **Síntoma:** al salir de la app, el usuario pierde también la sesión de Outlook, Teams y SharePoint.
- **Causa:** `logoutRedirect()` hace un cierre federado contra Entra ID.
- **Una salida (con costo):** cierre local con `clearCache()`. Como la cookie de Microsoft sobrevive, el inicio de sesión
  fuerza `prompt: "select_account"`: sin eso, el siguiente clic devuelve en silencio a la misma cuenta y
  parece que salir no hizo nada. Los dos cambios van juntos; no toques uno sin el otro.
- **El costo:** en un equipo compartido, quien llega después ve la cuenta del anterior en el selector y
  entra sin contraseña. Si la app se usa en equipos compartidos, `logoutRedirect()`. La decisión es de
  seguridad: tómala con `eecheverria-security`.

### Al recargar se ve el login un instante · MSAL

- **Síntoma:** con la sesión viva, recargar muestra la pantalla de acceso un momento antes de volver.
- **Causa:** la ruta protegida redirige antes de que MSAL termine de restaurar la cuenta.
- **Arreglo:** no redirijas mientras se restaura; muestra en su lugar «Restaurando sesión…», con el
  `LoadingIndicator` en un envoltorio `role="status"` (ver [Acceso](patrones.md#acceso)).
