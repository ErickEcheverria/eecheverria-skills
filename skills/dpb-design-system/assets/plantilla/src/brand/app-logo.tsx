import type { ComponentType } from "react";
import { DpbIsotipo } from "@/brand/dpb-isotipo";
import { SHELL } from "@/features/shell/shell.config";

/**
 * Lockup horizontal de la app: marca, nombre y «Desarrollos Palo Blanco». Lo usan la sidebar,
 * la pantalla de acceso y el 404. El nombre y la marca salen de `shell.config.ts`.
 */

/**
 * Lo que el lockup le pasa a la marca. `DpbIsotipo` lo cumple; la marca propia de una app
 * también tiene que cumplirlo: el tamaño, la clase del hover y `aria-hidden`.
 */
export type Marca = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

/**
 * Al pasar el ratón por el lockup la marca se eleva un poco. Nada en bucle: al lado del trabajo,
 * una marca que se mueve sola distrae. Con «reducir movimiento» se anula con `translate-y-0` y
 * `scale-100`, no con `transform-none`, porque Tailwind 4 usa las propiedades `translate` y `scale`.
 */
const MARCA_HOVER =
    "shrink-0 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100";

interface AppLogoProps {
    /** Solo la marca, para la sidebar colapsada. El nombre se queda para el lector de pantalla. */
    colapsado?: boolean;
    nombre?: string;
    marca?: Marca;
}

/**
 * Usa la marca a color porque la sidebar es una tarjeta clara (`bg-primary`). La variante
 * `white` es solo para fondos de marca, como el panel del login.
 *
 * La marca va con `aria-hidden`: al lado está el nombre, que es lo que se lee. Colapsado, el
 * nombre sigue ahí en `sr-only`; `relative` lo encierra para que su `absolute` no agrande la
 * página.
 *
 * 32 px es el mínimo del isotipo DPB: su contorno es fino y por debajo la casa se pierde y solo
 * quedan los cuadros rojos.
 */
export const AppLogo = ({ colapsado = false, nombre = SHELL.nombreApp, marca: MarcaApp = SHELL.marca ?? DpbIsotipo }: AppLogoProps) => (
    <div className="group relative flex items-center gap-2.5">
        <MarcaApp size={32} aria-hidden className={MARCA_HOVER} />
        {colapsado ? (
            <span className="sr-only">{nombre}</span>
        ) : (
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{nombre}</p>
                <p className="truncate text-xs text-tertiary">Desarrollos Palo Blanco</p>
            </div>
        )}
    </div>
);
