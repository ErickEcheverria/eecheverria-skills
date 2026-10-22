import { ArrowLeft, ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

/**
 * El paginador de un listado, debajo de su tabla. Las props siguen el `meta` del backend
 * (`page`, `totalPages`, `total`), así que se puede pasar `{...meta}` tal cual.
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
 * «Next» y «Page 1 of 10» fijos en inglés dentro de `src/components/`, que no se edita.
 *
 * Sin numeritos de página: en un listado que se filtra por búsqueda nadie salta a la página once. Lo
 * que se usa es avanzar, retroceder y saber dónde se está.
 */
export const Paginacion = ({ page, totalPages, total, onCambiarPagina, isDisabled }: PaginacionProps) => {
    // Con una sola página no hay nada que paginar, pero el total sí interesa: responde a «¿cuántos hay?».
    if (totalPages <= 1) {
        return (
            <p className="border-t border-secondary pt-4 text-sm text-tertiary">
                {total} {total === 1 ? "registro" : "registros"}
            </p>
        );
    }

    return (
        <nav aria-label="Paginación" className="flex items-center justify-between gap-3 border-t border-secondary pt-4">
            <Button color="secondary" size="sm" iconLeading={ArrowLeft} onPress={() => onCambiarPagina(page - 1)} isDisabled={isDisabled || page <= 1}>
                Anterior
            </Button>

            {/* `aria-live`: sin él, pulsar «Siguiente» no produce ningún aviso audible y parece no haber hecho nada. */}
            <p aria-live="polite" className="text-sm text-tertiary">
                Página <span className="font-medium text-secondary">{page}</span> de <span className="font-medium text-secondary">{totalPages}</span>
                <span className="hidden sm:inline"> · {total} registros</span>
            </p>

            <Button
                color="secondary"
                size="sm"
                iconTrailing={ArrowRight}
                onPress={() => onCambiarPagina(page + 1)}
                isDisabled={isDisabled || page >= totalPages}
            >
                Siguiente
            </Button>
        </nav>
    );
};
