import { Avatar } from "@desarrollospaloblanco/ui/components/base/avatar/avatar";
import { Dropdown } from "@desarrollospaloblanco/ui/components/base/dropdown/dropdown";
import { Tooltip } from "@desarrollospaloblanco/ui/components/base/tooltip/tooltip";
import { cx } from "@desarrollospaloblanco/ui/utils/cx";
import { ChevronLeftDouble, ChevronRightDouble, ChevronSelectorVertical, LogOut01 } from "@untitledui/icons";
import { Button as AriaButton, Focusable as AriaFocusable } from "react-aria-components";
import { NavLink } from "react-router";
import { AppLogo } from "@/brand/app-logo";
import { NAV_ITEMS } from "@/features/shell/nav-items";
import { visibleNavItems } from "@/features/shell/navegacion";
import { useCuenta } from "@/features/shell/use-cuenta";

/**
 * La sidebar de la app: lockup, módulos y menú de la cuenta. Ningún proyecto la edita: los
 * módulos salen de `nav-items.ts`, la cuenta de `use-cuenta.ts` y el lockup de `shell.config.ts`.
 */

/**
 * El módulo activo se marca con el ICONO en azul de marca, sobre el gris sutil de siempre
 * (`bg-secondary`, el mismo que usa el `nav-item` del catálogo; el `bg-active` del catálogo anterior ya
 * no existe y no pinta nada): con la barra colapsada, el gris solo casi no se distinguía del resto. El
 * fondo azul sólido se probó y se descartó: basta con el icono.
 */
const linkStyles = (isActive: boolean, isCollapsed: boolean) =>
    cx(
        "flex items-center gap-3 rounded-md p-2 text-sm font-semibold outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
        isCollapsed && "justify-center",
        isActive ? "bg-secondary text-secondary_hover hover:bg-secondary_hover" : "text-secondary hover:bg-primary_hover hover:text-secondary_hover",
    );

/** Iniciales para el avatar cuando no hay foto: "Carlos Rivas" → "CR". */
const inicialesDe = (nombre: string): string =>
    nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() ?? "")
        .join("");

/**
 * Nombres en un renglón y apellidos en otro: "Ana Lucía Pérez Morales" →
 * ["Ana Lucía", "Pérez Morales"].
 *
 * Los nombres del directorio vienen completos y en una sola línea se cortaba justo el
 * apellido, que es lo que identifica. El corte es por convención —los dos últimos son los
 * apellidos— y no por la mitad del texto, para que un nombre compuesto no quede partido.
 * Un apellido compuesto («de León») sí puede quedar mal repartido; el popover da el nombre
 * entero en cualquier caso.
 */
const partirNombre = (nombre: string): string[] => {
    const palabras = nombre.split(/\s+/).filter(Boolean);
    if (palabras.length < 2) return [nombre];
    const corte = palabras.length === 2 ? 1 : palabras.length - 2;
    return [palabras.slice(0, corte).join(" "), palabras.slice(corte).join(" ")];
};

