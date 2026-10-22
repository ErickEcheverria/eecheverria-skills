import type { FC, HTMLAttributes } from "react";
import { BookOpen01, Building07, HomeLine } from "@untitledui/icons";
import type { Rol } from "@/features/shell/use-cuenta";

/**
 * Los módulos de la sidebar. Cada proyecto reemplaza `NAV_ITEMS` por los suyos; el tipo y el
 * filtro por rol se quedan.
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

/**
 * Navegación principal. Crece con cada módulo que se implemente.
 *
 * **En el orden del proceso**, con Inicio primero y la administración al final. Una entrada
 * nueva va donde le toca en ese flujo, no al final.
 *
 * No se listan pantallas que todavía no existen: un enlace que lleva a una pantalla vacía es
 * peor que no tenerlo.
 */
export const NAV_ITEMS: NavItem[] = [
    { label: "Inicio", grupo: null, href: "/", icon: HomeLine },
    { label: "Departamentos", grupo: "Catálogos", href: "/departamentos", icon: Building07 },
    { label: "Cuentas", grupo: "Catálogos", href: "/cuentas", icon: BookOpen01, roles: ["ADMIN"] },
];

export const visibleNavItems = (rol: Rol | undefined): NavItem[] => NAV_ITEMS.filter((item) => !item.roles || (rol !== undefined && item.roles.includes(rol)));
