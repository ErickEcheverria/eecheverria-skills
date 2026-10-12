# Formatos del manual

## `book.json` (raíz del proyecto)

```json
{
  "meta": {
    "title": "Manual de usuario",
    "subtitle": "Nombre de la app",
    "product": "Nombre de la app",
    "version": "1.0",
    "date": "Octubre 2026",
    "audience": "Usuarios de la empresa",
    "footer": "Empresa · Uso interno",
    "coverNote": "Párrafo corto de la portada (admite **negrita**).",
    "tocIntro": "Frase sobre el índice.",
    "mark": "assets/brand/mark.svg",
    "logo": "assets/brand/logo.svg",
    "font": "assets/fonts/Fuente.woff2",
    "theme": { "primary": "#2c589a", "primarySoft": "#e8eef7", "accent": "#cc1f37" },
    "rolesIntro": "Busca tu rol y empieza por esas páginas.",
    "roles": [
      { "role": "Solicitante", "description": "Crea y envía a aprobación.", "pages": ["modulo-a::Lista de documentos", "modulo-a::Nuevo documento"] }
    ]
  },
  "chapters": ["inicio", "modulo-a", "modulo-b"],
  "extraCoords": ["work/chapters/menu.coords.json"]
}
```

`chapters` es el orden del índice; cada id es un `work/chapters/<id>.json`. `extraCoords` suma
coordenadas de capturas hechas fuera de un capítulo (p. ej. el menú expandido). `accent` es el
color de los círculos numerados. `roles` arma la **guía por rol**: cada página se nombra
`<id del capítulo>::<título exacto de la página>` (si no existe, el build falla). El índice
detallado y la guía se reparten solos en varias páginas y cada renglón es un enlace del PDF.

## `work/chapters/<id>.screens.json` (lo que se captura)

```json
{
  "baseUrl": "https://app-dev.ejemplo.com",
  "hideCss": "[data-sonner-toaster] { display: none !important; }",
  "screens": [
    {
      "id": "mod-lista",
      "route": "/modulo?view=all",
      "waitFor": "[data-tour='lista-header']",
      "settle": 3000,
      "actions": [
        { "click": "button[aria-label='Más acciones']", "wait": 800 },
        { "clickText": "Filtros", "scope": "button" },
        { "key": "ArrowRight", "keyCode": 39, "times": 2, "gap": 900 },
        { "hover": "tbody tr:first-child" },
        { "eval": "window.scrollTo(0, 400)" },
        { "waitFor": "[role='menu']" }
      ],
      "css": "CSS extra solo para esta captura",
      "crop": "[data-slot='dialog-content']",
      "cropPad": 16,
      "scrollY": 0,
      "markers": ["input[placeholder^='Buscar']", "button:has(svg.lucide-plus)"]
    }
  ]
}
```

- El capturador fija la ventana en 1440×900 y saca la vista visible (o el recorte de `crop`).
- `markers`: el círculo N es el selector N. Si un selector no se ve, queda `null` (sin círculo).
- Variables de entorno: `OWN_TAB=1` (pestaña propia con la misma sesión), `FRESH_CONTEXT=1`
  (contexto sin sesión, para la pantalla de login).
- `coords.json` resultante: `{ "<id>": { "width", "height", "markers": [{ "x": %, "y": % } | null] } }`.

## `work/chapters/<id>.json` (el texto)

```json
{
  "id": "modulo-a",
  "title": "Módulo A",
  "summary": "Una línea para el índice",
  "intro": "Para qué sirve el módulo (2-3 frases).",
  "audience": "Quién lo usa",
  "pages": [
    {
      "title": "Lista de documentos",
      "purpose": "Qué se hace en esta pantalla.",
      "image": "mod-lista",
      "steps": ["Explica el círculo 1.", "Explica el círculo 2."],
      "note": "Opcional.",
      "noteTitle": "Opcional (por defecto Importante)",
      "maxImageHeight": 1000
    },
    {
      "title": "Página sin captura",
      "text": ["Párrafo 1.", "Párrafo 2."]
    }
  ]
}
```

La primera página de cada capítulo lleva arriba el bloque del capítulo (número, título, `intro`,
`audience`). `**texto**` se muestra en negrita en todos los campos de texto.
