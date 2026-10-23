import type { FC, ReactNode } from "react";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

/**
 * Una cifra destacada de un tablero o un inicio. Pinta `<dt>`/`<dd>`, así que va dentro de un `<dl>`:
 * `<dl className="grid grid-cols-1 gap-4 md:grid-cols-3"><CifraKpi …/></dl>` (tantas columnas como cifras).
 */

interface CifraKpiProps {
    etiqueta: string;
    valor: string;
    /**
     * La lectura completa cuando `valor` va compacto («Q 1.2M» → «Q 1,203,450.00»). Va en el `title` para
     * el ratón y como texto `sr-only` para el lector de pantalla; en táctil el `title` no se alcanza, así
     * que si el exacto importa en móvil, ponlo también en `detalle`.
     */
    exacto?: string;
    /** Una línea debajo: el desglose o qué significa. */
    detalle?: ReactNode;
    icono?: FC<{ className?: string }>;
    /** `alerta` pinta el número y el ícono en rojo; el `detalle` tiene que decir por qué con palabras. */
    tono?: "normal" | "alerta";
    children?: ReactNode;
}

/**
 * El `div` de la tarjeta ES el grupo del `<dl>`: el HTML solo admite `dt`/`dd` como hijos directos de un
 * `div` hijo del `dl`. Un nivel más de `div` para el layout deja la lista inválida y el lector de
 * pantalla deja de asociar la etiqueta con su cifra. Por eso el ícono va DENTRO del `dt`, posicionado
 * arriba a la derecha, y no como hermano; y es `relative` también para contener el `sr-only`.
 *
 * El número manda; la etiqueta y el detalle lo explican. El color nunca va solo: si la cifra alerta, el
 * detalle lo dice.
 */
export const CifraKpi = ({ etiqueta, valor, exacto, detalle, icono, tono = "normal", children }: CifraKpiProps) => (
    <div className="relative flex min-w-0 flex-col gap-1 rounded-xl bg-primary p-4 ring-1 ring-secondary">
        <dt className={cx("text-sm font-medium text-tertiary", icono && "pr-12")}>
            {etiqueta}
            {icono && (
                <span aria-hidden className="absolute top-4 right-4">
                    <FeaturedIcon icon={icono} size="md" theme="light" color={tono === "alerta" ? "error" : "brand"} />
                </span>
            )}
        </dt>
        <dd
            title={exacto}
            className={cx("truncate text-display-xs font-semibold tabular-nums", icono && "pr-12", tono === "alerta" ? "text-error-primary" : "text-primary")}
        >
            {valor}
            {exacto && <span className="sr-only"> ({exacto})</span>}
        </dd>
        {detalle && <dd className="text-xs text-tertiary">{detalle}</dd>}
        {children && <dd>{children}</dd>}
    </div>
);
