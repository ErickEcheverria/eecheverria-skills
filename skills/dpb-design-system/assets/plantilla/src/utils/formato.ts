/**
 * Montos y fechas de toda app DPB: quetzales y español de Guatemala. Un solo lugar para que dos
 * pantallas no escriban la misma cifra (o la misma fecha) de dos formas.
 *
 * Los formateadores se crean una vez: `Intl.NumberFormat` es caro de construir y una tabla pinta
 * cientos de celdas.
 */

// `signDisplay: "negative"`: un residuo de flotantes (-0.004) no sale «-Q 0.00».
const MONEDA = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "negative",
});
const ENTERO = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 0 });
const UN_DECIMAL = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 });

/** El monto exacto, con centavos: «Q 4,500.00» (el espacio lo pone `Intl` para es-GT; no lo quites a mano). */
export const formatearMonto = (monto: number): string => MONEDA.format(monto);

/**
 * Lo inverso de `formatearMonto`, para el campo que se formatea al salir: «Q 4,500.00», «4500» y
 * «-Q 1,250.5» se leen 4500, 4500 y -1250.5. Quita la «Q», las comas y los espacios (también el duro
 * que pone `Intl`). Lo que no es un número, o el campo vacío, da `null`: el formulario decide si es un
 * error, en vez de guardar `NaN` o un cero que nadie escribió.
 */
export const leerMonto = (texto: string): number | null => {
    const limpio = texto.replace(/[Q,\s]/gi, "");
    return /^-?(\d+\.?\d*|\.\d+)$/.test(limpio) ? Number(limpio) : null;
};

/**
 * Un monto COMPACTO para columnas estrechas y KPIs: «109», «1.9k», «1.4M», «-1.9k». Pierde centavos a
 * propósito, así que va siempre con el exacto (`formatearMonto`) a mano: el `exacto` de `CifraKpi`, un
 * `title`, el detalle.
 *
 * Propio y no `Intl` con `notation: "compact"`: en `es-GT` mezcla «1.7 K» y «184.5 k» en la misma
 * columna, y una escala que cambia de letra se lee como dos unidades distintas.
 *
 * La escala se elige DESPUÉS de redondear: si no, 999 950 saldría «1,000k» en vez de «1M».
 */
export const formatearCompacto = (monto: number): string => {
    const absoluto = Math.abs(monto);
    const entero = Math.round(absoluto);
    const enMiles = Math.round(absoluto / 100) / 10;
    const [valor, sufijo] = enMiles >= 1000 ? [Math.round(absoluto / 100_000) / 10, "M"] : entero >= 1000 ? [enMiles, "k"] : [entero, ""];
    // Lo que redondea a cero no lleva signo: «-0» se lee como un error.
    const signo = monto < 0 && valor !== 0 ? "-" : "";
    return `${signo}${(sufijo ? UN_DECIMAL : ENTERO).format(valor)}${sufijo}`;
};

/** Los meses abreviados, para ejes y encabezados: índice 0 = enero (un backend que numera 1-12 resta uno). */
export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] as const;

/**
 * Una fecha «AAAA-MM-DD» del backend como «dd/mm/aaaa», SIN pasar por `Date`: `new Date("2026-10-22")`
 * es medianoche UTC, que en Guatemala (UTC-6) cae el día anterior. Solo acepta la fecha sola: una
 * fecha-hora («2026-10-23T03:00:00Z») NO se recorta, porque su día depende de la zona horaria; esa
 * se formatea con `Intl.DateTimeFormat` y `timeZone`. Lo que no tenga la forma se devuelve tal cual,
 * para que un dato raro se vea en vez de convertirse en «NaN».
 */
export const formatearFecha = (fecha: string): string => {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : fecha;
};
