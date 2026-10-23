import { useId } from "react";

/**
 * Retícula isométrica de fondo para el panel de marca.
 *
 * Rombos en isometría, repetidos en grande y muy tenues: dan textura al panel sin competir
 * con el isotipo, que es el protagonista. Es fondo, no marca.
 *
 * La proporción del rombo no es arbitraria: media altura = media anchura ÷ √3, que es
 * la isometría real.
 *
 * El rombo inscrito en el mosaico, tocando los cuatro puntos medios de sus lados, tesela
 * sin costura. Por eso el patrón es una sola ruta.
 *
 * `aria-hidden` porque es decoración pura: no aporta nada a quien usa lector de pantalla. El id del
 * patrón sale de `useId()`: con uno fijo, dos retículas en la página se pisarían el `url(#…)`.
 */
const A = 24; // media anchura del rombo
const B = 13.856; // media altura = A / √3

export const IsoPattern = ({ className }: { className?: string }) => {
    const id = useId();

    return (
        <svg aria-hidden="true" className={className} width="100%" height="100%">
            <defs>
                <pattern id={id} width={A * 2} height={B * 2} patternUnits="userSpaceOnUse">
                    <path d={`M0 ${B} L${A} 0 L${A * 2} ${B} L${A} ${B * 2} Z`} fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
    );
};
