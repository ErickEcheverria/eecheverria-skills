/**
 * Fragmento de src/main.tsx: el orden de los providers y un ejemplo de rutas. En un arranque reemplaza
 * al main.tsx de Vite (que monta App.tsx e index.css, que se borran); en una adopción se FUSIONA con el
 * del proyecto. Cada proyecto agrega sus rutas y monta su autenticación donde se indica.
 */
// Es la entrada de la app: Fast Refresh nunca la recarga en caliente, así que declarar componentes aquí
// sin exportarlos no cuesta nada.
/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "react-aria-components";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Notificaciones } from "@/features/comunes/notificaciones";
import { AppLayout } from "@/layouts/app-layout";
import { NoEncontradaPage } from "@/pages/no-encontrada";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

/**
 * Ejemplo de pantalla. En el proyecto, cada pantalla vive en `src/pages/` (esta iría en
 * `src/pages/inicio.tsx`) y se importa aquí. Cada página monta su propio `AppLayout`, con su título,
 * su acción y su contenido. Si la app no tiene inicio, `/` redirige al primer módulo.
 */
const InicioPage = () => (
    <AppLayout title="Inicio" subtitle="Resumen de la aplicación">
        <p className="text-sm text-tertiary">El contenido de la pantalla va aquí.</p>
    </AppLayout>
);

/**
 * Tema CLARO por defecto, sin seguir la preferencia del sistema.
 *
 * Son apps administrativas que se usan junto a hojas de cálculo, plantillas de Excel y
 * documentos impresos: el claro es el modo esperado y el que corresponde a la identidad
 * de DPB. El oscuro sigue disponible —los tokens de Untitled UI lo soportan— para quien
 * lo elija; la elección se guarda en localStorage bajo "ui-theme", la misma clave que lee
 * el guardia anti-parpadeo de index.html.
 *
 * `I18nProvider`: React Aria formatea fechas y números con el idioma del NAVEGADOR, no con el `lang`
 * de index.html. Sin él, en un equipo en inglés `InputDate` sale mm/dd/yyyy y el calendario, en inglés.
 */
const App = () => (
    <I18nProvider locale="es-GT">
        <ThemeProvider defaultTheme="light">
            {/* Una sola vez para toda la aplicación: cualquier pantalla avisa con `notificar`. */}
            <Notificaciones />
            <BrowserRouter>
                <RouteProvider>
                    {/* Aquí va la autenticación del proyecto, envolviendo las rutas. Con MSAL:
                        <MsalProvider instance={msalInstance}><AuthProvider>…</AuthProvider></MsalProvider>,
                        y las rutas con sesión dentro de su `ProtectedRoute`. */}
                    <Routes>
                        <Route path="/" element={<InicioPage />} />
                        {/* `/index.html` es la ruta física del archivo: quien entra por ella va a `/`, no al 404. */}
                        <Route path="/index.html" element={<Navigate to="/" replace />} />
                        <Route path="*" element={<NoEncontradaPage />} />
                    </Routes>
                </RouteProvider>
            </BrowserRouter>
        </ThemeProvider>
    </I18nProvider>
);

/**
 * Con MSAL, `initialize()` y `handleRedirectPromise()` van ANTES de este render y fuera de React:
 * dentro de un efecto, StrictMode la invocaría dos veces y consumiría la respuesta por partida doble.
 */
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
