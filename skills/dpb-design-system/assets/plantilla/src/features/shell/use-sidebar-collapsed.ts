import { useCallback, useEffect, useState } from "react";
import { SHELL } from "@/features/shell/shell.config";

/**
 * Sin preferencia guardada, la barra arranca colapsada por debajo de `lg`: no hay drawer en móvil y,
 * expandida, a 440 px se come dos tercios del ancho y recorta el contenido de la tarjeta.
 */
const PANTALLA_ANGOSTA = "(max-width: 1023px)";

/**
 * Estado colapsado de la sidebar, recordado entre visitas. La clave sale de `shell.config.ts`.
 *
 * Todo acceso a localStorage va en try/catch: en modo incógnito o con el
 * almacenamiento bloqueado, `localStorage` lanza en vez de devolver null, y eso
 * tumbaría el render de toda la aplicación por una preferencia cosmética.
 */
export const useSidebarCollapsed = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            const guardado = localStorage.getItem(SHELL.claveSidebarColapsada);
            if (guardado !== null) return guardado === "true";
        } catch {
            // Sin almacenamiento: se decide por el ancho, igual que en la primera visita.
        }
        return window.matchMedia(PANTALLA_ANGOSTA).matches;
    });

    useEffect(() => {
        try {
            localStorage.setItem(SHELL.claveSidebarColapsada, String(isCollapsed));
        } catch {
            // Sin persistencia: la preferencia dura lo que dure la sesión.
        }
    }, [isCollapsed]);

    const toggle = useCallback(() => setIsCollapsed((value) => !value), []);

    return { isCollapsed, toggle };
};
