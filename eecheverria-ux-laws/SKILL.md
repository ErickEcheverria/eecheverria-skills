---
name: eecheverria-ux-laws
description: >-
  Aplica las leyes de UX (Laws of UX) al DISEÑAR interfaces para eecheverria, agnóstico de stack:
  convierte cada ley en una consecuencia concreta de la UI en vez de citarla de adorno. Cubre Hick y
  sobrecarga de opciones (menús, filtros, acciones), Fitts (tamaño y ubicación de targets), Jakob y
  modelos mentales (patrones familiares), Miller/memoria de trabajo/carga cognitiva (cuánto cabe en
  pantalla), las leyes Gestalt (proximidad, semejanza, región común, conectividad, Prägnanz) para
  agrupar y jerarquizar, el Umbral de Doherty (<400 ms) y Zeigarnik/tendencia a la meta para esperas y
  progreso, Von Restorff y atención selectiva para destacar, y Tesler/Occam/Pareto para decidir alcance.
  Actívate SIEMPRE que el usuario diseñe o revise UI y diga frases como "diseña esta pantalla", "hazme
  este formulario", "cómo organizo este menú", "esta vista tiene demasiadas opciones", "el usuario se
  pierde aquí", "cómo jerarquizo esta información", "qué pongo primero", "esto se siente lento",
  "revisa la usabilidad de esto", "por qué nadie encuentra este botón", "cuántos campos por paso", "cómo
  agrupo estos filtros", o cuando esté decidiendo layout, navegación, densidad de información, estados de
  espera o dónde va una acción. Es la capa de CRITERIO DE UX que complementa a eecheverria-frontend-react
  y eecheverria-untitled-ui (que ponen el CÓMO implementarlo) y al modo de trabajo de
  eecheverria-senior-dev. Si dudas entre activarla ante cualquier decisión de interfaz, actívala.
---

# Leyes de UX aplicadas al diseño de UI — eecheverria

