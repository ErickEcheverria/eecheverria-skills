import type { Rol } from "@/features/shell/use-cuenta";

/**
 * La forma de la cuenta que lee la sidebar. NO es costura: vive aparte de `use-cuenta.ts` (que sí lo
 * es) para que una versión nueva de la plantilla llegue a todas las apps.
 */

export interface Cuenta {
    nombre: string;
    correo: string;
    /** URL o data URI de la foto. Sin ella, el avatar va con iniciales. */
    foto?: string;
    /** Sin rol solo se ven las entradas de la navegación que no piden `roles`. */
    rol?: Rol;
    /** Renglón bajo el nombre: el rol o el departamento, legible. Opcional. */
    detalle?: string;
}

export interface UseCuenta {
    /** `null` sin sesión: la sidebar no muestra el menú de la cuenta. */
    cuenta: Cuenta | null;
    cerrarSesion: () => void | Promise<void>;
}
