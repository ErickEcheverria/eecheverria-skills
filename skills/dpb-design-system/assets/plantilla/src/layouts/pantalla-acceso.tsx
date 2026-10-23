import type { ReactNode } from "react";
import { Lock01 } from "@untitledui/icons";
import { AppLogo } from "@/brand/app-logo";
import { DpbIsotipo } from "@/brand/dpb-isotipo";
import { IsoPattern } from "@/brand/iso-pattern";
import { SHELL } from "@/features/shell/shell.config";

/**
 * Layout de la pantalla de acceso: el acceso a la izquierda sobre blanco y la marca a la derecha
 * sobre el azul corporativo. El proyecto pone los textos y, en `children`, el botón de entrar
 * conectado a su autenticación. Por ejemplo, con MSAL:
 *
 *     <PantallaAcceso lineaSuperior="Acceso corporativo" titulo="Inicia sesión" descripcion="Entra con la cuenta de Microsoft 365 de la empresa.">
 *         <Button size="lg" color="secondary" iconLeading={<MicrosoftLogo data-icon className="size-5" />} isLoading={entrando} showTextWhileLoading onPress={entrar}>
 *             Continuar con Microsoft 365
 *         </Button>
 *     </PantallaAcceso>
 */

interface PantallaAccesoProps {
    /** Renglón de contexto sobre el título, en el rojo de marca: «Acceso corporativo». */
    lineaSuperior: string;
    /** El `h1`: «Inicia sesión». */
    titulo: string;
    descripcion?: string;
    /**
     * La acción de entrar: un `Button` del catálogo. Si hay un error de acceso, su aviso va aquí
     * también, encima del botón. Van en columna y a todo el ancho, alineados con la nota de abajo.
     */
    children: ReactNode;
}

export const PantallaAcceso = ({ lineaSuperior, titulo, descripcion, children }: PantallaAccesoProps) => (
    <div className="grid min-h-dvh lg:grid-cols-2">
        {/* Columna de acceso */}
        <div className="flex flex-col bg-primary px-6 py-8 sm:px-10 lg:px-12">
            <AppLogo />

            {/* `justify-center` centra el bloque de acceso en la columna; sin él
                queda pegado al borde izquierdo, muy lejos del panel de marca. */}
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="w-full max-w-90">
                    <p className="text-sm font-semibold text-accent-600">{lineaSuperior}</p>
                    <h1 className="mt-1.5 text-display-sm font-bold text-primary">{titulo}</h1>
                    {descripcion && <p className="mt-2 text-md text-tertiary">{descripcion}</p>}

                    <div className="mt-6 flex flex-col gap-6">{children}</div>

                    {/*
                     * Nota informativa, con la misma anatomía que una alerta de error
                     * —icono, título y texto de apoyo— pero en tono neutro:
                     * explica cómo funciona el acceso y a quién acudir, y no compite
                     * con el error cuando los dos están en pantalla.
                     */}
                    <div className="mt-6 flex gap-3 rounded-lg bg-secondary p-4 ring-1 ring-secondary">
                        <Lock01 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                        <div className="min-w-0 text-sm">
                            <p className="font-medium text-secondary">Acceso por el directorio de la organización</p>
                            <p className="mt-1 text-tertiary">
                                ¿No puedes entrar? Escribe a{" "}
                                <a href={`mailto:${SHELL.correoSoporte}`} className="font-medium text-brand-secondary underline-offset-2 hover:underline">
                                    {SHELL.correoSoporte}
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-quaternary">
                <p>© {new Date().getFullYear()} · Desarrollos Palo Blanco</p>
                <a href={`mailto:${SHELL.correoSoporte}`} className="underline-offset-2 hover:underline">
                    Ayuda
                </a>
            </div>
        </div>

        {/*
         * Panel de marca. Se oculta bajo 1024 px: es apoyo, no contenido, y por eso
         * el lockup de arriba a la izquierda se queda siempre visible.
         *
         * El isotipo va en su variante BLANCA: a color, la casa azul desaparece contra
         * #2C589A. Con `aria-hidden`, porque el nombre está escrito justo debajo.
         */}
        <div className="relative hidden flex-col overflow-hidden bg-brand-500 px-12 py-10 lg:flex">
            <IsoPattern className="pointer-events-none absolute inset-0 text-white/10" />

            <div className="relative flex flex-1 flex-col items-center justify-center">
                <DpbIsotipo size={260} variant="white" aria-hidden />

                <p className="mt-10 text-display-xs font-bold text-white">{SHELL.nombreApp}</p>
                <span aria-hidden="true" className="mt-3 h-px w-12 bg-white/40" />
                <p className="mt-3 text-md text-white/75">Desarrollos Palo Blanco</p>
            </div>
        </div>
    </div>
);
