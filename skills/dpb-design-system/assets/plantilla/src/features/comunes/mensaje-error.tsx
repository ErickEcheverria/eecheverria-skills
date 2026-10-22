import type { FC, ReactNode } from "react";
import { AlertCircle, InfoCircle, RefreshCw01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

/**
 * El error que la persona tiene que leer y resolver: qué pasó, el detalle por campo y qué hacer. Va
 * junto a lo que falló (en la pantalla o en el cuerpo del diálogo), nunca en un aviso flotante: se iría solo.
 * Al lado, `NotaInformativa`: la misma anatomía en tono neutro.
 */

interface MensajeErrorProps {
    /** Qué pasó. Suele ser el mensaje del backend, tal cual. */
    titulo: ReactNode;
    /** El detalle por campo de un error de validación. */
    detalles?: readonly string[];
    /**
     * Qué puede hacer la persona. Es obligatorio a propósito: el mensaje dice QUÉ pasó y esto dice QUÉ
     * HACER; sin esta mitad, un error correcto la deja sin salida. Se elige por el código del error,
     * nunca por el texto del mensaje.
     */
    remedio: ReactNode;
    /** Si viene, pinta «Reintentar» debajo y centra el bloque: es el error de una carga que se puede repetir. */
    onReintentar?: () => void;
    className?: string;
}

export const MensajeError = ({ titulo, detalles, remedio, onReintentar, className }: MensajeErrorProps) => {
    const alerta = (
        <div role="alert" className={cx("flex gap-3 rounded-lg bg-error-primary p-4 ring-1 ring-error_subtle", !onReintentar && className)}>
            <AlertCircle aria-hidden="true" className="size-5 shrink-0 text-fg-error-secondary" />
            <div className="min-w-0">
                <p className="text-sm font-semibold text-error-primary">{titulo}</p>
                {/* El detalle por campo va antes del remedio: es lo accionable de verdad. */}
                {detalles && detalles.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-sm text-error-primary">
                        {detalles.map((detalle) => (
                            <li key={detalle}>{detalle}</li>
                        ))}
                    </ul>
                )}
                <p className="mt-1 text-sm text-tertiary">{remedio}</p>
            </div>
        </div>
    );

    if (!onReintentar) return alerta;

    return (
        <div className={cx("flex flex-col items-center gap-4", className)}>
            <div className="w-full max-w-lg">{alerta}</div>
            <Button color="secondary" iconLeading={RefreshCw01} onPress={onReintentar}>
                Reintentar
            </Button>
        </div>
    );
};

interface NotaInformativaProps {
    titulo: ReactNode;
    /** El texto de apoyo: cómo funciona, a quién acudir. Admite enlaces. */
    children?: ReactNode;
    /** El ícono de la izquierda; por defecto, la «i». */
    icono?: FC<{ className?: string }>;
    className?: string;
}

/**
 * Nota en tono neutro con la anatomía de `MensajeError` (ícono, título y texto): explica algo sin
 * alarmar y no compite con un error cuando los dos están en pantalla. Sin `role="alert"`: no es urgente.
 */
export const NotaInformativa = ({ titulo, children, icono: Icono = InfoCircle, className }: NotaInformativaProps) => (
    <div className={cx("flex gap-3 rounded-lg bg-secondary p-4 ring-1 ring-secondary", className)}>
        <Icono aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
        <div className="min-w-0 text-sm">
            <p className="font-medium text-secondary">{titulo}</p>
            {children && <div className="mt-1 text-tertiary">{children}</div>}
        </div>
    </div>
);
