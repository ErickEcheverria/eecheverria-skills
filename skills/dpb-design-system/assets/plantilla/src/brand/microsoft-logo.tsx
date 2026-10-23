import type { SVGProps } from "react";

/**
 * Marca de Microsoft (los cuatro cuadros) para el botón de acceso.
 *
 * Va aquí y no en `components/base/buttons/social-logos.tsx` porque ese archivo es
 * código generado por el CLI de Untitled UI —su catálogo trae Google, Apple, Facebook,
 * X, Figma y Dribbble, pero no Microsoft— y se sobrescribe con `untitledui upgrade`.
 *
 * Colores oficiales de Microsoft, deliberadamente fuera del sistema de tokens: son la
 * marca de un tercero y no deben cambiar con el tema de la aplicación.
 */
export const MicrosoftLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 21 21" aria-hidden="true" focusable="false" {...props}>
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
);
