import type { Marca } from "@/brand/app-logo";

/**
 * La forma de la configuración del shell. NO es costura: vive aparte de `shell.config.ts` (que sí lo
 * es) para que un cambio de tipo en una versión nueva de la plantilla llegue a todas las apps.
 */
export interface ShellConfig {
    /** Nombre visible: lockup de la sidebar, pantalla de acceso y 404. El mismo del `<title>` de index.html. */
    nombreApp: string;
    /** Clave de localStorage del estado colapsado de la sidebar, con el prefijo de la app. */
    claveSidebarColapsada: string;
    /** A quién escribe quien no puede entrar: la nota de la pantalla de acceso. En DPB, el soporte de IT. */
    correoSoporte: string;
    /** Marca propia de la app (un componente SVG inline). Sin ella, el isotipo DPB. */
    marca?: Marca;
}