export const Sidebar = ({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean; onToggleCollapse: () => void }) => {
    const { cuenta, cerrarSesion } = useCuenta();
    const items = visibleNavItems(NAV_ITEMS, cuenta?.rol);

    return (
        // Un `div` y no un `<aside>`: es la navegación principal, no contenido complementario; el
        // landmark con nombre es el `<nav>` de adentro.
        <div
            className={cx(
                // La sidebar es una TARJETA que flota sobre el lienzo, no un panel
                // pegado al borde: fondo propio, borde sutil, esquinas y sombra.
                //
                // `interpolate-size` deja animar entre 72 px y `auto`, que CSS no interpola
                // por sí solo. Donde no se soporta, la barra cambia de golpe, sin romperse.
                //
                // Tres pisos: el logo arriba y la cuenta con «Colapsar» abajo quedan FIJOS, y solo
                // la navegación de en medio se desplaza cuando no cabe (pantallas bajas). Si se
                // desplazara la tarjeta entera, el perfil se iría de la vista.
                "flex shrink-0 flex-col overflow-hidden rounded-xl bg-primary p-3 shadow-md ring-1 ring-secondary transition-[width] duration-200 ease-in-out [interpolate-size:allow-keywords] motion-reduce:transition-none",
                // Expandida, el ancho lo decide el CONTENIDO y no un número fijo: 240 px como
                // mínimo, y más solo si el nombre del usuario lo necesita para caber entero.
                // El tope de 320 px es para un nombre desmesurado, que entonces se trunca en
                // vez de comerse la pantalla.
                isCollapsed ? "w-[72px]" : "w-auto max-w-80 min-w-60",
            )}
        >
            <div className={cx("mb-4 shrink-0 px-1", isCollapsed && "flex justify-center px-0")}>
                <AppLogo colapsado={isCollapsed} />
            </div>

            {/* `-mx-1 px-1 pt-1`: el área con scroll recortaría el anillo de foco de los enlaces, que
                se pinta 4 px por fuera; arriba también, o el del primero perdía su borde superior. */}
            <nav aria-label="Navegación principal" className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-1 pb-2">
                <ul className="flex flex-col gap-1">
                    {items.map(({ label, href, icon: Icon, grupo }, indice) => {
                        // Separador al cambiar de sección, nunca antes de la primera entrada visible:
                        // si el rol oculta las primeras entradas, la sección que queda arriba no
                        // abre con una raya.
                        const abreSeccion = indice > 0 && grupo !== items[indice - 1].grupo;
                        const link = (
                            // `end` solo en la raíz: sin él, «Inicio» (`/`) quedaría activo en todas las
                            // pantallas; con él en todos, `/proveedores/7` no marcaría su módulo.
                            <NavLink to={href} end={href === "/"} aria-label={label} className={({ isActive }) => linkStyles(isActive, isCollapsed)}>
                                {({ isActive }) => (
                                    <>
                                        <Icon data-icon className={cx("size-5 shrink-0", isActive ? "text-fg-brand-primary" : "text-fg-quaternary")} />
                                        {!isCollapsed && <span className="truncate">{label}</span>}
                                    </>
                                )}
                            </NavLink>
                        );

                        return (
                            <li key={href}>
                                {abreSeccion && (
                                    // El título del grupo es texto normal, fuera del separador: dentro de un
                                    // `role="separator"` sus hijos son presentacionales y el lector no lo leía.
                                    <div className={cx("mt-2 mb-1", !isCollapsed && "px-2")}>
                                        <div role="separator" className="border-t border-secondary" />
                                        {!isCollapsed && grupo && <p className="mt-2 text-xs font-medium text-quaternary">{grupo}</p>}
                                    </div>
                                )}
                                {isCollapsed ? (
                                    // `Focusable` le pasa al `<a>` los eventos de foco y hover que el
                                    // `TooltipTrigger` de React Aria espera de su hijo: un `NavLink`
                                    // suelto no los escucha y el tooltip no abría nunca, ni con
                                    // ratón ni con teclado.
                                    <Tooltip title={label} placement="right">
                                        <AriaFocusable>{link}</AriaFocusable>
                                    </Tooltip>
                                ) : (
                                    link
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="flex shrink-0 flex-col gap-1 border-t border-secondary pt-2">
                {cuenta && (
                    // El usuario ES el menú de la cuenta: «Cerrar sesión» vive dentro, como en
                    // cualquier aplicación, y no como una entrada suelta de la navegación que
                    // competiría con los módulos y quedaría a un clic accidental de distancia.
                    <Dropdown.Root>
                        <AriaButton
                            aria-label={`Cuenta de ${cuenta.nombre}`}
                            className={({ isHovered, isPressed, isFocusVisible }) =>
                                cx(
                                    // Rejilla y no flex: así la foto se centra con los DOS
                                    // renglones del nombre, y el detalle queda debajo alineado con
                                    // el texto. Con flex se centraba con el bloque entero.
                                    "grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-md p-2 text-left outline-focus-ring transition duration-100 ease-linear",
                                    (isHovered || isPressed) && "bg-primary_hover",
                                    isFocusVisible && "outline-2 outline-offset-2",
                                    isCollapsed && "flex justify-center",
                                )
                            }
                        >
                            <Avatar size={isCollapsed ? "sm" : "md"} src={cuenta.foto} initials={inicialesDe(cuenta.nombre)} alt="" className="shrink-0" />
                            {!isCollapsed && (
                                <>
                                    <span className="text-sm font-semibold text-primary">
                                        {partirNombre(cuenta.nombre).map((renglon, indice) => (
                                            <span key={indice} className="block truncate">
                                                {renglon}
                                            </span>
                                        ))}
                                    </span>
                                    <ChevronSelectorVertical aria-hidden="true" className="size-4 shrink-0 text-fg-quaternary" />
                                    {cuenta.detalle && <span className="col-start-2 truncate text-xs text-tertiary">{cuenta.detalle}</span>}
                                </>
                            )}
                        </AriaButton>

                        {/* Hacia arriba, porque el botón está al pie de la pantalla; con la
                            barra colapsada, a la derecha, que es donde hay sitio. */}
                        <Dropdown.Popover placement={isCollapsed ? "right bottom" : "top"} className="w-60">
                            <div className="border-b border-secondary px-4 py-3">
                                <p className="text-sm font-semibold text-primary">{cuenta.nombre}</p>
                                <p className="truncate text-sm text-tertiary">{cuenta.correo}</p>
                            </div>
                            <Dropdown.Menu aria-label="Opciones de la cuenta">
                                <Dropdown.Item icon={LogOut01} onAction={() => void cerrarSesion()}>
                                    Cerrar sesión
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>
                )}

                <button
                    type="button"
                    onClick={onToggleCollapse}
                    aria-label={isCollapsed ? "Expandir navegación" : "Colapsar navegación"}
                    className={cx(
                        // `cursor-pointer` explícito: Tailwind 4 dejó los <button> con el
                        // cursor por defecto, y sin él no parecía clicable.
                        "flex cursor-pointer items-center gap-3 rounded-md p-2 text-sm font-semibold text-secondary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
                        isCollapsed && "justify-center",
                    )}
                >
                    {isCollapsed ? (
                        <ChevronRightDouble data-icon className="size-5 shrink-0 text-fg-quaternary" />
                    ) : (
                        <ChevronLeftDouble data-icon className="size-5 shrink-0 text-fg-quaternary" />
                    )}
                    {!isCollapsed && <span className="truncate">Colapsar</span>}
                </button>
            </div>
        </div>
    );
};
