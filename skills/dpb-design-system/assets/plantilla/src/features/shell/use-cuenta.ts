/**
 * La cuenta de la sesión, tal como la lee la sidebar. COSTURA: cada proyecto la conecta a su
 * autenticación (en DPB suele ser MSAL) y borra el ejemplo de abajo.
 */

/** Código del rol que filtra la navegación (`NavItem.roles`). Cámbialo por la unión del proyecto: `"ADMIN" | …`. */
export type Rol = string;

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

interface UseCuenta {
    /** `null` sin sesión: la sidebar no muestra el menú de la cuenta. */
    cuenta: Cuenta | null;
    cerrarSesion: () => void | Promise<void>;
}

// TODO: borrar al conectar la autenticación. Está para que la cáscara se vea completa desde el primer arranque.
const CUENTA_DE_EJEMPLO: Cuenta = {
    nombre: "Usuario de Ejemplo",
    correo: "usuario.ejemplo@paloblanco.com",
    rol: "ADMIN",
    detalle: "Administrador",
};

/**
 * TODO: conectar a la autenticación del proyecto. Con MSAL, algo como:
 *
 *     const { user, signOut } = useAuth(); // features/auth del proyecto
 *     return {
 *         cuenta: user && { nombre: user.nombre, correo: user.email, rol: user.role.code, detalle: user.role.nombre },
 *         cerrarSesion: signOut,
 *     };
 *
 * El cierre de sesión es LOCAL (`clearCache()`), no `logoutRedirect()`: este hace un cierre
 * federado y saca al usuario de Microsoft 365 entero (Outlook, Teams). Va junto con
 * `prompt: "select_account"` al entrar; si no, el siguiente clic devuelve a la misma cuenta en
 * silencio y parece que cerrar sesión no hizo nada.
 */
export const useCuenta = (): UseCuenta => ({
    cuenta: CUENTA_DE_EJEMPLO,
    cerrarSesion: () => {},
});
