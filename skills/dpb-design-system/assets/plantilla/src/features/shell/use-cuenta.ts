import type { UseCuenta } from "@/features/shell/cuenta";

/**
 * La cuenta de la sesión, tal como la lee la sidebar (la forma vive en `cuenta.ts`). COSTURA: cada
 * proyecto la conecta a su autenticación (en DPB suele ser MSAL). Sin login todavía, se queda así:
 * `cuenta: null` y la sidebar no muestra el menú de la cuenta.
 */

/**
 * Código del rol que filtra la navegación (`NavItem.roles`). Cámbialo por la unión del proyecto:
 * `"ADMIN" | …`. Este archivo tiene que seguir exportando `Rol` aunque la auth viva en otro lado
 * (reexpórtalo): `navegacion.ts` y `cuenta.ts` lo importan de aquí.
 */
export type Rol = string;

/**
 * Sin cuenta de ejemplo a propósito: una de mentira llegaba a producción el día que nadie conectaba
 * esto, con un «Administrador» falso y todo el menú a la vista.
 *
 * Al conectarla a MSAL, algo como:
 *
 *     const { user, signOut } = useAuth(); // features/auth del proyecto
 *     return {
 *         cuenta: user && { nombre: user.nombre, correo: user.email, rol: user.role.code, detalle: user.role.nombre },
 *         cerrarSesion: signOut,
 *     };
 *
 * Cerrar sesión tiene dos formas y ninguna es gratis; decídelo con `eecheverria-security`:
 * - **Local** (`clearCache()` + `prompt: "select_account"` al entrar): no saca al usuario de
 *   Microsoft 365 entero (Outlook, Teams), pero su sesión de Entra sigue viva. En un equipo
 *   COMPARTIDO, el siguiente que abra la app ve esa cuenta en el selector y entra sin contraseña.
 * - **Federado** (`logoutRedirect()`): cierra la sesión de Microsoft de verdad. Es lo correcto en
 *   equipos compartidos, a costa de sacar al usuario de las demás apps de Microsoft.
 */
export const useCuenta = (): UseCuenta => ({
    cuenta: null,
    cerrarSesion: () => {},
});
