import type { SVGProps } from "react";

/**
 * Isotipo corporativo de Desarrollos Palo Blanco: la casa y sus cuatro cuadros, inline. Ningún
 * proyecto lo edita: la geometría es la de `public/marca/dpb-isotipo.svg` (favicon y archivo
 * suelto), copiada tal cual.
 *
 * -- Las variantes ----------------------------------------------------------
 * - `color`: casa azul #2C589A (`brand-600`) y cuadros rojos #CC1F37 (`accent-600`). Sobre
 *   fondos claros.
 * - `white`: todo blanco. Sobre el azul o el rojo de marca, como el panel del login: a color,
 *   la casa desaparece contra #2C589A.
 * - `mono`: una tinta, `currentColor`, para sello e impresión. El color lo pone quien lo usa
 *   (`text-fg-primary`, por ejemplo).
 *
 * Reglas de marca: no deformar, no rotar, no recolorear fuera de estas tres variantes. Por eso
 * `viewBox` y `preserveAspectRatio` no se aceptan como props: con `meet`, aunque la caja cambie
 * de proporción, el dibujo conserva la suya. El viewBox no es cuadrado (126 × 136): `size` es el
 * lado de la caja y el isotipo la llena a lo alto.
 *
 * Accesibilidad: sola, es una imagen con nombre («Desarrollos Palo Blanco»). Junto a un texto
 * que ya dice el nombre, como el lockup, va con `aria-hidden` y entonces no lleva `role` ni
 * `aria-label`: el lector de pantalla lo leería dos veces.
 */
export type DpbIsotipoVariant = "color" | "white" | "mono";

const TINTAS: Record<DpbIsotipoVariant, { casa: string; cuadros: string }> = {
    color: { casa: "#2C589A", cuadros: "#CC1F37" },
    white: { casa: "#FFFFFF", cuadros: "#FFFFFF" },
    mono: { casa: "currentColor", cuadros: "currentColor" },
};

/** Geometría de `public/marca/dpb-isotipo.svg`. No editar a mano. */
const VIEW_BOX = "62 14 126 136";
const CASA = "m124.7 19.39-57.17 27.52v98.41h114.8v-97.81l-57.68-28.12zm54.57 123.2h-109.1v-93.8l54.6-26.08 54.54 26.51v93.37z";
const CUADROS = [
    "m112.7 53.27 28.83-12.69 13.44 29.05-29.02 14.6-13.25-30.96z",
    "m80.07 69.62 27.94-13.14 13.25 29.31-27.95 12.77-13.24-28.94z",
    "m127.7 87.72 29.15-13.31 12.72 28.7-28.5 13.45-13.37-28.84z",
    "m95.32 103.1 28.32-13.09 12.72 28.34-27.71 12.69-13.33-27.94z",
] as const;

interface DpbIsotipoProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height" | "viewBox" | "preserveAspectRatio"> {
    size?: number;
    variant?: DpbIsotipoVariant;
}

export const DpbIsotipo = ({ size = 32, variant = "color", ...props }: DpbIsotipoProps) => {
    const { casa, cuadros } = TINTAS[variant];
    const decorativo = props["aria-hidden"] === true || props["aria-hidden"] === "true";

    return (
        <svg
            width={size}
            height={size}
            viewBox={VIEW_BOX}
            preserveAspectRatio="xMidYMid meet"
            focusable="false"
            role={decorativo ? undefined : "img"}
            aria-label={decorativo ? undefined : "Desarrollos Palo Blanco"}
            {...props}
        >
            <path d={CASA} fill={casa} />
            {/* El trazo, del color del relleno, engrosa los cuadros como en el archivo original. */}
            <g fill={cuadros} stroke={cuadros} strokeMiterlimit={10} strokeWidth={1.417}>
                {CUADROS.map((d) => (
                    <path key={d} d={d} />
                ))}
            </g>
        </svg>
    );
};
