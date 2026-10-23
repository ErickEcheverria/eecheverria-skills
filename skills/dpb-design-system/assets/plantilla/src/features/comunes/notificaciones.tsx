import type { FC } from "react";
import { ButtonUtility } from "@desarrollospaloblanco/ui/components/base/buttons/button-utility";
import { cx } from "@desarrollospaloblanco/ui/utils/cx";
import { AlertCircle, CheckCircle, X } from "@untitledui/icons";
import { Toaster, toast } from "sonner";

/**
 * Avisos flotantes («toasts») arriba al centro, que se van solos a los 5 s. `<Notificaciones />` se
 * monta UNA vez en la raíz; cualquier pantalla llama a `notificar.exito(titulo, descripcion?)`.
 *
 * **Por qué `sonner` y no el catálogo.** El toast de Untitled UI es PRO. `sonner` es la librería sobre
 * la que el catálogo monta el suyo: pone la pila, el tiempo, la pausa al pasar el ratón, el `aria-live`
 * y el respeto a `prefers-reduced-motion`; el ASPECTO lo pone `Aviso`, con los tokens del sistema.
 *
 * **Arriba al centro**: es el único sitio sin acciones. Arriba a la derecha viven las de la pantalla y
 * la × de los diálogos; abajo a la derecha, los botones del pie de los diálogos anchos. Con la pestaña
 * oculta el conteo se pausa, así que al volver los avisos siguen ahí: es a propósito.
 *
 * **Para qué sí y para qué no.** Confirma lo que YA pasó y no exige nada. Un error que hay que corregir
 * va en `MensajeError`, junto a los campos: un aviso se iría antes de que alguien lo lea.
 */

/** Cuánto se queda en pantalla. Pasar el ratón por encima lo pausa. */
const DURACION_MS = 5000;

type Tono = "exito" | "error";

const ICONO: Record<Tono, FC<{ className?: string }>> = {
    exito: CheckCircle,
    error: AlertCircle,
};

const COLOR_ICONO: Record<Tono, string> = {
    exito: "text-fg-success-secondary",
    error: "text-fg-error-secondary",
};

interface AvisoProps {
    id: string | number;
    tono: Tono;
    titulo: string;
    descripcion?: string;
}

const Aviso = ({ id, tono, titulo, descripcion }: AvisoProps) => {
    const Icono = ICONO[tono];

    return (
        <div className="flex w-90 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl bg-primary p-4 shadow-lg ring-1 ring-secondary">
            <Icono aria-hidden="true" className={cx("mt-0.5 size-5 shrink-0", COLOR_ICONO[tono])} />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary">{titulo}</p>
                {descripcion && <p className="mt-1 text-sm text-tertiary">{descripcion}</p>}
            </div>
            <ButtonUtility size="xs" color="tertiary" icon={X} tooltip="Cerrar" onPress={() => toast.dismiss(id)} />
        </div>
    );
};

const mostrar = (tono: Tono, titulo: string, descripcion?: string) =>
    toast.custom((id) => <Aviso id={id} tono={tono} titulo={titulo} descripcion={descripcion} />, { duration: DURACION_MS });

/**
 * Se llama DESPUÉS de que el backend confirmó, nunca antes: un «se guardó» que luego resulta falso es
 * peor que ningún aviso. `error` es para lo que no se corrige en un formulario (una descarga que no llegó).
 */
export const notificar = {
    exito: (titulo: string, descripcion?: string) => mostrar("exito", titulo, descripcion),
    error: (titulo: string, descripcion?: string) => mostrar("error", titulo, descripcion),
};

/** El contenedor de los avisos. Se monta UNA vez, en la raíz de la aplicación. */
export const Notificaciones = () => (
    <Toaster
        position="top-center"
        duration={DURACION_MS}
        gap={12}
        offset={16}
        // El predeterminado es «Notifications», en inglés, y es lo que anuncia el lector de pantalla al entrar en la región.
        containerAriaLabel="Notificaciones"
    />
);
