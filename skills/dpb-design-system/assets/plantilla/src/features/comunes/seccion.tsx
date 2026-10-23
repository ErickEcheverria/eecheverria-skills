import type { ReactNode } from "react";
import { useId } from "react";
import { cx } from "@desarrollospaloblanco/ui/utils/cx";

/**
 * Un bloque de una pantalla de detalle o de configuración, con su título, su descripción y una acción
 * arriba a la derecha.
 */

interface SeccionProps {
    titulo: string;
    descripcion?: string;
    /** Acción de la sección, arriba a la derecha. */
    accion?: ReactNode;
    children: ReactNode;
    /** Ajustes del contenedor. En el inicio va `bg-primary p-5`: con muchas tarjetas apiladas, el gris las vuelve una mancha. */
    className?: string;
}

/**
 * Es un `<section>` con `aria-labelledby` y un `<h2>` de verdad, no un `<div>` con texto en negrita:
 * con secciones apiladas y sin pestañas que den estructura, es lo único que le dice a un lector de
 * pantalla dónde empieza cada bloque y le permite saltar entre ellos. El único `<h1>` lo pone `AppLayout`.
 */
export const Seccion = ({ titulo, descripcion, accion, children, className }: SeccionProps) => {
    const tituloId = useId();

    return (
        <section aria-labelledby={tituloId} className={cx("rounded-xl bg-secondary p-6 ring-1 ring-secondary", className)}>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 id={tituloId} className="text-md font-semibold text-primary">
                        {titulo}
                    </h2>
                    {descripcion && <p className="mt-1 text-sm text-tertiary">{descripcion}</p>}
                </div>
                {accion && <div className="shrink-0">{accion}</div>}
            </div>

            <div className="mt-5">{children}</div>
        </section>
    );
};

/**
 * La rejilla de datos de una pantalla de detalle: `<Datos><Dato etiqueta="Código">PRV-0042</Dato>…</Datos>`.
 * Es un `<dl>` de verdad (cada `Dato` es su grupo `div` › `dt` + `dd`), así el lector de pantalla
 * asocia cada etiqueta con su valor. Una columna en móvil, dos desde `sm` y tres desde `lg`.
 */
export const Datos = ({ children, className }: { children: ReactNode; className?: string }) => (
    <dl className={cx("grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</dl>
);

export const Dato = ({ etiqueta, children }: { etiqueta: string; children: ReactNode }) => (
    <div className="min-w-0">
        <dt className="text-sm text-tertiary">{etiqueta}</dt>
        <dd className="mt-1 text-sm font-medium break-words text-primary">{children}</dd>
    </div>
);
