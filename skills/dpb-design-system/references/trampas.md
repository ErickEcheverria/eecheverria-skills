# Trampas que ya mordieron

Lo que app-presupuestos descubrió a golpes, sin el negocio: síntoma, causa, arreglo y la plantilla que
ya lo resuelve. Las reglas generales de Untitled UI (props `is*`, imports `Aria*`, tokens semánticos,
nada de `dark:`) están en `eecheverria-untitled-ui`; aquí va solo lo que no es obvio. Cómo armar las
pantallas está en `patrones.md`.

## Con qué versiones se observó

Lockfile de `app-presupuestos-frontend` al 22/10/2026:

| Pieza | Instalada | Pedida en `package.json` |
| --- | --- | --- |
| Untitled UI React | starter del CLI, `npx untitledui@latest init . --vite` del 17/09/2026 | — |
| react-aria-components | 1.21.1 (react-aria 3.52.1) | `^1.16.0` |
| Tailwind CSS y `@tailwindcss/vite` | 4.3.3 | `^4.2.2` |
| React y React DOM | 19.3.0 | `^19.2.4` |
| Vite y rolldown | 8.3.0 y 1.2.11 | `^8.0.2` |
| react-router | 7.18.4 | `^7.13.0` |
| TypeScript | 5.9.3 | `^5.9.3` |
| recharts · sonner · tailwind-merge | 3.10.1 · 2.0.8 · 3.7.0 | `^3.8.0` · `^2.0.8` · `^3.5.0` |
| `@internationalized/date` | 3.12.4 (transitiva) | no declarada |

