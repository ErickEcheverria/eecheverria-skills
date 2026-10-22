import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

/**
 * Lo que se pinta cuando una carga terminó bien pero no trajo nada. `relleno` ocupa el área de un
 * listado; `punteado` es el hueco discreto dentro de una tarjeta, donde empezar vacío también informa.
 */

interface EstadoVacioProps {
    /**
     * Qué pasa, en una frase. Son DOS textos según por qué está vacío: «El catálogo de cuentas está
     * vacío» si no hay nada, y «Ninguna cuenta coincide con la búsqueda» si lo vació un filtro. Con el
     * mismo texto, quien filtró creería que no hay datos y volvería a cargarlos sin necesidad.
     */
    titulo: string;
    /** Qué hacer: cómo llenarlo o qué filtro quitar. Texto en línea (va en un `<p>`). */
    descripcion?: ReactNode;
    /** El botón que saca del vacío («Importar», «Nueva cuenta»). Solo en el vacío de verdad: con filtros, la salida es quitarlos. */
    accion?: ReactNode;
    variante?: "relleno" | "punteado";
    /** Para el contenedor; p. ej. quitar el `flex-1` si no vive en una columna flex. */
    className?: string;
}

const ESTILO = {
    relleno: {
        caja: "rounded-xl bg-secondary p-12 ring-1 ring-secondary",
        titulo: "text-sm font-semibold text-primary",
        descripcion: "max-w-md",
        accion: "mt-5",
    },
    punteado: {
        caja: "rounded-lg border border-dashed border-secondary px-4 py-6",
        titulo: "text-sm font-medium text-secondary",
        descripcion: "max-w-sm",
        accion: "mt-4",
    },
} as const;

export const EstadoVacio = ({ titulo, descripcion, accion, variante = "relleno", className }: EstadoVacioProps) => {
    const estilo = ESTILO[variante];
    // El relleno encabeza el área de un listado; el punteado vive bajo el `<h2>` de su tarjeta.
    const Titulo = variante === "relleno" ? "h3" : "p";

    return (
        <div role="status" className={cx("flex flex-1 flex-col items-center justify-center text-center", estilo.caja, className)}>
            <Titulo className={estilo.titulo}>{titulo}</Titulo>
            {descripcion && <p className={cx("mt-1 text-sm text-tertiary", estilo.descripcion)}>{descripcion}</p>}
            {accion && <div className={estilo.accion}>{accion}</div>}
        </div>
    );
};
