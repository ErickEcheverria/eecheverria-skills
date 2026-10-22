/**
 * Fragmento de src/main.tsx: el orden de los providers y un ejemplo de rutas. Se FUSIONA con el
 * main.tsx del starter. Cada proyecto agrega sus rutas y monta su autenticación donde se indica.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Notificaciones } from "@/features/comunes/notificaciones";
import { AppLayout } from "@/layouts/app-layout";
import { NoEncontradaPage } from "@/pages/no-encontrada";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

/**
 * Ejemplo de pantalla: en el proyecto vive en `src/pages/inicio.tsx`. Cada página monta su propio
 * `AppLayout`, con su título, su acción y su contenido.
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
 */
const App = () => (
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
                    {/* `/index.html` es la ruta física del archivo: quien entra por ella va a Inicio, no al 404. */}
                    <Route path="/index.html" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<NoEncontradaPage />} />
                </Routes>
            </RouteProvider>
        </BrowserRouter>
    </ThemeProvider>
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
