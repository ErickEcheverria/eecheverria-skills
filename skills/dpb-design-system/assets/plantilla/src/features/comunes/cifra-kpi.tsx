import type { FC, ReactNode } from "react";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

/**
 * Una cifra destacada de un tablero o un inicio. Pinta `<dt>`/`<dd>`, así que va dentro de un `<dl>`:
 * `<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><CifraKpi …/></dl>`.
 */

interface CifraKpiProps {
    etiqueta: string;
    valor: string;
    /** La lectura completa en el `title`, cuando `valor` va compacto («Q 1.2 M» → «Q 1,203,450.00»). */
    exacto?: string;
    /** Una línea debajo: el desglose o qué significa. */
    detalle?: ReactNode;
    icono?: FC<{ className?: string }>;
    /** `alerta` pinta el número y el ícono en rojo; el `detalle` tiene que decir por qué con palabras. */
    tono?: "normal" | "alerta";
    children?: ReactNode;
}

/**
 * El número manda; la etiqueta y el detalle lo explican, y el ícono va arriba a la derecha para que la
 * tarjeta no quede con un hueco. El color nunca va solo: si la cifra alerta, el detalle lo dice.
 */
export const CifraKpi = ({ etiqueta, valor, exacto, detalle, icono, tono = "normal", children }: CifraKpiProps) => (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-primary p-4 ring-1 ring-secondary">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <dt className="text-sm font-medium text-tertiary">{etiqueta}</dt>
                <dd
                    title={exacto}
                    className={cx("mt-1 truncate text-display-xs font-semibold tabular-nums", tono === "alerta" ? "text-error-primary" : "text-primary")}
                >
                    {valor}
                </dd>
            </div>
            {icono && <FeaturedIcon icon={icono} size="md" theme="light" color={tono === "alerta" ? "error" : "brand"} className="shrink-0" />}
        </div>
        {detalle && <dd className="text-xs text-tertiary">{detalle}</dd>}
        {children}
    </div>
);
