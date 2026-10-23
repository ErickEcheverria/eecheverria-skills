import type { ShellConfig } from "@/features/shell/configuracion";

/**
 * COSTURA: lo que cambia de una app a otra en la cáscara, en un solo lugar. Cada proyecto edita estos
 * valores; la forma vive en `configuracion.ts`, los módulos en `nav-items.ts` y la sesión en
 * `use-cuenta.ts`.
 */
export const SHELL: ShellConfig = {
    nombreApp: "Nombre de la app",
    claveSidebarColapsada: "nombre-app:sidebar-collapsed",
    correoSoporte: "itservices@paloblanco.com",
};
