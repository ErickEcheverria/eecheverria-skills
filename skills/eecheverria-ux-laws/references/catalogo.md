# Catálogo de leyes de UX

Las 30 leyes y principios de [Laws of UX](https://lawsofux.com/es/) (versión en español), agrupadas por
el tipo de decisión de interfaz en la que pesan.

El `SKILL.md` te dice **qué ley aplicar según lo que estés diseñando**; este archivo es el detalle:
enunciado, puntos clave y enlace a la fuente. Consúltalo cuando necesites el matiz de una ley concreta —
no lo leas de corrido.

## Índice

| Grupo | Leyes |
|---|---|
| [1. Decisión y acción](#1-decisión-y-acción) | Hick, Fitts, Postel, Parkinson, Sobrecarga de Opciones, Paradoja del Usuario Activo |
| [2. Organización visual (Gestalt)](#2-organización-visual-gestalt) | Proximidad, Semejanza, Región Común, Conectividad Uniforme, Prägnanz, Fragmentación |
| [3. Memoria y carga cognitiva](#3-memoria-y-carga-cognitiva) | Miller, Memoria de Trabajo, Carga Cognitiva, Posición en Serie, Modelo Mental, Jakob |
| [4. Tiempo, espera y motivación](#4-tiempo-espera-y-motivación) | Umbral de Doherty, Fluir, Fin de Pico, Zeigarnik, Tendencia a la Meta |
| [5. Atención y percepción](#5-atención-y-percepción) | Atención Selectiva, Von Restorff, Estética-Usabilidad, Sesgo Cognitivo |
| [6. Complejidad y alcance](#6-complejidad-y-alcance) | Tesler, Navaja de Occam, Pareto |

---

## 1. Decisión y acción

### Ley de Hick

**Fuente:** https://lawsofux.com/es/ley-de-hick/
**Enunciado:** El tiempo que lleva tomar una decisión aumenta con el número y la complejidad de las opciones.

- Reduce las opciones cuando la velocidad de decisión es crítica.
- Divide tareas complejas en pasos más manejables.
- Destaca las opciones recomendadas para guiar la decisión.
- Introduce funciones de forma progresiva para usuarios nuevos (onboarding gradual).
- No simplifiques de más: la abstracción excesiva confunde.

### Ley de Fitts

**Fuente:** https://lawsofux.com/es/ley-de-fitts/
**Enunciado:** El tiempo para adquirir un objetivo está en función de la distancia y el tamaño del objetivo.

- Los objetivos táctiles deben ser lo bastante grandes para seleccionarse con precisión.
- Deja espacio suficiente entre objetivos para evitar toques accidentales.
- Coloca los controles en zonas fáciles de alcanzar, cerca de la tarea que ejecutan.

### Ley de Postel (principio de robustez)

**Fuente:** https://lawsofux.com/es/ley-de-postel/
**Enunciado:** Sé liberal en lo que aceptas y conservador en lo que envías.

- Acepta con tolerancia y empatía entradas variadas del usuario.
- Sé riguroso con las especificaciones en lo que el sistema emite.
- Anticipa múltiples formas de interacción para ganar resiliencia.
- Traduce entradas variables, define límites claros y da retroalimentación útil.
- Cuanta más diversidad de comportamiento preveas en diseño, más confiable será el producto.

### Ley de Parkinson

**Fuente:** https://lawsofux.com/es/ley-de-parkinson/
**Enunciado:** Cualquier tarea se agrandará hasta que se gaste todo el tiempo disponible.

- Limita el tiempo asignado a cada actividad en lugar de dejarlo abierto.
- Completar la tarea en menos tiempo del esperado mejora la satisfacción del usuario.
- Usa autocompletado y sugerencias para acelerar formularios, compras y reservas.

### Sobrecarga de Opciones

**Fuente:** https://lawsofux.com/es/sobrecarga-de-opciones/
**Enunciado:** Tendencia de las personas a sentirse abrumadas cuando se les presenta una gran cantidad de opciones.

- Demasiadas opciones deterioran la toma de decisiones y la percepción de la experiencia.
- Prioriza el contenido para reducir la carga de decisión.
- Ofrece búsqueda y filtrado cuando el conjunto de opciones es grande.
- Si hay que comparar, presenta los elementos relacionados lado a lado.

### Paradoja del Usuario Activo

**Fuente:** https://lawsofux.com/es/paradoja-del-usuario-activo/
**Enunciado:** Los usuarios nunca leen los manuales, pero empiezan a usar el software de inmediato.

- Los usuarios priorizan completar la tarea inmediata sobre leer documentación.
- La paradoja: aprender el sistema optimizaría su uso a largo plazo, pero no lo hacen.
- Integra ayuda contextual (tooltips, guías en línea) dentro de la experiencia del producto.
- No diseñes asumiendo que el usuario consultará manuales.

---

## 2. Organización visual (Gestalt)

### Ley de Proximidad

**Fuente:** https://lawsofux.com/es/ley-de-proximidad/
**Enunciado:** Los objetos que están cerca, o próximos entre sí, tienden a agruparse.

- La cercanía espacial establece una relación visual entre objetos.
- Los elementos muy juntos se interpretan como si compartieran funciones o atributos.
- Ayuda al usuario a organizar y comprender la información más rápido.
- Deriva de la psicología Gestalt y su tendencia innata al reconocimiento de patrones.

### Ley de la Semejanza

**Fuente:** https://lawsofux.com/es/ley-de-la-semejanza/
**Enunciado:** El ojo humano tiende a percibir elementos similares como un grupo o forma completa, aunque estén separados.

- Los elementos con características visuales compartidas se perciben como relacionados.
- Color, forma, tamaño, orientación y movimiento son las señales de pertenencia a un grupo.
- Enlaces y navegación deben distinguirse visualmente del texto normal.
- Es una de las leyes de agrupación Gestalt.

### Ley de Región Común

**Fuente:** https://lawsofux.com/es/ley-de-región-común/
**Enunciado:** Los elementos tienden a percibirse en grupos si comparten un área con un límite claramente definido.

- Crea jerarquía y clarifica las relaciones entre secciones de la interfaz.
- Se aplica añadiendo bordes alrededor de un conjunto de elementos.
- También se aplica definiendo un fondo diferenciado detrás del grupo.
- Pertenece a los principios Gestalt de agrupación (proximidad, similitud, continuidad, cierre, conectividad).

### Ley de Conectividad Uniforme

**Fuente:** https://lawsofux.com/es/ley-de-conectividad-uniforme/
**Enunciado:** Los elementos conectados visualmente se perciben más relacionados que los elementos sin conexión.

- Agrupa funciones similares con colores, líneas o marcos compartidos.
- Usa conectores explícitos (líneas, flechas) como referencias tangibles entre componentes.
- Sirve para comunicar contexto y resaltar similitudes entre elementos.
- Forma parte de las leyes de agrupación Gestalt.

### Ley de Prägnanz

**Fuente:** https://lawsofux.com/es/ley-de-prägnanz/
**Enunciado:** Las personas perciben e interpretan las imágenes ambiguas o complejas de la forma más simple posible, porque exige menor esfuerzo cognitivo.

- El cerebro busca orden y simplicidad para evitar la sobrecarga informativa.
- Las figuras simples se procesan y recuerdan mejor que las complejas.
- El sistema visual unifica automáticamente formas intrincadas en una representación coherente.
- Origen: observación de Max Wertheimer (1910), base de la Gestalt.

### Fragmentación (chunking)

**Fuente:** https://lawsofux.com/es/fragmentación/
**Enunciado:** Proceso por el cual las piezas individuales de información se descomponen y se agrupan en un todo significativo.

- Fragmentar facilita el escaneo y acelera el procesamiento de la información relevante.
- Agrupa el contenido en módulos visualmente diferenciados con jerarquía clara.
- Usa separadores y jerarquía para que se entiendan las relaciones entre elementos.
- Alinea la estructura del contenido con la forma en que las personas evalúan contenido digital.

---

## 3. Memoria y carga cognitiva

### Ley de Miller

**Fuente:** https://lawsofux.com/es/ley-de-miller/
**Enunciado:** La persona promedio solo puede mantener 7 (±2) elementos en su memoria de trabajo.

- No uses el "número mágico" para justificar restricciones de diseño arbitrarias.
- Fragmenta (chunking) el contenido en unidades más pequeñas y significativas.
- La capacidad de memoria a corto plazo varía según la persona, su conocimiento previo y el contexto.
- El estudio original medía capacidad de canal de información, no límites de diseño.

### La memoria de Trabajo

**Fuente:** https://lawsofux.com/es/la-memoria-de-trabajo/
**Enunciado:** Sistema cognitivo que retiene y manipula temporalmente la información necesaria para completar una tarea.

- Capacidad limitada: 4–7 fragmentos, que se desvanecen en 20–30 segundos.
- Muestra solo información pertinente y necesaria en cada momento.
- Favorece el reconocimiento sobre el recuerdo (enlaces visitados, migas de pan).
- Pon la carga de memoria en el sistema, no en el usuario: arrastra el contexto entre pantallas.
- Usa tablas comparativas para no obligar a memorizar datos.

### Carga Cognitiva

**Fuente:** https://lawsofux.com/es/carga-cognitiva/
**Enunciado:** Cantidad de recursos mentales necesarios para entender e interactuar con una interfaz.

- Si la información supera la capacidad de procesamiento, hay sobrecarga y peor retención.
- Carga intrínseca: esfuerzo para procesar lo relevante al objetivo y aprender lo nuevo.
- Carga extrínseca: procesamiento que no aporta comprensión (adornos, distractores).
- Reduce la carga extrínseca eliminando elementos de diseño innecesarios.
- Formulada por John Sweller (años 80) sobre la teoría de Miller.

### Efecto de Posición en Serie

**Fuente:** https://lawsofux.com/es/efecto-de-posición-en-serie/
**Enunciado:** Los usuarios recuerdan mejor el primer y el último elemento de una serie, y peor los del medio.

- Coloca los elementos menos importantes en medio de las listas.
- Ubica las acciones clave al inicio y al final de menús y navegación.
- Combina dos efectos: primacía (primeros ítems) y recencia (últimos ítems).
- La posición dentro de la secuencia condiciona cómo se codifica y recupera la información.

### Modelo Mental

**Fuente:** https://lawsofux.com/es/modelo-mental/
**Enunciado:** Modelo comprimido basado en lo que creemos saber sobre un sistema y cómo funciona.

- Las personas transfieren modelos mentales previos a productos y situaciones nuevas.
- El diseño funciona cuando se alinea con el modelo mental del usuario.
- Patrones consistentes (carrito, checkout) coinciden con expectativas existentes.
- Cerrar la brecha entre tu modelo y el del usuario exige investigación: entrevistas, personas, mapas de empatía.
- Propuesto por Kenneth Craik (1943): un "modelo a pequeña escala" del mundo para anticipar y razonar.

### Ley de Jakob

**Fuente:** https://lawsofux.com/es/ley-de-jakob/
**Enunciado:** Los usuarios pasan la mayor parte del tiempo en otros sitios, por lo que prefieren que el tuyo funcione igual que los que ya conocen.

- Los usuarios transfieren a tu producto los modelos mentales de productos familiares.
- Aprovechar patrones conocidos reduce la carga cognitiva y deja al usuario enfocarse en su objetivo.
- Al rediseñar, permite temporalmente el acceso a la versión anterior para suavizar la transición.

---

## 4. Tiempo, espera y motivación

### Umbral de Doherty

**Fuente:** https://lawsofux.com/es/umbral-de-doherty/
**Enunciado:** La productividad se dispara cuando la computadora y el usuario interactúan a un ritmo (menos de 400 ms) en que ninguno espera al otro.

- Responde en menos de 400 ms para mantener el engagement.
- El rendimiento percibido pesa tanto como el real.
- Animaciones y barras de progreso ocupan la atención y hacen tolerable la espera.
- Retrasos deliberados y pequeños pueden aumentar la confianza en el sistema.
- Basado en Doherty y Thadani (1982), que bajaron el estándar de 2 s a 400 ms.

### Fluir (flow)

**Fuente:** https://lawsofux.com/es/fluir/
**Enunciado:** Estado mental en el que una persona está completamente inmersa en la actividad, con enfoque energizado, plena implicación y disfrute del proceso.

- El flujo surge cuando la dificultad de la tarea se equilibra con las capacidades del usuario.
- Tareas demasiado difíciles frustran; demasiado fáciles aburren: alinea desafío y competencia.
- Da retroalimentación clara sobre acciones realizadas y logros alcanzados.
- Elimina fricción innecesaria y maximiza la velocidad de respuesta del sistema.
- Haz descubribles contenidos y funciones para evitar la desconexión con la interfaz.

### Regla de Fin de Pico

**Fuente:** https://lawsofux.com/es/regla-de-fin-de-pico/
**Enunciado:** Las personas juzgan una experiencia por cómo se sintieron en su punto álgido y al final, no por el promedio de todos los momentos.

- Enfatiza los momentos de mayor intensidad y los cierres del recorrido del usuario.
- Identifica cuándo el producto entrega más valor o utilidad y potencia esa satisfacción.
- Recuerda que los momentos negativos se recuerdan con más nitidez que los positivos.

### Efecto Zeigarnik

**Fuente:** https://lawsofux.com/es/efecto-zeigarnik/
**Enunciado:** Las personas recuerdan mejor las tareas incompletas o interrumpidas que las completadas.

- Da señales visuales de que hay contenido adicional por descubrir.
- Muestra avance hacia una meta para sostener la motivación.
- Un indicador de progreso claro empuja a terminar lo iniciado.
- Crear progreso "artificial" (ya iniciado) aumenta la tasa de finalización.

### Efecto de Tendencia a la Meta

**Fuente:** https://lawsofux.com/es/efecto-de-tendencia-a-la-meta/
**Enunciado:** La tendencia a acercarse a una meta aumenta conforme se está más cerca de ella.

- Cuanto más cerca del final, más rápido trabajan los usuarios para completar la tarea.
- Muestra indicación clara del progreso para motivar la finalización.
- Otorgar progreso artificial inicial aumenta la probabilidad de que completen la tarea.

---

## 5. Atención y percepción

### Atención Selectiva

**Fuente:** https://lawsofux.com/es/atención-selectiva/
**Enunciado:** Proceso de centrar la atención solo en un subconjunto de los estímulos del entorno, normalmente los relacionados con nuestros objetivos.

- Los usuarios descartan estímulos irrelevantes; guía la atención a lo pertinente.
- Ceguera de banner: se ignora lo que parece publicidad o está en zonas de anuncios.
- No diseñes contenido que imite anuncios ni lo mezcles con ellos.
- Ceguera al cambio: cambios importantes pasan desapercibidos; evita cambios simultáneos que dividan la atención.

### Efecto Von Restorff (aislamiento)

**Fuente:** https://lawsofux.com/es/efecto-von-restorff/
**Enunciado:** Cuando hay varios objetos similares, se recuerda mejor el que difiere del resto.

- Haz visualmente distintivas la información y las acciones importantes.
- No abuses del énfasis: los elementos compiten entre sí o parecen anuncios.
- No dependas solo del color para el contraste (usuarios con deficiencia visual).
- Usa animación con cuidado por usuarios sensibles al movimiento.

### Efecto de Estética-Usabilidad

**Fuente:** https://lawsofux.com/es/efecto-de-estética-usabilidad/
**Enunciado:** Los usuarios suelen percibir un diseño estéticamente agradable como un diseño más útil.

- Lo visualmente atractivo genera una respuesta positiva y aparenta funcionar mejor de lo que funciona.
- Los usuarios toleran mejor los problemas menores de usabilidad en interfaces bonitas.
- La estética puede enmascarar problemas de usabilidad e impedir detectarlos en pruebas.
- Kurosu y Kashimura (1995): la estética correlaciona más con la usabilidad percibida que con la real.

### Sesgo Cognitivo

**Fuente:** https://lawsofux.com/es/sesgo-cognitivo/
**Enunciado:** Error sistemático del pensamiento que distorsiona cómo percibimos el mundo e influye en nuestras decisiones.

- Los atajos mentales ahorran energía pero influyen en las decisiones sin que lo notemos.
- Conocer los sesgos propios protege de razonamientos falaces y errores costosos.
- Sesgo de confirmación: se busca y recuerda lo que valida creencias previas.
- Formalizado por Tversky y Kahneman (1972): las heurísticas útiles introducen errores sistemáticos.

---

## 6. Complejidad y alcance

### Ley de Tesler (conservación de la complejidad)

**Fuente:** https://lawsofux.com/es/ley-de-tesler/
**Enunciado:** Para cualquier sistema existe una cierta cantidad de complejidad que no se puede reducir.

- Todo proceso tiene un núcleo de complejidad irreducible que alguien debe absorber.
- El sistema debe cargar con esa complejidad en vez de trasladarla al usuario.
- Cuidado con simplificar la interfaz hasta la abstracción y perder funcionalidad.
- Vale la pena que ingeniería invierta tiempo en reducirla: se amortiza entre millones de usuarios.
- Al simplificar una herramienta, los usuarios emprenden tareas más complejas y redistribuyen la complejidad.

### La Navaja de Occam

**Fuente:** https://lawsofux.com/es/la-navaja-de-occam/
**Enunciado:** Entre hipótesis que predicen igual de bien, debe elegirse la que tenga menos suposiciones.

- Es mejor evitar la complejidad desde el inicio que reducirla después.
- Analiza cada elemento y elimina todos los que puedas sin dañar la función esencial.
- El diseño está terminado cuando ya no se puede quitar nada sin comprometer la funcionalidad.
- Atribuido a Guillermo de Ockham (1287-1347).

### Principio de Pareto

**Fuente:** https://lawsofux.com/es/principio-de-pareto/
**Enunciado:** Aproximadamente el 80 % de los efectos provienen del 20 % de las causas.

- Entradas y salidas rara vez se distribuyen de forma uniforme.
- En un grupo grande, pocos elementos producen la mayoría de los resultados.
- Conviene concentrar el esfuerzo en las áreas de máximo beneficio para la mayoría de usuarios.
- Origen: observaciones de Vilfredo Pareto sobre la propiedad de tierras en Italia.

---

## Nota sobre las URLs

Los slugs del sitio están URL-encoded cuando llevan acentos (p. ej. `/es/atención-selectiva/` se sirve
como `/es/atenci%C3%B3n-selectiva/`). Ambas formas funcionan al abrirlas o al traerlas con WebFetch.
