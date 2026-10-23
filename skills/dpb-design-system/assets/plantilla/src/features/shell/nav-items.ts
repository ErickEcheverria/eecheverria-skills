import { HomeLine } from "@untitledui/icons";
import type { NavItem } from "@/features/shell/navegacion";

/**
 * COSTURA: los módulos de la sidebar. Cada proyecto los reemplaza por los suyos; el tipo y el filtro
 * por rol viven en `navegacion.ts`.
 *
 * **En el orden del proceso**, con Inicio primero y la administración al final. Una entrada
 * nueva va donde le toca en ese flujo, no al final.
 *
 * No se listan pantallas que todavía no existen: un enlace que lleva a una pantalla vacía (o al 404)
 * es peor que no tenerlo. Por eso el ejemplo de grupo y de rol va comentado.
 */
export const NAV_ITEMS: NavItem[] = [
    { label: "Inicio", grupo: null, href: "/", icon: HomeLine },
    // Una entrada con título de grupo, y una que solo ve un rol:
    // { label: "Proveedores", grupo: "Catálogos", href: "/proveedores", icon: Truck01 },
    // { label: "Usuarios", grupo: "Administración", href: "/usuarios", icon: Users01, roles: ["ADMIN"] },
];
