/**
 * Los montos de toda app DPB: quetzales en español de Guatemala. Un solo lugar para que dos pantallas
 * no escriban la misma cifra de dos formas.
 *
 * Los formateadores se crean una vez: `Intl.NumberFormat` es caro de construir y una tabla pinta
 * cientos de celdas.
 */

const MONEDA = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ENTERO = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 0 });
const UN_DECIMAL = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 });

/** El monto exacto, con centavos: «Q 4,500.00» (el espacio lo pone `Intl` para es-GT; no lo quites a mano). */
export const formatearMonto = (monto: number): string => MONEDA.format(monto);

/**
 * Un monto COMPACTO para columnas estrechas y KPIs: «109», «1.9k», «1.4M», «-1.9k». Pierde centavos a
 * propósito, así que va siempre con el exacto (`formatearMonto`) a mano: el `exacto` de `CifraKpi`, un
 * `title`, el detalle.
 *
 * Propio y no `Intl` con `notation: "compact"`: en `es-GT` mezcla «1.7 K» y «184.5 k» en la misma
 * columna, y una escala que cambia de letra se lee como dos unidades distintas.
 */
export const formatearCompacto = (monto: number): string => {
    const signo = monto < 0 ? "-" : "";
    const absoluto = Math.abs(monto);
    if (absoluto >= 1_000_000) return `${signo}${UN_DECIMAL.format(absoluto / 1_000_000)}M`;
    if (absoluto >= 1_000) return `${signo}${UN_DECIMAL.format(absoluto / 1_000)}k`;
    return `${signo}${ENTERO.format(absoluto)}`;
};
