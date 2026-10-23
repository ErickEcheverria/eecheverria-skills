import type { FormEvent, ReactNode } from "react";
import { X } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

/**
 * La superficie de TODO diálogo: cabecera y pie fijos, y el scroll solo en el cuerpo. Va como hijo
 * directo de `Dialog`: `<ModalOverlay><Modal className="max-w-lg"><Dialog aria-label={titulo}><TarjetaDialogo>`.
 *
 * Supone el catálogo actual, cuyo `Dialog` lleva `max-h-[inherit] overflow-y-auto`. Si el `Dialog` de
 * `src/components/application/modals/modal.tsx` no lo lleva, el proyecto tiene el catálogo anterior, cuyo
 * `Modal` no trae fondo ni alto tope: pasa `className="bg-primary shadow-xl max-h-[85dvh]"`.
 */

interface TarjetaDialogoProps {
    titulo: ReactNode;
    /** Línea de apoyo bajo el título. */
    descripcion?: ReactNode;
    /** Si viene, se pinta la × de cerrar en la cabecera. */
    onCerrar?: () => void;
    /** Deshabilita la × mientras se guarda: cerrar a media escritura ocultaría el resultado. */
    cerrarDeshabilitado?: boolean;
    /** Los botones del pie, alineados a la derecha. Sin `pie` no hay pie. */
    pie?: ReactNode;
    /**
     * Si viene, la tarjeta es un `<form noValidate>`: Enter envía y el `type="submit"` del pie funciona.
     * Sirve igual con React Hook Form (`onSubmit={handleSubmit(guardar)}`) que con estado propio; la
     * tarjeta ya llama a `preventDefault()`, así que un envío nunca recarga la página.
     */
    onSubmit?: (evento: FormEvent<HTMLFormElement>) => void;
    /** El cuerpo, lo único que se desplaza. El texto de una confirmación también va aquí, no en `descripcion`. */
    children?: ReactNode;
    /** Solo para el catálogo anterior (ver arriba): `bg-primary shadow-xl max-h-[85dvh]`. */
    className?: string;
}

/**
 * El `Modal` del catálogo ya pone fondo, sombra, esquinas y el alto tope (la ventana menos su margen),
 * pero su `Dialog` desplaza TODO el contenido: en un formulario largo el título y «Guardar» se iban de
 * la vista. La tarjeta hereda ese tope (`max-h-[inherit]`, por eso va como hijo directo de `Dialog`) y
 * es una columna: cabecera y pie no se encogen y el cuerpo (`min-h-0 flex-1`) es lo único que se
 * desplaza. El `ring` repite las esquinas del `Modal` para que el contorno se lea en el tema oscuro.
 */
const TARJETA = "flex max-h-[inherit] w-full flex-col overflow-hidden rounded-xl ring-1 ring-secondary sm:rounded-2xl";

/**
 * `py-1`: que el anillo de foco del primer y del último campo no quede recortado por el borde del scroll.
 * `relative`: las casillas e interruptores de React Aria esconden su `<input>` con `position: absolute`,
 * y un `overflow` solo recorta a los `absolute` cuyo bloque contenedor está dentro de él. Sin esto, el
 * input de una casilla al final del cuerpo estiraba el diálogo y la cabecera se iba de la vista.
 */
const CUERPO = "relative flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-1";

export const TarjetaDialogo = ({ titulo, descripcion, onCerrar, cerrarDeshabilitado, pie, onSubmit, children, className }: TarjetaDialogoProps) => {
    const contenido = (
        <>
            <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6 pb-4">
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
                    {descripcion && <div className="mt-1 text-sm text-tertiary">{descripcion}</div>}
                </div>
                {onCerrar && <ButtonUtility size="sm" color="tertiary" icon={X} tooltip="Cerrar" onPress={onCerrar} isDisabled={cerrarDeshabilitado} />}
            </div>

            {children && <div className={CUERPO}>{children}</div>}

            {/* El borde marca dónde termina lo que se desplaza: sin él, el contenido parece cortarse
                contra los botones. */}
            {pie ? (
                <div className="mt-5 flex shrink-0 flex-wrap justify-end gap-3 border-t border-secondary px-6 py-4">{pie}</div>
            ) : (
                <div className="h-6 shrink-0" />
            )}
        </>
    );

    if (!onSubmit) return <div className={cx(TARJETA, className)}>{contenido}</div>;

    return (
        // `noValidate`: la validación la pinta la pantalla en español; la del navegador sale en su idioma y con su chrome.
        <form
            noValidate
            className={cx(TARJETA, className)}
            onSubmit={(evento) => {
                evento.preventDefault();
                onSubmit(evento);
            }}
        >
            {contenido}
        </form>
    );
};
