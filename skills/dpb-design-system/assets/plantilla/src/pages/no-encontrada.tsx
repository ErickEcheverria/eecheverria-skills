import { Button } from "@desarrollospaloblanco/ui/components/base/buttons/button";
import { ArrowLeft } from "@untitledui/icons";
import { AppLogo } from "@/brand/app-logo";

/**
 * La página 404, en español: la ruta `*` de `main.tsx`. No lee la cuenta, así que sirve con y sin
 * sesión. Ningún proyecto la edita.
 */
export const NoEncontradaPage = () => (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-primary px-4 py-16">
        <AppLogo />

        <div className="mt-12 flex max-w-xl flex-col items-center text-center">
            <p className="text-md font-semibold text-brand-secondary">Error 404</p>
            <h1 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">No encontramos esta página</h1>
            <p className="mt-4 text-lg text-tertiary">La dirección no existe o la página se movió. Revisa el enlace o vuelve al inicio.</p>

            {/* `href` y no `navigate(-1)`: quien llega por un enlace roto no tiene a dónde volver. */}
            <Button size="lg" href="/" iconLeading={ArrowLeft} className="mt-8">
                Volver al inicio
            </Button>
        </div>
    </main>
);