El starter vigente (revisado el 22/10/2026) ya trae **react-router 8.5 y TypeScript 6.0.3**, y
cambió el `Modal` (ver [Diálogos](#diálogos)). En él se volvieron a comprobar: el `size` ignorado de
`Table`, el `overflow-x-auto` que rompe el encabezado fijo, el doble scroll del `sr-only`, el `w-max`
del `Toggle`, el tachado que no entra en un `inline-block`, los textos de `PaginationPageDefault`, el
toast PRO, el `containerAriaLabel` en inglés de `sonner` y el `empty-state` sin tokens. El resto se
observó solo en app-presupuestos.

Cada entrada dice de qué capa depende, para saber cuándo revalidarla:

- **CSS** y **navegador**: no caducan.
- **catálogo**: después de cada `npx untitledui@latest upgrade` o de un starter nuevo.
- **RAC**: al subir de minor `react-aria-components`.
- **Tailwind 4**: al subir de minor Tailwind.

## Contenido

1. [Instalación y toolchain](#instalación-y-toolchain)
2. [Tokens y Tailwind 4](#tokens-y-tailwind-4)
3. [Scroll, recortes y desbordes](#scroll-recortes-y-desbordes)
4. [Diálogos](#diálogos)
5. [Tablas y filas](#tablas-y-filas)
6. [Selects, campos y controles](#selects-campos-y-controles)
7. [Catálogo: textos en inglés y piezas PRO](#catálogo-textos-en-inglés-y-piezas-pro)
8. [Animación, SVG y remontajes](#animación-svg-y-remontajes)
9. [Datos en pantalla](#datos-en-pantalla)
10. [Sesión](#sesión)

---

## Instalación y toolchain

### El typecheck falla recién generado el proyecto · catálogo

- **Síntoma:** 7 errores TS2307 en `src/components/` justo después de `init`: no encuentra
  `@react-aria/utils`, `@react-stately/utils` ni `@react-types/overlays`.
- **Causa:** varios componentes generados importan esos paquetes directo (`useControlledState` en el
  date-picker y en `input-payment`, `filterDOMProps` en `file-upload-trigger`, el tipo `Placement` en
  `nav-account-card`), y el CLI no los declara.
- **Arreglo:** `npm i -D @react-aria/utils @react-stately/utils @react-types/overlays` (en el origen,
  `^3.34.1`, `^3.12.1` y `^3.10.0`). Si un `upgrade` deja de importarlos, quítalos.

### `calendar.tsx` no compila · catálogo + RAC

- **Síntoma:** `tsc` falla en `src/components/application/date-picker/calendar.tsx` y el build no pasa.
- **Causa:** el `CalendarContext` de react-aria-components 1.21 tipa `onChange` con la unión que incluye
  la selección de rango (`readonly DateValue[]`), y el `CalendarContextProvider` del starter guarda un
  solo valor.
- **Arreglo:** un parche local, la única excepción a «no tocar `src/components/`», con un comentario en el
  propio archivo que diga por qué:

  ```ts
  // PARCHE LOCAL: RAC 1.21 tipa onChange con la unión de rango. Revisar en cada upgrade.
  const onChange = (next: DateValue | readonly DateValue[]) => {
      setValue(Array.isArray(next) ? (next[0] ?? null) : (next as DateValue));
  };
  // …y pasar `onChange` en el `value` del provider en lugar de `setValue`.
  ```

  `upgrade` sobrescribe el archivo. Después de cada uno, corre `typecheck` sin el parche y vuelve a
  aplicarlo solo si falla. No está verificado si el catálogo ya lo corrigió.

### `@internationalized/date` se importa sin estar declarada · RAC

- **Síntoma:** ninguno hoy. El riesgo es que el import deje de resolver tras un `npm install`.
- **Causa:** es dependencia transitiva de react-aria-components, y los componentes generados del
  date-picker ya la importan directo.
- **Arreglo:** úsala igual que ellos (por ejemplo, `parseDate` para pasar `AAAA-MM-DD` a `DateValue`).
  Si algún día se rompe, decláralo en `package.json`.

### Vite se cae en Windows con «Rolldown panicked» · toolchain

- **Síntoma:** `npm run dev` y `vite build` caen con «Rolldown panicked… oxc_codegen sourcemap_builder…
  index out of bounds», o con un segfault sin mensaje, en cuanto `vite.config.ts` pasa de unas líneas.
  Pasa igual sin tus cambios y en rutas sin espacios.
- **Causa:** un bug de rolldown 1.2.9 en Windows.
- **Arreglo:** subir `rolldown` a 1.2.11 en el lockfile, que cabe en el `~1.2.6` que pide Vite 8.3.0. Si
  reaparece después de un `npm install`, mira qué versión quedó (`npm ls rolldown`) antes de tocar nada más.

### El tema parpadea o no respeta lo elegido al recargar · starter

- **Síntoma:** quien eligió el tema oscuro ve un destello claro al cargar, o al revés. El guardia
  anti-parpadeo de `index.html` nunca coincide con la preferencia real.
- **Causa:** el starter leía en `index.html` la clave `theme`, mientras `ThemeProvider` escribe en
  `ui-theme`.
- **Arreglo:** la misma clave en los dos (`ui-theme`) y el mismo valor por defecto: `defaultTheme="light"`
  en el provider y «sin valor guardado, claro» en el guardia. El guardia va en `try/catch`: con
  `localStorage` bloqueado (incógnito), se queda en claro.

---

## Tokens y Tailwind 4

### `ring-warning` y `border-warning` no existen · catálogo

- **Síntoma:** un aviso amarillo sale con un contorno casi negro.
- **Causa:** el tema trae `error_subtle` para bordes y anillos, pero ningún equivalente amarillo. Tailwind
  no avisa de un color que no existe, y el anillo cae al color del texto.
- **Arreglo:** `ring-warning_subtle` y `border-warning_subtle`, definidos como gemelos de `error_subtle`
  (yellow-300 en claro, yellow-500 en oscuro).
- **Ya resuelto en:** `src/styles/brand-dpb.css`.

### `bg-secondary_subtle` no existe · catálogo

- **Síntoma:** una fila «atenuada» sale sin fondo.
- **Causa:** el tema no define `secondary_subtle`, aunque suene a la serie `_alt`/`_hover` y haya
  aparecido en listas de tokens. Las variantes de la secundaria que existen son `bg-secondary_alt`,
  `bg-secondary_hover` y `bg-secondary-solid`. Los fondos de estado que sí existen son
  `bg-{success,warning,error}-{primary,secondary,solid}`.
- **Arreglo:** `bg-secondary` para atenuar. Antes de usar un token de una lista, búscalo en `theme.css`.

### Una variable de `@theme` no aparece en el CSS compilado · Tailwind 4

- **Síntoma:** `--color-accent-500` no está en el CSS del build, y parece que la rampa no se cargó.
- **Causa:** Tailwind 4 poda las variables de `@theme` que ninguna clase referencia.
- **Arreglo:** ninguno: es lo esperado, y la variable aparece en cuanto una clase la usa
  (`text-accent-600`). No la des por rota al inspeccionar el CSS.

### El token propio genera `bg-bg-canvas` · Tailwind 4

- **Síntoma:** declaraste `--color-bg-canvas` y la utilidad que existe es `bg-bg-canvas`.
- **Causa:** Tailwind arma `bg-*` desde el espacio `--color-*`, así que el `bg-` del nombre se duplica.
  Untitled UI resuelve sus fondos con un segundo espacio, `--background-color-*`.
- **Arreglo:** dos variables. `--color-bg-canvas` guarda el valor y es la que se redefine en
  `.dark-mode`; `--background-color-canvas: var(--color-bg-canvas)` es la que genera `bg-canvas`. Para un
  token de borde o de anillo, lo mismo con `--border-color-*` y `--ring-color-*`, como `warning_subtle`.
- **Ya resuelto en:** `src/styles/brand-dpb.css`.

### Los botones propios no muestran la mano · Tailwind 4

- **Síntoma:** un botón hecho con `AriaButton` o `<button>` muestra la flecha y parece no clicable. Lo
  mismo una `Table.Row` con `href`.
- **Causa:** el preflight de Tailwind 4 deja los botones con el cursor por defecto, y `Table.Row` no lo
  pone ni cuando navega.
- **Arreglo:** `cursor-pointer` explícito. `Button` y `ButtonUtility` del catálogo ya lo traen.
- **Ya resuelto en:** `src/features/shell/sidebar.tsx`.

### `transform-none` no anula un realce · Tailwind 4

- **Síntoma:** con «reducir movimiento» activado, el logo se sigue elevando al pasar el ratón.
- **Causa:** Tailwind 4 genera `translate-*` y `scale-*` como las propiedades CSS `translate` y `scale`,
  no como `transform`, y `transform-none` no las toca.
- **Arreglo:** anula cada una: `motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100`.

---

## Scroll, recortes y desbordes

### Un área con scroll se confunde con la página · CSS

- **Síntoma:** la rueda «no hace nada» o la página parece trabada; una lista larga se lee como parte de la
  página.
- **Causa:** un área con scroll sin borde no se distingue, y anidada dentro de otra que también se
  desplaza, la rueda mueve la de dentro.
- **Arreglo:** el scroll va en un `div` con contorno (`rounded-lg ring-1 ring-secondary`) que lleva el
  `max-h-*` y el `overflow-y-auto`, no en el `<ul>` pelado. Y no anides áreas con scroll: dentro de un
  diálogo, el cuerpo ya se desplaza.
- **Ya resuelto en:** `AREA_TABLA` (`tabla.ts`) y el cuerpo de `TarjetaDialogo`.

### El encabezado fijo de la tabla se va con las filas · catálogo

- **Síntoma:** le pusiste `sticky top-0` al `Table.Header` y al bajar se desplaza igual.
- **Causa:** `Table` envuelve la `<table>` en un `div` con `overflow-x-auto` (y a la tabla le pone
  `overflow-x-hidden`). `sticky` se pega al ancestro con scroll más cercano, ese `div`, que solo se mueve
  en horizontal.
- **Arreglo:** el área de fuera anula esos overflow (`[&>div]:overflow-visible
  [&_table]:overflow-visible`) y hace todo el scroll; el encabezado lleva `sticky top-0 z-10` (su fondo ya
  es opaco, así que las filas pasan por debajo sin transparentarse).
- **Ya resuelto en:** `AREA_TABLA` + `ENCABEZADO_FIJO` (`tabla.ts`).

### Aparece un segundo scroll, el de la página entera · CSS

- **Síntoma:** además del scroll de la tabla, el documento crece (en el origen, a ~2500 × 2400 px) y
  aparece otra barra encima.
- **Causa:** `sr-only` es `position: absolute`, y un `overflow` solo recorta a los `absolute` cuyo bloque
  contenedor es él o algo dentro de él. Sin un ancestro posicionado, el bloque contenedor es la ventana, y
  los `sr-only` de las celdas de la derecha y de abajo estiran el documento.
- **Arreglo:** toda área con scroll que envuelva contenido con `sr-only` es `relative`. `main` del layout
  también, como red.
- **Ya resuelto en:** `AREA_TABLA`, `AREA_TABLA_PROPIA` y `src/layouts/app-layout.tsx`.

### El diálogo entero se desplaza y la cabecera se va de la vista · CSS + RAC

- **Síntoma:** en una ventana baja, con una casilla o un interruptor al final del cuerpo, el fondo del
  diálogo se estira y el diálogo completo se mueve.
- **Causa:** la misma: `Checkbox` y `Toggle` de React Aria esconden su `<input>` con `position: absolute`,
  que escapa del recorte del cuerpo si nada en medio es `relative`.
- **Arreglo:** el cuerpo con scroll es `relative`. No lo resuelvas con un margen negativo: dentro del área
  con scroll, lo que sube se recorta.
- **Ya resuelto en:** `TarjetaDialogo`.

### `sr-only` no achica una `<table>` · CSS

- **Síntoma:** scroll horizontal en móvil sin nada visible que desborde (en el origen, la tabla accesible
  de una gráfica medía 323 px).
- **Causa:** `sr-only` pone `width: 1px`, pero una tabla ignora el ancho y se estira a su contenido.
- **Arreglo:** el `sr-only` va en un `<div>` que envuelve la tabla, nunca en la tabla. Para cazar
  desbordes así, compara `main.scrollWidth` con `main.clientWidth` en la consola.

### El scroll se va a `main` y se lleva los filtros y el paginador · CSS

- **Síntoma:** en un listado, en vez de desplazarse la tabla, se desplaza la pantalla entera.
- **Causa:** un hijo flex toma como alto mínimo el de su contenido; sin `min-h-0`, crece más allá de la
  tarjeta y quien se desplaza es `main`.
- **Arreglo:** `min-h-0` en cada nivel flex entre `main` y el área con scroll (el contenedor del cuerpo,
  `Tabs`, `Tabs.Panel`) y `flex-1` en el área. No lo contengas con `overflow-hidden`: recorta las filas
  de más en vez de dejar llegar a ellas.

### El anillo de foco sale recortado · CSS

- **Síntoma:** el primer o el último campo de un área con scroll, o un enlace de la navegación, muestran
  el anillo de foco cortado.
- **Causa:** el `overflow` recorta lo que sale de la caja, y el anillo está fuera.
- **Arreglo:** holgura dentro del área: `-mx-1 px-1` en la navegación y `py-1` en el cuerpo del diálogo.
- **Ya resuelto en:** `sidebar.tsx` y `TarjetaDialogo`.

---

## Diálogos

### `Modal` y `Dialog` no traen tarjeta ni límite de alto · catálogo (starter del 17/09/2026)

- **Síntoma:** un formulario largo se desplaza entero y se lleva el título y «Guardar»; o el diálogo
  ocupa todo el ancho.
- **Causa:** en el starter con que se hizo app-presupuestos (react-aria-components 1.21), `Modal` y
  `Dialog` solo ponían posición, animación y fondo, y `Modal` era `w-full` sin ancho máximo.
- **Arreglo:** la tarjeta la ponía `TarjetaDialogo` (cabecera y pie fijos, scroll solo en el cuerpo, tope
  de `85dvh`) y el `max-w-*` iba en cada `Modal`.
- **Nota:** **cambió en el starter vigente.** El `Modal` ya trae superficie (fondo, `shadow-xl`,
  `rounded-xl sm:rounded-2xl`) y alto máximo. La trampa actual es la siguiente.

### El `Dialog` desplaza todo, cabecera y pie incluidos · catálogo (starter vigente)

- **Síntoma:** en un formulario largo, el título, la × y «Guardar» se van con el scroll.
- **Causa:** el `Dialog` del starter vigente es `max-h-[inherit] overflow-y-auto`: el scroll es de todo su
  contenido, no solo del cuerpo.
- **Arreglo:** `TarjetaDialogo` como **hijo directo** de `Dialog`. Toma `max-h-[inherit]`, deja el scroll
  solo en el cuerpo y conserva `ring-1 ring-secondary` con las esquinas del `Modal`, para que el borde se
  vea en modo oscuro. No le pongas otra área con `overflow-y-auto` alrededor.
- **Ya resuelto en:** `src/features/comunes/tarjeta-dialogo.tsx`.

### Los botones de una confirmación se salen de la ventana · diseño

- **Síntoma:** con un texto largo o una lista (los pendientes que impiden una operación), el pie queda
  fuera de la pantalla.
- **Causa:** el texto iba como descripción, en la cabecera, que es fija y no se desplaza.
- **Arreglo:** el texto de una confirmación va en el cuerpo, que sí se desplaza.
- **Ya resuelto en:** `src/features/comunes/confirmar-dialog.tsx`.

### El diálogo muestra los datos del registro anterior · React

- **Síntoma:** abres «Editar» sobre otro registro y salen los valores del primero que editaste, o lo que
  habías escrito antes de cancelar.
- **Causa:** el diálogo no se desmonta al cerrarse (se cierra el overlay), así que un `useState(prop)`
  leyó la prop solo la primera vez.
- **Arreglo:** carga los valores en un efecto que corre al abrir (`if (!abierto) return;` y las
  dependencias `[abierto, registro]`).

### El formulario se vacía con cada tecla · React

- **Síntoma:** escribes en un campo y el formulario vuelve a sus valores iniciales.
- **Causa:** el efecto de reinicio tiene en sus dependencias un objeto (`inicial`) que el padre arma nuevo
  en cada render.
- **Arreglo:** reinicia solo al abrir, con `abierto` como dependencia y sin ese objeto.

### El error del intento anterior sigue ahí al reabrir · RAC

- **Síntoma:** cierras con Escape o con un clic fuera y, al volver a abrir, el error viejo sigue a la vista.
- **Causa:** Escape y el clic fuera los dispara el overlay por `onOpenChange`; no pasan por el handler del
  botón Cancelar.
- **Arreglo:** todas las salidas por un solo handler conectado a `onOpenChange`, que limpia el error al
  cerrar.

### El mismo error se anuncia dos veces · accesibilidad

- **Síntoma:** el lector de pantalla repite el error, y al cerrar el diálogo queda uno visible detrás.
- **Causa:** la página y el diálogo pintan el mismo error con `role="alert"`.
- **Arreglo:** un error, un sitio. Con un diálogo abierto, el error va en él y la página no lo pinta.

---

## Tablas y filas

### `<Table size="sm">` no cambia el alto de las filas · catálogo

- **Síntoma:** todas las filas salen de 72 px (`h-18`) aunque pidas `sm`.
- **Causa:** `TableRoot` resuelve `context?.size ?? size`, y `TableContext` trae `{ size: "md" }` por
  defecto: el contexto nunca es `undefined` y la prop no se lee jamás.
- **Arreglo:** el `size` va en `Table.Header` y en cada `Table.Row`, que sí respetan el suyo. Para afinar
  el alto, una `h-11` en el `className` de la fila gana sobre la `h-14` del componente, porque `cx` es
  tailwind-merge.
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

### El badge sale tachado, o un texto de la fila inactiva no · CSS

- **Síntoma:** en una fila inactiva, el badge «Inactiva» queda tachado e ilegible; o, al revés, el texto
  que vive dentro de una caja `inline-flex` no se tacha.
- **Causa:** el `line-through` de la celda lo heredan todos sus hijos, en bloque y en flex, salvo las
  cajas en línea atómicas (`inline-block`, `inline-flex`).
- **Arreglo:** envuelve el badge en un `inline-block` para que no se tache, y al texto que vive dentro de
  una caja atómica, o que trae su propio color, ponle el tachado explícito.
- **Ya resuelto en:** `claseFila`, `SIN_TACHAR` y `TACHADO_INACTIVO` (`estado-fila.ts`).

### La columna fija de una `<table>` propia casi no se mueve · CSS

- **Síntoma:** una celda `sticky left-0` con `colSpan` acompaña al scroll un par de columnas y se va, o no
  se mueve nada.
- **Causa:** un elemento `sticky` solo se desplaza dentro de su bloque contenedor, que para una celda es la
  tabla. Una celda que abarca casi todas las columnas no tiene a dónde moverse.
- **Arreglo:** ancla el contenido de la celda, no la celda: un hijo `sticky w-fit` con su `left-*` igual al
  padding de la celda.

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

### `Toggle` abre un scroll horizontal o aplasta el interruptor · catálogo

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

- **Síntoma:** un campo numérico con «3e» se guarda como vacío, que puede significar otra cosa (en el
  origen, «no avisa»).
- **Causa:** con `type="number"`, el navegador entrega una cadena vacía ante un valor que no es número.
- **Arreglo:** `inputMode="numeric"`, que da el teclado numérico en móvil, y valida tú el texto.

### `Select` no vuelve a «Todas» · RAC

- **Síntoma:** una vez elegido un filtro, no hay forma de volver a «sin filtrar».
- **Causa:** `Select` necesita una clave, y `undefined` no lo es.
- **Arreglo:** una opción centinela (`"__todas__"`) que el filtro traduce a `undefined`.

### Un control nativo pinta el chrome del sistema · navegador

- **Síntoma:** el desplegable sale con el azul del sistema operativo; la fecha, con `dd/mm/aaaa` y el
  calendario del navegador.
- **Causa:** `<select>`, `<input type="date">` y `NativeSelect` (que es justo el `<select>` del sistema)
  los dibuja el navegador.
- **Arreglo:** `Select` e `InputDate` del catálogo, siempre.

---

## Catálogo: textos en inglés y piezas PRO

### Textos fijos en inglés que no se pueden editar · catálogo

- **Síntoma:** «Previous» y «Next», el pie del `MultiSelect`, el `DropZone`, el `DateRangePicker`, el
  «Notifications» que anuncia el lector de pantalla, la 404 «We can't find that page».
- **Causa:** el catálogo trae texto fijo, y `src/components/` no se edita.
- **Arreglo:** apágalo por props o compón con otras piezas del catálogo:

  | Viene en inglés | Salida |
  | --- | --- |
  | Pie del `MultiSelect` | `showFooter={false}` |
  | `PaginationPageDefault` | `Paginacion` (dos `Button` del catálogo) |
  | `DateRangePicker` | dos `InputDate` encadenados con `minValue` y `maxValue` |
  | `DropZone` y los ítems de `file-upload` | `FileTrigger` + `Button` y una ficha propia; su `<input>` va con `display: none`, así que no escapa de ningún recorte |
  | `containerAriaLabel` del `Toaster` de `sonner` | `containerAriaLabel="Notificaciones"` |
  | `not-found.tsx` del starter | `src/pages/no-encontrada.tsx` |

  Sin salida: el placeholder «Search» del buscador del `MultiSelect`. Se acepta cuando perder la búsqueda
  (sobre más de un centenar de opciones, en el origen) es peor que un texto en inglés.
- **Ya resuelto en:** `paginacion.tsx`, `notificaciones.tsx` y `no-encontrada.tsx`.

### El toast del catálogo pide `login` · catálogo

- **Síntoma:** `npx untitledui@latest add` de las notificaciones pide iniciar sesión.
- **Causa:** el toast de Untitled UI (`notifications`) es PRO.
- **Arreglo:** `sonner`, la misma librería sobre la que el catálogo monta el suyo (pone la pila, el tiempo,
  la pausa y el `aria-live`), con el aspecto hecho con tokens.
- **Ya resuelto en:** `src/features/comunes/notificaciones.tsx`.

### `application/empty-state` no sigue los tokens · catálogo

- **Síntoma:** el vacío del starter se ve distinto en oscuro y trae una ilustración ajena a la app.
- **Causa:** usa tokens no semánticos (`from-neutral-50 to-neutral-200`) y una ilustración decorativa.
- **Arreglo:** `EstadoVacio` de la plantilla, que sigue el bloque del origen.

---

## Animación, SVG y remontajes

### La transición de entrada solo se ve la primera vez · React

- **Síntoma:** al navegar entre pantallas no hay transición; solo se vio al cargar la app.
- **Causa:** `animate-in` se aplica al montar. Cada pantalla monta su propio `AppLayout` en la misma
  posición, y React lo reconcilia en vez de montarlo de nuevo.
- **Arreglo:** una `key` con el `pathname` en lo que se anima, siempre con `motion-reduce:animate-none`.
- **Ya resuelto en:** `src/layouts/app-layout.tsx`.

### La cabecera sale duplicada · React

- **Síntoma:** con un elemento delante (una franja de aviso), la cabecera aparece dos veces en cada render.
- **Causa:** el header y el `main` eran hermanos con la misma `key` (el `pathname`), y React no sabía cuál
  era cuál.
- **Arreglo:** prefijos distintos: `encabezado:${pathname}` y `contenido:${pathname}`.
- **Ya resuelto en:** `src/layouts/app-layout.tsx`.

### Un `transform` de CSS borra el del dibujo SVG · CSS

- **Síntoma:** al animar una parte de un logo SVG, se mueve de lugar o pierde un detalle.
- **Causa:** un `transform` de CSS pisa el atributo `transform` del mismo elemento.
- **Arreglo:** cada movimiento en su propio `<g>`, por fuera del `<g>` que lleva la transformación del
  dibujo.

### Con dos logos en pantalla, uno sale sin degradado · navegador

- **Síntoma:** la segunda instancia de un SVG con `<linearGradient>` se pinta mal.
- **Causa:** dos `id` iguales en el documento; el `url(#id)` de la segunda apunta a la primera.
- **Arreglo:** el `id` sale de `useId()`. El isotipo DPB no tiene degradados; aplica a una marca propia
  que los tenga, como la de app-presupuestos.

### Lo que debe pasar una vez por sesión pasa en cada pantalla · React

- **Síntoma:** la entrada del logo, o la petición que arma el menú, se repite en cada navegación.
- **Causa:** la sidebar se remonta con cada página (cada una monta su `AppLayout`), y un `useState` se
  pierde con ella.
- **Arreglo:** una bandera o un almacén a nivel de módulo (`useSyncExternalStore` para datos). Márcala en
  un efecto, no en el inicializador del estado: en desarrollo, StrictMode llama dos veces al inicializador
  y en la segunda llamada ya no animaría.

---

## Datos en pantalla

### Una fecha sale un día antes · navegador

- **Síntoma:** «2026-10-31» se muestra como 30/10/2026.
- **Causa:** `new Date("2026-10-31")` es medianoche UTC, y en Guatemala (UTC−6) se pinta el día anterior.
- **Arreglo:** una fecha de calendario (`AAAA-MM-DD`) no pasa por `Date`: se formatea partiendo la cadena,
  y para un `InputDate` se convierte con `parseDate` de `@internationalized/date`.

### Los montos compactos mezclan sufijos · navegador

- **Síntoma:** «1.7 K» y «12.5 k» en la misma columna.
- **Causa:** `Intl.NumberFormat` con `notation: "compact"` en `es-GT`.
- **Arreglo:** un formateador compacto propio, y el monto exacto en el `title`.

### Las fotos por fila agotan el rate limit · API

- **Síntoma:** un listado con fotos dispara una petición por persona y el backend responde 429.
- **Causa:** un `<img src>` no puede mandar el Bearer, así que la foto viaja en base64 dentro del envelope y
  cada una es una petición autenticada contra el límite del usuario.
- **Arreglo:** iniciales en los listados (`Avatar` con `initials`); la foto, solo al abrir una persona, y la
  propia cacheada por sesión.

### Los avisos siguen ahí al volver a la pestaña · sonner

- **Síntoma:** parece un aviso trabado.
- **Causa:** con la pestaña oculta, `sonner` pausa el conteo.
- **Arreglo:** ninguno: es a propósito, para que nadie se pierda un aviso que no vio.

### Las doce etiquetas del eje de meses se enciman · recharts

- **Síntoma:** en móvil, los nombres de los meses se pisan.
- **Causa:** `interval={0}` fuerza a pintar todas las etiquetas.
- **Arreglo:** `interval="preserveStartEnd"` con `minTickGap`.

---

## Sesión

### «Cerrar sesión» saca al usuario de todo Microsoft 365 · MSAL

- **Síntoma:** al salir de la app, el usuario pierde también la sesión de Outlook, Teams y SharePoint.
- **Causa:** `logoutRedirect()` hace un cierre federado contra Entra ID.
- **Arreglo:** cierre local con `clearCache()`. Como la cookie de Microsoft sobrevive, el inicio de sesión
  fuerza `prompt: "select_account"`: sin eso, el siguiente clic devuelve en silencio a la misma cuenta y
  parece que salir no hizo nada. Los dos cambios van juntos; no toques uno sin el otro.

### Al recargar se ve el login un instante · auth

- **Síntoma:** con la sesión viva, recargar muestra la pantalla de acceso un momento antes de volver.
- **Causa:** la ruta protegida redirige antes de que MSAL termine de restaurar la cuenta.
- **Arreglo:** no redirijas mientras se restaura; muestra `LoadingIndicator` con «Restaurando sesión…» en
  su lugar.
