import { cx } from "@/utils/cx";

/**
 * Lo que se pinta mientras llega una carga: la forma de lo que viene, no un spinner. `Esqueleto` es el
 * de todo listado (N barras); para otra forma (una rejilla de cifras, una gráfica) se compone con
 * `BLOQUE_ESQUELETO` dentro de un contenedor con `aria-busy="true"` y `aria-label`.
 */

/** Un bloque gris que late. `motion-reduce` lo deja quieto para quien pidió menos movimiento. */
export const BLOQUE_ESQUELETO = "animate-pulse rounded-lg bg-secondary motion-reduce:animate-none";

interface EsqueletoProps {
    /** Qué se está cargando, para el lector de pantalla: «Cargando cuentas». */
    etiqueta: string;
    /** Cuántas barras. Que se parezca a lo que llegará, para que la pantalla no salte al cargar. */
    filas?: number;
    /** El alto de cada barra, como clase de Tailwind (`h-12` ≈ una fila compacta de tabla). */
    altoFila?: string;
    className?: string;
}

/** `role="status"` para que el `aria-label` cuente: en un `div` sin rol, el lector de pantalla lo ignora. */
export const Esqueleto = ({ etiqueta, filas = 8, altoFila = "h-12", className }: EsqueletoProps) => (
    <div role="status" aria-busy="true" aria-label={etiqueta} className={cx("flex flex-col gap-2", className)}>
        {Array.from({ length: filas }, (_, indice) => (
            <div key={indice} className={cx(BLOQUE_ESQUELETO, altoFila)} />
        ))}
    </div>
);
