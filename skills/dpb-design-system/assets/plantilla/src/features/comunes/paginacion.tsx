import { useEffect, useRef } from "react";
import { Button } from "@desarrollospaloblanco/ui/components/base/buttons/button";
import { ArrowLeft, ArrowRight } from "@untitledui/icons";

/**
 * El paginador de un listado, debajo de su tabla. Las props son `page`, `totalPages` y `total`
 * (registros): mapéalas desde el contrato del backend, p. ej. `total={pagination.totalItems}`.
 *
 * `isDisabled` es para cuando no se puede paginar, NO para una recarga: deshabilitar el botón que tiene
 * el foco lo tira a `<body>`. Mientras recarga, deja los botones activos e ignora el clic si ya hay una
 * carga en curso.
 */

interface PaginacionProps {
    page: number;
    totalPages: number;
    total: number;
    onCambiarPagina: (pagina: number) => void;
    isDisabled?: boolean;
}

/**
 * Compuesto con dos `Button` del catálogo en vez de `PaginationPageDefault`, que trae «Previous»,
 * «Next» y «Page 1 of 10» fijos en inglés dentro del paquete, que no se edita desde la app.
 *
 * Sin numeritos de página: en un listado que se filtra por búsqueda nadie salta a la página once. Lo
 * que se usa es avanzar, retroceder y saber dónde se está.
 *
 * Por debajo de `sm` los botones quedan solo con la flecha y el texto en «1 de 5»: con la sidebar
 * colapsada, a 320 px la tarjeta deja ~180 px y las dos etiquetas no cabían, así que la tarjeta ganaba
 * un scroll horizontal. «Anterior», «Siguiente» y «Página» siguen ahí para el lector de pantalla.
 */
export const Paginacion = ({ page, totalPages, total, onCambiarPagina, isDisabled }: PaginacionProps) => {
    const navRef = useRef<HTMLElement>(null);
    const ultimo = useRef<"anterior" | "siguiente" | null>(null);

    // Al llegar a la primera o a la última página, el botón que se acaba de pulsar se deshabilita y
    // el navegador suelta el foco. Se pasa al botón contrario, que es el único que sigue sirviendo;
    // solo si el foco de verdad se perdió, para no quitárselo a quien ya se movió a otro lado.
    useEffect(() => {
        const [anterior, siguiente] = navRef.current?.querySelectorAll("button") ?? [];
        // El efecto puede correr antes de que el navegador suelte el foco del botón recién
        // deshabilitado: un botón deshabilitado con el foco cuenta como foco perdido.
        const activo = document.activeElement;
        const perdido =
            activo === null || activo === document.body || ((activo === anterior || activo === siguiente) && (activo as HTMLButtonElement).disabled);
        if (!perdido) return;
        if (ultimo.current === "siguiente" && page >= totalPages) anterior?.focus();
        if (ultimo.current === "anterior" && page <= 1) siguiente?.focus();
    }, [page, totalPages]);

    // Con una sola página no hay nada que paginar, pero el total sí interesa: responde a «¿cuántos hay?».
    if (totalPages <= 1) {
        return (
            <p className="border-t border-secondary pt-4 text-sm text-tertiary">
                {total} {total === 1 ? "registro" : "registros"}
            </p>
        );
    }

    const ir = (direccion: "anterior" | "siguiente") => {
        ultimo.current = direccion;
        onCambiarPagina(direccion === "anterior" ? page - 1 : page + 1);
    };

    return (
        <nav ref={navRef} aria-label="Paginación" className="flex items-center justify-between gap-3 border-t border-secondary pt-4">
            <Button color="secondary" size="sm" iconLeading={ArrowLeft} className="max-sm:px-2" onPress={() => ir("anterior")} isDisabled={isDisabled || page <= 1}>
                <span className="max-sm:sr-only">Anterior</span>
            </Button>

            {/* `aria-live`: sin él, pulsar «Siguiente» no produce ningún aviso audible y parece no haber hecho nada. */}
            <p aria-live="polite" className="text-sm text-tertiary">
                <span className="max-sm:sr-only">Página </span>
                <span className="font-medium text-secondary">{page}</span> de <span className="font-medium text-secondary">{totalPages}</span>
                <span className="hidden sm:inline"> · {total} registros</span>
            </p>

            <Button color="secondary" size="sm" iconTrailing={ArrowRight} className="max-sm:px-2" onPress={() => ir("siguiente")} isDisabled={isDisabled || page >= totalPages}>
                <span className="max-sm:sr-only">Siguiente</span>
            </Button>
        </nav>
    );
};
