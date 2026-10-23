import { useCallback, useState } from "react";
import { SHELL } from "@/features/shell/shell.config";

/**
 * Sin preferencia guardada, la barra arranca colapsada por debajo de `lg`: no hay drawer en móvil y,
 * expandida, a 440 px se come dos tercios del ancho y recorta el contenido de la tarjeta.
 */
const PANTALLA_ANGOSTA = "(max-width: 1023px)";

/**
 * Estado colapsado de la sidebar, recordado entre visitas. La clave sale de `shell.config.ts`.
 *
 * Todo acceso a localStorage va en try/catch: con el almacenamiento bloqueado (cookies
 * deshabilitadas, políticas del navegador), `localStorage` lanza en vez de devolver null, y eso
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
        // `?.`: sin `matchMedia` (jsdom en las pruebas) no revienta; queda expandida.
        return window.matchMedia?.(PANTALLA_ANGOSTA)?.matches ?? false;
    });

    // Se guarda solo cuando el usuario la cambia. Guardar al montar convertiría el ancho de la
    // primera visita en «preferencia»: quien entró desde una ventana angosta la vería colapsada
    // para siempre, aunque después maximice.
    const toggle = useCallback(() => {
        const siguiente = !isCollapsed;
        setIsCollapsed(siguiente);
        try {
            localStorage.setItem(SHELL.claveSidebarColapsada, String(siguiente));
        } catch {
            // Sin almacenamiento (incógnito, bloqueado) la preferencia no se guarda y vuelve a decidirse
            // por el ancho en la siguiente pantalla: la sidebar se remonta al navegar. Es un caso raro.
        }
    }, [isCollapsed]);

    return { isCollapsed, toggle };
};
