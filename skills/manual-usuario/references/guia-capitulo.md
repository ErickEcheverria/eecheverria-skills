# Guía para armar un capítulo del manual

Proyecto del manual: la carpeta con `tools/`, `assets/` y `book.json`. La app corre en
el ambiente acordado (`baseUrl`) y el Chrome de depuración (puerto 9222) ya tiene la
sesión del usuario. Las capturas son SIEMPRE reales; nunca se dibuja una pantalla.

## Seguridad en el ambiente (obligatorio)

Solo se mira. Nada que cambie datos ni la sesión:

- Se puede: navegar, abrir menús, abrir diálogos, desplegar filas, escribir en un buscador o en un
  formulario **sin guardar**, cambiar de pestaña o de filtro.
- Ajusta esta lista a los botones de la app. NUNCA hacer clic en: Guardar, Crear, Actualizar, Enviar, Enviar a aprobación, Aprobar, Aprobar y
  generar, Rechazar, Devolver, Generar, Anular, Cerrar saldo, Eliminar, Duplicar, Confirmar,
  Continuar, Sincronizar, Reintentar, Marcar todas, Cerrar sesión, ni ningún botón que confirme un
  diálogo. Para cerrar un diálogo: tecla Escape (`{ "key": "Escape", "keyCode": 27 }`).
- NUNCA cambiar algo que afecte a TODAS las pestañas: cambiar de empresa, "Ver como otro rol"
  (solo abrir el diálogo y Escape), "Tamaño de pantalla", colapsar o expandir el menú lateral.
- No consultes bases de datos ni sistemas externos (ERP) directamente.

## Herramientas

- Captura (cada agente en su propia pestaña, misma sesión):
  `OWN_TAB=1 node tools/capture.mjs work/chapters/<id>.screens.json assets/shots work/chapters/<id>.coords.json [ids]`
  - `<id>.screens.json`: `{ "baseUrl": "https://app-dev.ejemplo.com", "hideCss": "<css>", "screens": [...] }`
  - Cada screen: `id` (único, con prefijo del capítulo, p. ej. `mod-lista`), `route`, `waitFor`
    (selector), `settle` (ms), `actions` (lista de `{ click | clickText+scope | key+keyCode+times |
    hover | eval | waitFor, wait }`), `css` (CSS extra), `crop` (selector a recortar, con
    `cropPad`), `scrollY`, `markers` (selectores; el número de cada círculo es su posición).
  - El capturador pone la ventana en 1440×900. Mide la esquina de cada marcador; si un marcador no
    se ve, queda `null` (sin círculo) y avisa.
- Para el modo tutorial (datos de ejemplo, donde exista): pon en `hideCss` los selectores del overlay
  del tutorial (fondo, tarjeta del paso, banner) para que la captura quede limpia. El tutorial bloquea los clics del mouse, pero `click` del capturador es por JavaScript y sí abre
  menús y diálogos. Avanza pasos con `{ "key": "ArrowRight", "keyCode": 39, "times": N }`.
- Fuera del tutorial usa `hideCss` = `[data-sonner-toaster] { display: none !important; }` y
  datos del ambiente de pruebas. Listas con `?view=all` cuando el listado filtra por "Lo mío".
- REVISA cada captura con la herramienta Read (es una imagen) antes de darla por buena: que se vea
  lo que dice el texto, que no haya diálogos de error, que los círculos caigan en su control.

## Texto (manual.json)

Escribe `work/chapters/<id>.json` con este formato:

```json
{
  "id": "modulo-a",
  "title": "Módulo A",
  "summary": "Una línea para el índice",
  "intro": "Dos o tres frases: para qué sirve el módulo.",
  "audience": "Quién lo usa (roles)",
  "pages": [
    {
      "title": "Título corto de la pantalla",
      "purpose": "Una frase: qué se hace aquí.",
      "image": "mod-lista",
      "steps": ["Texto del círculo 1.", "Texto del círculo 2."],
      "note": "Opcional: aviso importante.",
      "noteTitle": "Opcional (por defecto Importante)"
    }
  ]
}
```

- Un paso por marcador, en el mismo orden (el paso N explica el círculo N). Puede haber pasos sin
  marcador al final (quedan numerados sin círculo); úsalo poco.
- Una página por pantalla o diálogo importante. Máximo ~8 pasos por página.
- Español neutro con **tú** ("Elige", "Haz clic en"). Lenguaje simple para usuarios no técnicos.
- Nombra los botones y campos con su texto EXACTO de la pantalla, en negrita con `**…**`.
- Respeta la terminología de la app (agrega aquí sus términos obligatorios y prohibidos).
- Sin guion largo (U+2014) en ningún texto: usa coma o " · ".
- No menciones permisos técnicos (`modulo:accion`); di "si tu rol lo permite".
- Explica para qué sirve cada cosa, no cómo está hecha.
