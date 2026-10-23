/**
 * Las clases de toda tabla de listado: el área con scroll que la envuelve, su encabezado fijo y el alto
 * de fila. Se usan juntas: `<div className={AREA_TABLA}><Table>…</Table></div>`.
 */

/**
 * El `div` que envuelve un `Table` del catálogo. Es la ÚNICA área con scroll y lleva contorno: sin
 * borde se lee como si fuera la página.
 *
 * Anula dos `overflow` del catálogo: `Table` mete la `<table>` en un `div` con `overflow-x-auto` y a la
 * `<table>` le pone `overflow-x-hidden`. `sticky` se pega al ancestro con scroll más cercano, y con ese
 * `div` en medio el encabezado se pegaba a él y se iba con las filas al bajar. El paquete no se edita
 * desde la app, así que se anula desde aquí: los dos pasan a `overflow-visible` y todo el scroll es de esta área.
 *
 * Es `relative`, y no es decorativo: un `sr-only` es `position: absolute` y un `overflow` solo lo recorta
 * si es su bloque contenedor. Sin nada posicionado en medio, el de las celdas de abajo y de la derecha
 * agrandaba el DOCUMENTO y la página ganaba un segundo scroll encima del del área.
 */
export const AREA_TABLA = "relative min-h-0 flex-1 overflow-auto rounded-xl ring-1 ring-secondary [&>div]:overflow-visible [&_table]:overflow-visible";

/**
 * Para `Table.Header`. El fondo ya lo trae el componente (opaco), así que las filas pasan por debajo sin
 * transparentarse; `z-10` lo pone sobre las celdas, que son `relative`. `cx` es tailwind-merge: `sticky`
 * gana sobre el `relative` del componente.
 */
export const ENCABEZADO_FIJO = "sticky top-0 z-10";

/** El área de una `<table>` propia, escrita a mano: el mismo contorno y el mismo `relative`, sin los arreglos del catálogo. */
export const AREA_TABLA_PROPIA = "relative min-h-0 flex-1 overflow-auto rounded-xl ring-1 ring-secondary";

/**
 * La fila compacta: `<Table.Row {...FILA}>`, y `size={FILA.size}` también en `Table.Header`.
 *
 * El `size` de `<Table>` NO llega a las filas: `TableRoot` lo resuelve con `context?.size ?? size` y el
 * contexto tiene por defecto `{ size: "md" }`, así que el `??` nunca mira la prop y todas salían con
 * `h-18`. `Table.Header` y `Table.Row` sí respetan la suya. La `h-11` (44 px) gana sobre la `h-14` del
 * componente porque `cx` es tailwind-merge.
 *
 * `Table.Cell` tampoco ve el `size` de la fila: lo toma del mismo contexto (`md` → `py-4`) y la fila
 * crecía a 54 px aunque pidiera `h-11`. `*:py-2` baja el relleno vertical de sus celdas sin tocar el
 * `px-6`, que es lo que las alinea con `Table.Head`; pasar `size="sm"` a cada celda las desalineaba.
 * Si la fila usa `claseFila`, pásale `FILA.className` como base.
 */
export const FILA = { size: "sm", className: "h-11 *:py-2" } as const;
