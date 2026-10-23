import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { TarjetaDialogo } from "@/features/comunes/tarjeta-dialogo";

/**
 * La confirmación de lo que no se puede deshacer: eliminar, enviar, cerrar un periodo. El texto
 * (`children`) explica qué va a pasar; el botón dice la acción con un verbo («Eliminar»), no «Aceptar».
 */

interface ConfirmarDialogProps {
    abierto: boolean;
    onCambiarApertura: (abierto: boolean) => void;
    titulo: string;
    children: ReactNode;
    etiquetaConfirmar: string;
    /** `primary-destructive` para lo destructivo o irreversible; `primary` para el resto. */
    tono?: "primary" | "primary-destructive";
    /** Mientras la escritura está en curso: «Cancelar» se apaga y el botón muestra que trabaja. */
    trabajando: boolean;
    onConfirmar: () => void;
}

export const ConfirmarDialog = ({
    abierto,
    onCambiarApertura,
    titulo,
    children,
    etiquetaConfirmar,
    tono = "primary",
    trabajando,
    onConfirmar,
}: ConfirmarDialogProps) => (
    // Mientras trabaja no se cierra ni con Escape ni con el clic fuera, igual que «Cancelar» se apaga:
    // cerrar a media escritura escondería el resultado, y un error ya no tendría dónde mostrarse.
    <ModalOverlay isOpen={abierto} onOpenChange={onCambiarApertura} isDismissable={!trabajando} isKeyboardDismissDisabled={trabajando}>
        <Modal className="max-w-md">
            <Dialog aria-label={titulo}>
                {/* El texto va en el CUERPO y no como `descripcion`: la cabecera es fija y no se desplaza,
                    así que una confirmación con una lista larga empujaba los botones fuera de la ventana.
                    Sin ×: se sale con «Cancelar», Escape o el clic fuera. */}
                <TarjetaDialogo
                    titulo={titulo}
                    pie={
                        <>
                            <Button color="secondary" onPress={() => onCambiarApertura(false)} isDisabled={trabajando}>
                                Cancelar
                            </Button>
                            <Button color={tono} onPress={onConfirmar} isLoading={trabajando} showTextWhileLoading>
                                {etiquetaConfirmar}
                            </Button>
                        </>
                    }
                >
                    <div className="text-sm text-tertiary">{children}</div>
                </TarjetaDialogo>
            </Dialog>
        </Modal>
    </ModalOverlay>
);
