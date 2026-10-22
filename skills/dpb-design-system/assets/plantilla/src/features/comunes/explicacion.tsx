import { HelpCircle } from "@untitledui/icons";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";

/**
 * La ayuda que no cabe en una franja compacta (una cifra, una cabecera de columna): un «?» junto al
 * texto, con la explicación en un tooltip. El disparador es un botón, así que se alcanza con teclado.
 */
export const Explicacion = ({ titulo, texto }: { titulo: string; texto: string }) => (
    <Tooltip title={titulo} description={texto}>
        <TooltipTrigger aria-label={titulo} className="text-fg-quaternary hover:text-fg-quaternary_hover focus-visible:text-fg-quaternary_hover">
            <HelpCircle aria-hidden="true" className="size-3.5" />
        </TooltipTrigger>
    </Tooltip>
);