Destilado de [Laws of UX](https://lawsofux.com/es/) para usarlo **mientras decides**, no para citarlo
después. El catálogo completo de las 30 leyes vive en
[`references/catalogo.md`](references/catalogo.md) — este documento te dice **cuál aplicar según lo que
tengas enfrente** y qué implica concretamente.

## Objetivo

Que cada decisión de interfaz —cuántas opciones muestro, dónde va el botón, qué agrupo con qué, cuánto
puede tardar— tenga detrás una razón nombrable en vez de gusto personal. Las leyes de UX son
**heurísticas sobre cómo funciona la gente**: no te dicen qué diseñar, te dicen qué costo estás pagando
cuando eliges.

## Skill viva — no te auto-edites

Esta skill es un documento vivo: el usuario Erick Echeverría y tú la irán refinando. Si detectas algo que
mejorar —una ley mal aplicada, un caso que falta, una regla que en la práctica estorba— **propónselo y
pregúntale antes de editar** la skill (`SKILL.md` y `references/`). Usarla para diseñar UI es tu trabajo
normal y no requiere preguntar.

## Cuándo usarla

- Estás diseñando una pantalla, vista, componente, formulario, tabla, menú o flujo.
- Estás revisando una UI existente y algo "no se siente bien" pero no sabes nombrarlo.
- Tienes que decidir densidad de información, jerarquía, agrupación, o dónde poner una acción.
- Estás decidiendo **qué NO mostrar**: recortar opciones, esconder tras progressive disclosure, diferir.
- Estás diseñando esperas, cargas, progreso, errores o el cierre de un flujo.

No la uses para: escribir el código del componente (eso es `eecheverria-frontend-react` /
`eecheverria-untitled-ui`), ni para medir rendimiento real (eso es `eecheverria-performance`).

---

## Las tres reglas de uso

Estas tres reglas importan más que memorizar las 30 leyes. Sin ellas, las leyes se vuelven vocabulario
decorativo.

### 1. De la ley a la consecuencia, siempre

Una ley solo cuenta si **cambia algo concreto**: un número, una posición, un elemento que desaparece.
Si mencionas una ley y el diseño queda idéntico, no la aplicaste — la citaste.

> ❌ "Aplicando la Ley de Hick, simplifiqué el menú." *(no dice qué cambió)*
> ✅ "El menú tenía 14 acciones al mismo nivel. Dejé las 4 que cubren el ~80 % del uso visibles y moví
> las otras 10 a un 'Más'. Hick: menos opciones simultáneas, decisión más rápida."

Formula siempre así: **ley → observación concreta → cambio concreto**.

### 2. Las leyes chocan entre sí; gana la tarea del usuario

No hay jerarquía fija entre leyes. Hick te empuja a esconder opciones; la descubribilidad (Fluir) te
empuja a mostrarlas. Estética-Usabilidad te premia por pulir; Occam te pide quitar. **El desempate no
lo da la ley "más fuerte", lo da la tarea**: qué está intentando lograr esta persona en esta pantalla,
y con qué frecuencia.

Cuando dos leyes chocan, dilo en voz alta y resuelve explícitamente (ver "Conflictos frecuentes").

### 3. Una ley no le gana a un dato

Las leyes son **priors**, no evidencia. Si hay analítica, grabaciones de sesión, tickets de soporte o
una prueba con usuarios reales que contradicen a la ley, mandan los datos. Lo mismo con las convenciones
ya establecidas del proyecto: si la app entera resuelve un patrón de cierta forma y es consistente,
la consistencia gana (regla de `eecheverria-senior-dev`: las convenciones locales mandan).

Y ojo con el falso rigor: `7±2` de Miller es la ley **más mal usada** del catálogo. El propio estudio
medía capacidad de canal de información, no cuántos ítems poner en un menú. Nunca uses un número de una
ley para justificar un límite arbitrario — usa la ley para **fragmentar y agrupar**, que es lo que sí
sostiene la evidencia.

---

## Mapa rápido: qué estás diseñando → qué leyes mandan

| Estás diseñando… | Leyes que mandan | La pregunta que debes responder |
|---|---|---|
| Menú, navegación, barra de acciones | Hick · Posición en Serie · Sobrecarga de Opciones | ¿Cuántas opciones compiten y cuál es la esperada? |
| Formulario | Parkinson · Postel · Fragmentación · Zeigarnik | ¿Cuántos campos son *realmente* obligatorios ahora? |
| Tabla o listado de datos | Memoria de Trabajo · Fragmentación · Semejanza · Pareto | ¿Qué columnas se usan de verdad y qué debe recordar el usuario? |
| Botones y targets (sobre todo destructivos) | Fitts · Von Restorff · Región Común | ¿Es fácil de acertar lo bueno y difícil de acertar lo malo? |
| Estados de carga y espera | Umbral de Doherty · Fluir · Tendencia a la Meta | ¿Responde en <400 ms? Si no, ¿qué ve mientras tanto? |
| Layout y agrupación visual | Proximidad · Región Común · Conectividad Uniforme · Prägnanz | ¿La cercanía visual coincide con la relación real? |
| Jerarquía y énfasis | Von Restorff · Atención Selectiva · Semejanza | ¿Qué es lo único que quiero que vean primero? |
| Onboarding y features nuevos | Paradoja del Usuario Activo · Jakob · Hick | ¿Funciona sin que lean nada? |
| Errores, vacíos y validación | Postel · Carga Cognitiva · Fin de Pico | ¿El error dice cómo salir de él? |
| Alcance del feature (qué construir) | Tesler · Occam · Pareto | ¿Quién absorbe la complejidad, el sistema o el usuario? |
| Rediseño de algo existente | Jakob · Modelo Mental · Fin de Pico | ¿Qué modelo mental estoy rompiendo y vale la pena? |

---

## Decisiones concretas

### Menús, navegación y listas de opciones

**Mandan:** Hick · Sobrecarga de Opciones · Posición en Serie

- **Cuenta las opciones que compiten al mismo tiempo**, no las que existen. Un menú de 20 ítems en 4
  grupos etiquetados es una decisión entre 4, no entre 20 — por eso la fragmentación funciona.
- **Marca la opción recomendada.** Hick no solo se ataja quitando opciones: destacar la esperada (botón
  primario, "recomendado", preselección sensata) acorta la decisión sin perder alcance.
- **Primero y último se recuerdan; el medio se pierde** (Posición en Serie). Pon las acciones clave en
  los extremos de un menú o barra, y el relleno en medio. Aplica igual a pasos de un wizard y a columnas
  de una tabla.
- **Con muchas opciones, no ordenes: filtra.** Cuando el conjunto es grande de verdad (catálogos,
  usuarios, productos), búsqueda + filtros le ganan a cualquier reordenamiento.
- **Progressive disclosure > menú plano gigante.** Lo avanzado va detrás de un "Más opciones", no fuera
  del producto.

### Formularios

**Mandan:** Parkinson · Postel · Fragmentación · Zeigarnik · Tendencia a la Meta

- **Cada campo tiene que ganarse su lugar.** Pregunta por cada uno: ¿lo necesito *ahora* o puedo pedirlo
  después? Los campos opcionales que nadie llena son carga cognitiva pura.
- **Sé liberal al recibir** (Postel): acepta el teléfono con espacios, guiones o paréntesis y normalízalo
  tú; acepta la fecha en varios formatos. Rechazar por formato es trasladarle al usuario un trabajo que
  el sistema hace mejor. Sé estricto en lo que *emites*.
- **Autocompleta y precarga** (Parkinson): si el sistema ya sabe el dato, no lo preguntes. Terminar antes
  de lo esperado mejora la percepción del producto.
- **Fragmenta los formularios largos** en pasos con sentido propio ("Datos de contacto", "Pago"), no en
  rebanadas arbitrarias. Cada paso debe poder nombrarse.
- **Muestra progreso** (Zeigarnik + Tendencia a la Meta): una tarea empezada y visible empuja a
  terminarse, y la gente acelera cuando ve el final cerca. Un "Paso 2 de 4" barato levanta finalización.
- **Valida al salir del campo, no al teclear** cada carácter; el error mientras escribes es ruido.

### Tablas y listados de datos

**Mandan:** Memoria de Trabajo · Fragmentación · Semejanza · Pareto

- **La memoria de trabajo aguanta 4–7 fragmentos por ~20–30 s.** Todo lo que obligue a recordar un dato
  de otra pantalla es un fallo de diseño: arrastra el contexto (breadcrumbs, encabezados fijos, resumen
  del filtro aplicado en pantalla).
- **Favorece reconocer sobre recordar.** Filtros activos visibles como chips, no un estado invisible.
- **Comparar exige lado a lado.** Si el usuario tiene que comparar filas, no lo mandes a abrir detalles
  uno por uno.
- **Pareto para las columnas:** unas pocas columnas cubren casi todo el uso. Esas van visibles por
  defecto; el resto, tras un selector de columnas.
- **Semejanza para el estado:** que los estados (activo/inactivo/error) compartan un lenguaje visual
  consistente en toda la app, y nunca solo por color.

### Botones, targets y acciones destructivas

**Mandan:** Fitts · Von Restorff · Región Común

- **Fitts en una frase: grande y cerca es rápido; chico y lejos es lento.** El target crece con la
  importancia y la frecuencia de la acción.
- **Tamaño mínimo táctil:** apunta a **44×44 px CSS** (WCAG 2.1 SC 2.5.5, nivel AAA); el mínimo exigible
  en AA es 24×24 px (WCAG 2.2 SC 2.5.8). Si el proyecto se rige por WCAG 2.1 AA como
  `eecheverria-frontend-react`, 44 px sigue siendo la meta sensata en móvil.
- **El área clicable incluye la etiqueta.** Un checkbox de 16 px cuyo `<label>` no es clicable
  desperdicia target gratis.
- **Fitts invertido para lo destructivo:** "Eliminar" no debe estar pegado a "Guardar" ni ser igual de
  fácil de acertar. Separación física + jerarquía visual distinta + confirmación cuando es irreversible.
- **Un solo botón primario por vista** (Von Restorff): si todo destaca, nada destaca. El énfasis es un
  presupuesto que se gasta.
- **Los controles van cerca de lo que afectan** — la acción de una fila, en la fila; no en una barra
  lejana que obliga a un viaje de ida y vuelta.

### Esperas, carga y feedback

**Mandan:** Umbral de Doherty · Fluir · Tendencia a la Meta · Zeigarnik

- **<400 ms es el umbral.** Por debajo, la interacción se siente instantánea y el usuario mantiene el
  flujo. Por encima, empieza a esperar a la máquina y se desengancha.
- **Mide, no adivines.** Si crees que algo tarda, pásalo por `eecheverria-performance` (MEASURE →
  IDENTIFY → FIX → VERIFY). El Umbral de Doherty es la *meta*; la medición es la evidencia.
- **Cuando no puedas bajar de 400 ms, trabaja la percepción:** respuesta optimista (UI actualizada antes
  de la confirmación del servidor), skeletons en vez de spinner en blanco, y progreso determinado si
  conoces la duración.
- **Escala el feedback al tiempo real:** hasta ~1 s no necesita indicador; entre ~1 y 10 s, indicador de
  actividad; más de ~10 s, progreso con porcentaje y la posibilidad de seguir en otra cosa.
- **Nunca dejes una acción sin acuse.** Un click que no produce ningún cambio visible se interpreta como
  roto y se repite (pedidos duplicados).

### Layout, agrupación y jerarquía visual

**Mandan:** Proximidad · Región Común · Conectividad Uniforme · Semejanza · Prägnanz

- **La proximidad es la señal más fuerte de todas.** Si dos cosas están cerca, se leen como relacionadas
  aunque digas lo contrario con un borde. **El espacio entre grupos debe ser claramente mayor que el
  espacio dentro del grupo** — si no, no hay grupos.
- **La etiqueta pertenece a su campo, no al de arriba.** El error clásico de espaciado uniforme:
  `label` equidistante de dos inputs. Ajusta el gap, no agregues una línea.
- **Región común (una tarjeta, un fondo, un borde) es más fuerte que la proximidad** y sirve para separar
  grupos que no puedes alejar. Úsala cuando el espacio no alcanza; no la apiles con todo lo demás.
- **La semejanza agrupa a distancia:** los elementos del mismo tipo deben verse iguales aunque estén
  separados, y —clave— **lo que no es clicable no debe parecer clicable**.
- **Prägnanz: si tu layout necesita explicación, es demasiado complejo.** La gente resuelve lo ambiguo
  hacia la interpretación más simple, que puede no ser la tuya.

### Destacar y dirigir la atención

**Mandan:** Von Restorff · Atención Selectiva · Estética-Usabilidad

- **El contraste es relativo:** algo destaca porque el resto no. Tres badges de colores en la misma fila
  se anulan entre sí.
- **Ceguera de banner:** lo que parece anuncio se ignora, aunque sea contenido tuyo. No pongas avisos
  importantes en franjas laterales de colores llamativos con forma de publicidad.
- **Ceguera al cambio:** un cambio en pantalla puede pasar totalmente desapercibido si el usuario estaba
  mirando otra cosa. Tras una acción, ancla el feedback **donde está su atención** (junto al botón que
  tocó), no en una esquina.
- **Nunca solo color** (accesibilidad + Von Restorff): color + icono, o color + texto.
- **Estética-Usabilidad tiene doble filo:** un diseño bonito se percibe como más usable y **oculta
  problemas reales de usabilidad**, incluso en pruebas. Que se vea bien no es evidencia de que funcione.

### Onboarding, features nuevos y rediseños

**Mandan:** Paradoja del Usuario Activo · Jakob · Modelo Mental · Fin de Pico

- **Nadie lee el manual.** Diseña para que se pueda usar sin leer nada; la ayuda va **contextual y en el
  momento** (tooltip, texto de apoyo junto al campo), no en una sección de documentación.
- **Ley de Jakob: no inventes lo que ya tiene convención.** El carrito, el login, el buscador, el ícono
  de perfil arriba a la derecha. Gasta tu presupuesto de originalidad en lo que te diferencia, no en
  reubicar el botón de cerrar sesión.
- **Un rediseño rompe un modelo mental ya aprendido**, y eso tiene costo real aunque el diseño nuevo sea
  objetivamente mejor. Si el cambio es grande: comunícalo, y cuando puedas, deja salida a la versión
  anterior durante la transición.
- **Fin de Pico: el recuerdo se forma en el pico y en el final.** Invierte en el momento de máximo valor
  (el resultado que buscaba) y en el cierre (confirmación clara, siguiente paso obvio). Y recuerda que
  **lo negativo pesa más**: un error mal resuelto define el recuerdo de todo el flujo.

### Errores, vacíos y validación

**Mandan:** Postel · Carga Cognitiva · Fin de Pico

- **Un error debe decir qué pasó y cómo salir.** "Error de validación" traslada al usuario un trabajo
  que el sistema puede hacer.
- **No pierdas lo que ya escribió.** Perder un formulario lleno por un error es de los picos negativos
  más caros que existen.
- **Un estado vacío es una oportunidad de onboarding**, no un hueco: explica qué va aquí y ofrece la
  acción para llenarlo.
- **Carga extrínseca fuera:** en un mensaje de error, todo lo que no ayuda a resolverlo estorba.

### Alcance del feature (qué construir y qué no)

**Mandan:** Tesler · Occam · Pareto

- **Tesler: la complejidad no se elimina, se traslada.** La pregunta nunca es "¿cómo la elimino?" sino
  **"¿quién la absorbe?"**. La respuesta correcta casi siempre es el sistema (o tú, escribiendo más
  código), no el usuario.
- **Occam: el diseño está listo cuando no puedes quitar nada más sin romper la función.** Quita antes de
  agregar. Empata con `eecheverria-clean-code`.
- **Pareto: el 20 % de las funciones cubre el 80 % del uso.** Ese 20 % debe ser rápido y visible; el
  resto debe ser *posible*, no prominente. Sirve para priorizar el backlog y para decidir defaults.

---

## Conflictos frecuentes (y cómo resolverlos)

Que dos leyes se contradigan no es un error del marco: es la señal de que hay un trade-off real que
tienes que decidir a conciencia. Nómbralo y resuélvelo, no lo escondas.

| Tensión | Cómo se resuelve |
|---|---|
| **Hick (menos opciones) vs. Fluir (todo descubrible)** | Progressive disclosure: pocas opciones visibles, el resto accesible y buscable. Lo que se usa a diario, visible; lo ocasional, a un click. |
| **Occam (quitar) vs. Tesler (complejidad irreducible)** | Quita interfaz, no capacidad. Si al quitar un control el usuario tiene que hacer el trabajo a mano, la moviste, no la eliminaste. |
| **Jakob (patrón conocido) vs. diferenciación de producto** | Convención en lo estructural (navegación, login, formularios); originalidad en lo que te distingue. Romper convención exige un beneficio que puedas nombrar. |
| **Von Restorff (destacar) vs. Estética-Usabilidad (limpio)** | El énfasis es un presupuesto finito: gástalo en una cosa por vista. Si necesitas destacar tres, la jerarquía está mal. |
| **Miller (poco por pantalla) vs. Memoria de Trabajo (no obligar a recordar)** | Menos elementos **simultáneos**, pero más contexto persistente. Fragmenta en pasos y arrastra el estado entre ellos: dividir sin arrastrar contexto empeora las dos cosas. |
| **Doherty (<400 ms) vs. mostrar todo el dato** | Pagina, virtualiza o carga en diferido lo pesado, y entrega primero lo que responde a la pregunta del usuario. |
| **Estética-Usabilidad vs. la verdad** | Un diseño bonito enmascara fallos de usabilidad. Pule, pero valida con uso real; nunca leas "se ve bien" como "funciona bien". |

---

## Racionalizaciones comunes (y la realidad)

| Racionalización | Realidad |
|---|---|
| "Le agrego un tooltip y ya se entiende." | Si necesita explicación, el diseño falló (Prägnanz). Nadie lee (Paradoja del Usuario Activo). |
| "Máximo 7 ítems, lo dice Miller." | Miller no dice eso. Fragmenta y agrupa; no impongas números arbitrarios. |
| "El usuario se va a acostumbrar." | Ley de Jakob: el usuario pasa el 95 % de su tiempo en *otras* apps y no reaprende para ti. |
| "Ponemos todas las opciones para que nadie extrañe nada." | Sobrecarga de opciones: más opciones deterioran la decisión y la percepción del producto. |
| "Se ve increíble, quedó pulidísimo." | Estética-Usabilidad: lo bonito **oculta** problemas de usabilidad. No es evidencia. |
| "Es solo medio segundo de espera." | 500 ms ya cruzó el Umbral de Doherty: ahí es donde el usuario empieza a esperarte. |
| "Que el usuario elija en configuración." | Casi nadie entra a configuración. Un buen default vale más que veinte preferencias (Pareto). |
| "Simplifiqué la pantalla quitando ese paso." | Verifica que no lo hayas movido al usuario (Tesler). Quitar interfaz ≠ quitar trabajo. |

## Red flags

Señales de que hay un problema de UX aunque el código esté impecable:

- [ ] Más de un botón primario compitiendo en la misma vista.
- [ ] Espaciado uniforme sin grupos: todo equidistante, nada relacionado.
- [ ] Una etiqueta visualmente más cerca del campo equivocado.
- [ ] "Eliminar" contiguo a "Guardar", mismo tamaño, mismo peso visual.
- [ ] Un flujo que obliga a memorizar un dato de la pantalla anterior.
- [ ] Un formulario que rechaza entradas que el sistema podría normalizar solo.
- [ ] Una acción sin ningún feedback visible.
- [ ] Un estado que se comunica **solo** por color.
- [ ] Un menú plano con más de ~10 ítems sin agrupar ni buscar.
- [ ] Un patrón conocido reinventado sin razón (checkout, login, buscador).
- [ ] Un error que dice qué falló pero no cómo resolverlo.
- [ ] Un aviso importante con forma y ubicación de banner publicitario.

---

## Verificación (antes de decir "listo")

Recorre la pantalla que diseñaste y responde:

1. **La tarea:** ¿qué viene a hacer aquí el usuario, y está a un vistazo y un click?
2. **Lo primero:** ¿qué ve primero? ¿Coincide con lo que debería ver primero?
3. **Las opciones:** ¿cuántas decisiones simultáneas le pido? ¿Alguna se puede diferir o agrupar?
4. **La agrupación:** ¿la distancia visual coincide con la relación real entre elementos?
5. **Los targets:** ¿lo frecuente es fácil de acertar? ¿lo destructivo es difícil de acertar por error?
6. **El tiempo:** ¿responde en <400 ms? Si no, ¿qué ve mientras espera?
7. **La memoria:** ¿tiene que recordar algo de otra pantalla? Si sí, tráelo.
8. **Sin leer:** ¿se entiende sin instrucciones?
9. **El cierre:** ¿cómo termina el flujo y qué recuerdo deja (pico y final)?
10. **La justificación:** cada decisión no obvia, ¿la puedes nombrar con una ley y un cambio concreto?

Y el filtro de Occam al final: **¿qué puedes quitar sin romper nada?**

---

## Cómo se combina con tus otras skills

Esta skill decide **qué debe pasar en la interfaz y por qué**; otras ponen el cómo:

| Para… | Apóyate en… |
|---|---|
| Implementar la UI en React (componentes, estado, accesibilidad, responsive) | `eecheverria-frontend-react` |
| Construir con el design system Untitled UI React (catálogo, tokens) | `eecheverria-untitled-ui` |
| Medir y arreglar la lentitud real detrás del Umbral de Doherty | `eecheverria-performance` |
| Simplificar el código resultante sin cambiar comportamiento | `eecheverria-clean-code` |
| Afinar el alcance del feature antes de diseñarlo (Tesler/Occam/Pareto en la idea) | `eecheverria-idea-refine` |
| Disciplina de sesión, supuestos, push back y verificación | `eecheverria-senior-dev` |

Al **revisar** una UI ajena, combina esta skill con el criterio de alcance de `eecheverria-senior-dev`:
señala los problemas con su ley y su consecuencia, pero **no rediseñes de más** lo que no se te pidió.

## Referencia completa

Las 30 leyes con enunciado, puntos clave y enlace oficial: [`references/catalogo.md`](references/catalogo.md).
Fuente: [Laws of UX (es)](https://lawsofux.com/es/), de Jon Yablonski.
