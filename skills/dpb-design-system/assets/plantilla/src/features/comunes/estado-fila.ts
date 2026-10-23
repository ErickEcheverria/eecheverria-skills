import { cx } from "@desarrollospaloblanco/ui/utils/cx";

/**
 * Cómo se ve en un listado un registro INACTIVO, igual en todas las pantallas:
 * `<Table.Row {...FILA} className={claseFila(FILA.className, item.activo)}>`.
 *
 * Dos señales y no solo el badge: con decenas de filas, un badge gris entre verdes se pierde. El fondo
 * gris sutil y el texto tachado de TODA la fila agrupan de un vistazo lo que ya no se usa, y el tachado
 * sobrevive a una pantalla sin color o al daltonismo.
 *
 * El tachado se pone en cada celda y el navegador lo hereda a todo su texto, salvo a una caja en línea
 * atómica (`inline-block`, `inline-flex`): por eso el badge de estado va en `SIN_TACHAR` para que
 * «Inactivo» siga legible, y el texto que vive dentro de una de esas cajas lleva `TACHADO_INACTIVO`.
 */

/** La `className` de la fila: la base de la tabla, más fondo gris y texto tachado si está inactivo. */
export const claseFila = (base: string, activo: boolean): string =>
    cx(base, !activo && "bg-secondary hover:bg-secondary_hover [&>td]:text-tertiary [&>td]:line-through [&>td]:decoration-fg-quaternary");

/** Tachado y apagado explícitos para el texto que no hereda el de la celda o que trae su propio color fuerte. */
export const TACHADO_INACTIVO = "text-tertiary line-through decoration-fg-quaternary";

/** Envoltura de lo que NO debe tacharse aunque la fila esté inactiva: el badge de estado. */
export const SIN_TACHAR = "inline-block";
