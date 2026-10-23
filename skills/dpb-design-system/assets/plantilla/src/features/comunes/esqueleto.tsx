import { cx } from "@/utils/cx";

/**
 * Lo que se pinta mientras llega la PRIMERA carga: la forma de lo que viene, no un spinner. `Esqueleto`
 * es el de todo listado (N barras); para otra forma (una rejilla de cifras, una gráfica) compón bloques
 * `BLOQUE_ESQUELETO` con `aria-hidden` dentro de un contenedor `relative` con `role="status"` y un texto
 * `sr-only` («Cargando el inicio»), igual que aquí. En una recarga (página, búsqueda, filtro) no vuelvas
 * al esqueleto: deja los datos anteriores a la vista.
 */

/** Un bloque gris que late. `motion-reduce` lo deja quieto para quien pidió menos movimiento. */
export const BLOQUE_ESQUELETO = "animate-pulse rounded-lg bg-secondary motion-reduce:animate-none";

interface EsqueletoProps {
    /** Qué se está cargando, para el lector de pantalla: «Cargando cuentas». */
    etiqueta: string;
    /** Cuántas barras. Que se parezca a lo que llegará, para que la pantalla no salte al cargar. */
    filas?: number;
    /** El alto de cada barra, como clase de Tailwind. `h-11` es el de `FILA`, la fila de tabla. */
    altoFila?: string;
    className?: string;
}

/**
 * Una región `role="status"` anuncia su CONTENIDO, no su `aria-label`, y con `aria-busy` calla hasta que
 * termina: por eso la etiqueta va como texto `sr-only` dentro, sin `aria-busy`. Las barras son
 * `aria-hidden`: no hay nada que leer en ellas. `relative` contiene el `sr-only`, que es `absolute`.
 */
export const Esqueleto = ({ etiqueta, filas = 8, altoFila = "h-11", className }: EsqueletoProps) => (
    <div role="status" className={cx("relative flex flex-col gap-2", className)}>
        <span className="sr-only">{etiqueta}</span>
        {Array.from({ length: filas }, (_, indice) => (
            <div key={indice} aria-hidden className={cx(BLOQUE_ESQUELETO, altoFila)} />
        ))}
    </div>
);
