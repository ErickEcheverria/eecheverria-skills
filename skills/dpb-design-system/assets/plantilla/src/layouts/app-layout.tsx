import type { ReactNode } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useLocation } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Sidebar } from "@/features/shell/sidebar";
import { useSidebarCollapsed } from "@/features/shell/use-sidebar-collapsed";

/**
 * La cáscara de toda pantalla con sesión: cada página de `src/pages/` monta su `AppLayout`.
 * Ningún proyecto lo edita; la pantalla pone el título, la acción, los filtros y el contenido.
 */

/**
 * La entrada de una pantalla nueva: se funde y sube cuatro píxeles.
 *
 * Sin esto el cambio de módulo es un corte seco — la pantalla entera se sustituye en un
 * fotograma y no queda ni rastro de que hubo una navegación.
 *
 * **200 ms y 4 px, y no más.** Una transición de navegación compite con la tarea del
 * usuario: por encima de unos 300 ms deja de leerse como pulido y empieza a leerse como
 * lentitud, porque se interpone entre pulsar y ver. El desplazamiento es mínimo a
 * propósito; lo que suaviza el corte es la fundida, el movimiento solo le da dirección.
 *
 * `motion-reduce:animate-none` no es un detalle opcional: para quien tiene activado
 * «reducir movimiento» en el sistema —por vértigo o sensibilidad vestibular— una pantalla
 * que se desplaza en cada navegación es un síntoma, no un adorno.
 *
 * Va sobre `tailwindcss-animate`, que ya está registrado como plugin en `globals.css` y lo
 * usan los componentes del catálogo. Una animación de entrada sin salida no necesita nada
 * de JavaScript.
 */
const TRANSICION = "animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out motion-reduce:animate-none";

interface AppLayoutProps {
    title: string;
    /** Línea de apoyo bajo el título. */
    subtitle?: string;
    /** Acción principal de la pantalla, arriba a la derecha. */
    action?: ReactNode;
    /**
     * Qué se está viendo (periodo, área…), en un renglón propio bajo el título. Va en la
     * cabecera y no en `children` para que no se vaya con el scroll, y aparte de `action` para que
     * los botones sigan arriba a la derecha aunque los selectores sean anchos.
     */
    filtros?: ReactNode;
    /**
     * Enlace de vuelta, sobre el título. Para las pantallas de detalle.
     *
     * Vive en el layout y no en cada pantalla porque el `<header>` está por encima de
     * `<main>`: metido en `children` aparecería DEBAJO del título, que es al revés de donde
     * se busca. Navega con el router, no recarga.
     */
    volverA?: { href: string; label: string };
    children: ReactNode;
}

/**
 * Cáscara de la aplicación: dos TARJETAS flotando sobre el lienzo.
 *
 * El fondo de la página es `bg-canvas` (token propio, ver styles/brand-dpb.css) y
 * tanto la sidebar como el contenido son `bg-primary` con borde, radio y sombra. El
 * aire entre ellas lo da el padding del contenedor, no un margen de cada tarjeta.
 *
 * `h-dvh` + `overflow-hidden` dejan el scroll DENTRO de la tarjeta de contenido: así
 * la cabecera de la pantalla no se va con el scroll y las tarjetas nunca se salen del
 * viewport. Importa en las tablas largas: el encabezado y los totales se quedan fijos.
 *
 * `main` es un contenedor flex en columna para que una pantalla pueda pedir todo el
 * alto disponible con `flex-1`. Y es `relative` como red: un `absolute` sin ancestro
 * posicionado (un `sr-only`, por ejemplo) no lo recorta ningún `overflow` y agranda el
 * documento, y la página gana un segundo scroll. Ver `AREA_TABLA` en `comunes/tabla.ts`.
 */
export const AppLayout = ({ title, subtitle, action, filtros, volverA, children }: AppLayoutProps) => {
    const { isCollapsed, toggle } = useSidebarCollapsed();
    const { pathname } = useLocation();

    return (
        <div className="flex h-dvh gap-3 overflow-hidden bg-canvas p-3">
            <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggle} />

            {/* La tarjeta NO se anima: se animan su cabecera y su contenido.
                Lo que cambia entre módulos es lo de dentro, así que el marco —borde, sombra,
                fondo— se queda quieto y solo se renueva lo que de verdad es distinto. Animar
                la tarjeta entera haría que el panel se despegara del lienzo en cada
                navegación, que es más movimiento del que el cambio justifica. */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-primary shadow-md ring-1 ring-secondary">
                {/* La `key` es lo que REARRANCA la animación.
                    Cada pantalla monta su propio `AppLayout`, así que al navegar React
                    reconcilia el mismo componente en la misma posición en vez de montarlo de
                    nuevo: sin la key, las clases de `animate-in` ya están aplicadas desde la
                    primera carga y no vuelven a dispararse nunca. Cambiar la key fuerza un
                    montaje nuevo, que es justo lo que reinicia el CSS.

                    Se anima cada hijo por separado y no un envoltorio común a propósito: un
                    nivel de flex de más entre la tarjeta y `main` rompería la cadena de
                    `min-h-0` que mantiene el scroll dentro de la rejilla.

                    Las dos keys llevan un prefijo distinto: son HERMANOS, y con la misma key React no
                    sabe cuál es cuál. Si se agrega una franja delante, la cabecera saldría duplicada
                    en cada render. */}
                {/* En móvil, menos relleno y sin subtítulo: la cabecera no se va con el scroll, así que
                    cada renglón suyo es uno menos para el contenido. */}
                <header
                    key={`encabezado:${pathname}`}
                    className={`flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3 sm:gap-4 sm:px-6 sm:pt-6 sm:pb-5 ${TRANSICION}`}
                >
                    <div className="min-w-0">
                        {volverA && (
                            <Button color="link-gray" size="sm" iconLeading={ArrowLeft} href={volverA.href} className="mb-2">
                                {volverA.label}
                            </Button>
                        )}
                        <h1 className="truncate text-display-xs font-semibold text-primary">{title}</h1>
                        {subtitle && <p className="mt-1 hidden text-sm text-tertiary sm:block">{subtitle}</p>}
                    </div>

                    {/* `ml-auto`: si no cabe junto al título y baja de renglón, sigue pegada a la derecha. */}
                    {action && <div className="ml-auto shrink-0">{action}</div>}

                    {/* `basis-full` lo obliga a un renglón propio, debajo del título y de la acción. */}
                    {filtros && <div className="flex basis-full flex-wrap items-center gap-3">{filtros}</div>}
                </header>

                <main key={`contenido:${pathname}`} className={`relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 ${TRANSICION}`}>
                    {children}
                </main>
            </div>
        </div>
    );
};
