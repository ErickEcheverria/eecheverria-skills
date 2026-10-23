import type { FC, HTMLAttributes } from "react";
import type { Rol } from "@/features/shell/use-cuenta";

/**
 * El tipo de una entrada de la sidebar y su filtro por rol. NO es costura: vive aparte de
 * `nav-items.ts` (que sí lo es) para que una versión nueva de la plantilla llegue a todas las apps;
 * dentro de la costura, el script nunca lo actualizaría.
 */

export interface NavItem {
    label: string;
    /**
     * La sección de la barra a la que pertenece la entrada. Entre una sección y la siguiente va un
     * separador, con el nombre de la sección cuando la barra está expandida. `null` = sin título
     * (Inicio).
     */
    grupo: string | null;
    href: string;
    icon: FC<HTMLAttributes<HTMLOrSVGElement>>;
    /**
     * Roles que ven la entrada. Omitirlo = la ven todos.
     *
     * Ojo: esto es SOLO presentación — ocultar un enlace no protege nada. La autorización real
     * la hace el backend.
     */
    roles?: readonly Rol[];
}

/** Las entradas que ve la sesión. Sin rol (sin login, o sin rol asignado), solo las que no piden `roles`. */
export const visibleNavItems = (items: readonly NavItem[], rol: Rol | undefined): NavItem[] =>
    items.filter((item) => !item.roles || (rol !== undefined && item.roles.includes(rol)));
