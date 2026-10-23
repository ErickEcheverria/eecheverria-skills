import { HelpCircle } from "@untitledui/icons";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";

/**
 * La ayuda que no cabe en una franja compacta (una cifra, una cabecera de columna): un «?» junto al
 * texto que, al pulsarlo, abre la explicación en un popover.
 *
 * Popover y no tooltip: el tooltip de React Aria no se abre con un toque, así que en móvil la ayuda
 * quedaba inalcanzable justo donde más falta hace. El botón mide 24 px (el mínimo táctil de WCAG
 * 2.5.8) aunque el ícono sea de 14; se abre con clic, toque, Enter o Espacio, y se cierra con Escape
 * o tocando fuera.
 */
export const Explicacion = ({ titulo, texto }: { titulo: string; texto: string }) => (
    <AriaDialogTrigger>
        <AriaButton
            aria-label={`Qué significa: ${titulo}`}
            className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-fg-quaternary outline-focus-ring hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
        >
            <HelpCircle aria-hidden="true" className="size-3.5" />
        </AriaButton>
        <AriaPopover placement="top" offset={6} className="max-w-xs rounded-lg bg-primary p-3 shadow-lg ring-1 ring-secondary">
            <AriaDialog aria-label={titulo} className="outline-hidden">
                <p className="text-sm font-semibold text-primary">{titulo}</p>
                <p className="mt-1 text-sm text-tertiary">{texto}</p>
            </AriaDialog>
        </AriaPopover>
    </AriaDialogTrigger>
);
