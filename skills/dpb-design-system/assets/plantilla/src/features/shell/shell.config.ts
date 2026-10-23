import type { Marca } from "@/brand/app-logo";

/**
 * Lo que cambia de una app a otra en la cáscara, en un solo lugar. Cada proyecto edita estos
 * valores; los módulos van en `nav-items.ts` y la sesión en `use-cuenta.ts`.
 */
interface ShellConfig {
    /** Nombre visible: lockup de la sidebar, pantalla de acceso y 404. El mismo del `<title>` de index.html. */
    nombreApp: string;
    /** Clave de localStorage del estado colapsado de la sidebar, con el prefijo de la app. */
    claveSidebarColapsada: string;
    /** A quién escribe quien no puede entrar: la nota de la pantalla de acceso. En DPB, el soporte de IT. */
    correoSoporte: string;
    /** Marca propia de la app (un componente SVG inline). Sin ella, el isotipo DPB. */
    marca?: Marca;
}

export const SHELL: ShellConfig = {
    nombreApp: "Nombre de la app",
    claveSidebarColapsada: "nombre-app:sidebar-collapsed",
    correoSoporte: "itservices@paloblanco.com",
};
