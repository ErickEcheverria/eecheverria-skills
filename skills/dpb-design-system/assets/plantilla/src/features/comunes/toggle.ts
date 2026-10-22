/**
 * `className` de un `Toggle` del catálogo con hint. Se pasa SIEMPRE que tenga hint:
 * `<Toggle label="…" hint="…" className={TOGGLE_ANCHO_COMPLETO} />`.
 *
 * El componente trae `w-max`: se estira al ancho de su texto, el hint no parte línea y el diálogo abre
 * un scroll horizontal. `w-full` lo corrige, pero entonces el texto reclama todo el ancho y el flex
 * aplasta el interruptor. La segunda mitad lo impide: el bloque de texto (el ÚLTIMO hijo) pasa a
 * `flex-1 min-w-0` y solo toma el hueco que sobra. No se apunta al interruptor con `:first-child`
 * porque el primer hijo del `Switch` de React Aria es su `<input>` oculto.
 */
export const TOGGLE_ANCHO_COMPLETO = "w-full [&>:last-child]:min-w-0 [&>:last-child]:flex-1";
