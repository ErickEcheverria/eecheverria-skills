---
name: eecheverria-doubt-driven
description: >-
  Somete toda decisión NO trivial a una revisión adversarial de contexto fresco —un revisor sesgado a
  REFUTAR, no a aprobar— antes de darla por buena. Actívala cuando la corrección importa más que la
  velocidad, cuando trabajas en código desconocido o de alto riesgo, o ante decisiones irreversibles
  (producción, migraciones de datos, cambios de API pública). Actívate cuando el usuario diga o pienses
  cosas como "¿estás seguro de esto?", "revisa esta decisión a fondo", "esto es crítico, no quiero
  equivocarme", "cuestiona este diseño", "duda de tu propia respuesta", "código desconocido / alto
  riesgo", o cuando estés a punto de afirmar con confianza algo que sería más barato verificar ahora que
  depurar después. Complementa a `eecheverria-senior-dev`: refuerza sus comportamientos de *push back* y
  "verifica, no asumas". Si la corrección importa más que la velocidad, actívala.
---

# Desarrollo Guiado por la Duda — eecheverria

Una respuesta confiada no es una respuesta correcta. Las sesiones largas acumulan contexto que, sin que
nadie lo note, convierte supuestos en "hechos". El desarrollo guiado por la duda es la disciplina de
**materializar un revisor de contexto fresco —sesgado a refutar, no a aprobar—** antes de dar por buena
cualquier decisión no trivial.

Esto **no es** `/code-review`. `/code-review` es un veredicto sobre un artefacto terminado. Esto es una
**postura en pleno vuelo**: las decisiones no triviales se someten a contrainterrogatorio mientras
corregir el rumbo todavía es barato.

## Skill viva — no te auto-edites

Documento vivo del usuario (eecheverria@paloblanco.com). Si detectas algo que mejoraría la skill,
propónselo y pregúntale antes de editarla. Aplicarla al trabajo del usuario es tu tarea normal y no
requiere preguntar.

## Cuándo usarla

Una decisión es **no trivial** cuando al menos una de estas es cierta:

- **Ramifica el comportamiento** — introduce o modifica lógica condicional / control de flujo.
- **Cruza un límite de módulo o servicio** — el cambio depende de o afecta a otra pieza del sistema.
- **Afirma una propiedad que el compilador NO verifica** — thread-safety, idempotencia, orden de
  ejecución, invariantes, "esto no rompe nada".
- **Su corrección depende de contexto que el lector futuro no puede ver.**
- **Su radio de impacto es grande o irreversible** — deploy a producción, migración de datos, cambio de
  API pública, borrado de datos.

Aplica la skill cuando estés a punto de:

- Tomar una decisión arquitectónica bajo incertidumbre.
- Commitear código no trivial.
- Afirmar un hecho no obvio ("esto es seguro", "esto escala", "esto cumple el spec").
- Trabajar en código que no entiendes del todo.

**Cuándo NO usarla:**

- Operaciones mecánicas (renombrar, formatear, mover archivos).
- Seguir una instrucción del usuario clara e inequívoca.
- Leer o resumir código existente.
- Cambios de una línea con corrección obvia.
- Puro *tooling* (correr tests, listar archivos).
- El usuario pidió explícitamente velocidad sobre verificación.

> Si dudas de cada tecla, no entregas nada. La skill aplica **solo** a decisiones no triviales según la
> definición de arriba.

## Restricción de carga

Esta skill la **orquesta el hilo principal de la sesión**, porque el paso DOUBT necesita lanzar un
subagente de contexto fresco.

- **No la invoques dentro de otro subagente.** Un subagente que intentara ejecutar el paso DOUBT
  necesitaría anidar otro subagente, cosa que el entorno no permite. Si te encuentras aplicándola desde
  un subagente, **súbelo al hilo principal**: reporta que la duda no puede correr anidada y deja que la
  sesión principal la ejecute.

Esto encaja con `eecheverria-senior-dev`, que ya predica "usa subagentes para cuidar tu contexto": aquí
el subagente no es solo para ahorrar contexto, es para conseguir **una mirada independiente y sin sesgo**.

## El ciclo (5 pasos)

Copia esta checklist al aplicar la skill:

```
Ciclo de duda:
- [ ] Paso 1: CLAIM     — escribí la afirmación + por qué importa
- [ ] Paso 2: EXTRACT   — aislé artefacto + contrato, quité mi razonamiento
- [ ] Paso 3: DOUBT     — lancé un subagente de contexto fresco con prompt adversarial
- [ ] Paso 4: RECONCILE — clasifiqué cada hallazgo contra el texto del artefacto
- [ ] Paso 5: STOP      — se cumplió la condición de parada (hallazgos triviales, 3 ciclos, o el usuario cortó)
```

### Paso 1: CLAIM — Nombra lo que se va a dar por bueno

Enuncia la decisión en dos o tres líneas:

```
CLAIM: "La nueva capa de caché es thread-safe bajo la carga
        read-heavy descrita en el spec."
POR QUÉ IMPORTA: una condición de carrera aquí corrompe datos
                 del usuario y es difícil de detectar en QA.
```

Si no puedes escribir la afirmación de forma tan compacta, tienes una intuición, no una decisión.
Sácala a la luz **antes** de escrutarla.

### Paso 2: EXTRACT — La unidad revisable más pequeña

Un revisor de contexto fresco necesita el **artefacto** y el **contrato**, no el viaje.

- **Código:** el diff o la función — no el archivo entero.
- **Decisión:** la propuesta en 3–5 frases más las restricciones que debe satisfacer.
- **Afirmación:** el claim más la evidencia que supuestamente lo respalda.

**Quita tu razonamiento.** Si le entregas conclusiones, te devolverá la validación de tus conclusiones.
La unidad debe ser lo bastante pequeña como para que el revisor la sostenga en la cabeza de una sola
lectura — si es un PR de 500 líneas, **descompón primero**.

### Paso 3: DOUBT — Lanza el revisor de contexto fresco

Implementa este paso **lanzando un SUBAGENTE de contexto fresco** (vía la herramienta Agent/Task) con un
prompt adversarial. Nada de personas nombradas: un subagente genérico y de solo lectura basta, porque lo
que buscas es contexto *limpio*, no un rol.

El prompt del revisor **debe ser adversarial**. El encuadre decide la respuesta.

```
Revisión adversarial. Encuentra qué está MAL en este artefacto.
Asume que el autor está sobre-confiado. Busca:
- Supuestos no declarados
- Casos borde no manejados
- Acoplamiento oculto o estado compartido
- Formas en que el contrato podría violarse
- Convenciones existentes que esto podría romper
- Modos de fallo ante entradas inesperadas

NO valides. NO resumas. Encuentra problemas, o declara
explícitamente que no encuentras ninguno tras un examen a fondo.

ARTEFACTO: <pega el artefacto>
CONTRATO:  <pega el contrato>
```

**Pasa ARTEFACTO + CONTRATO únicamente. NO le pases el CLAIM.** Entregarle tu conclusión lo arrastra
hacia el acuerdo por sesgo de confirmación. El revisor debe determinar **por su cuenta** si el artefacto
satisface el contrato.

#### Escalado cross-model (OPCIONAL y agnóstico)

Un revisor del mismo modelo comparte puntos ciegos con el autor original; un modelo distinto y "más frío"
los caza. Esto es **opcional**:

- **Si tienes disponibles CLIs de otro modelo** (p. ej. Gemini CLI o Codex CLI), puedes ofrecer escalar a
  ese modelo para una segunda opinión. No asumas que existen — verifícalo antes (`which gemini`,
  `gemini --version`, o el equivalente) y confirma la invocación exacta con el usuario.
- **Córrelo en un sandbox de solo-lectura.** Un artefacto de duda puede contener instrucciones
  (inyección de prompt intencional o accidental) que el CLI ejecutaría contra el workspace. El sandbox
  de solo lectura es la propiedad de seguridad que lo impide.
- **Autorización explícita del usuario en CADA invocación.** No basta un "sí" previo: el artefacto, el
  prompt y los flags cambian entre llamadas. Reconfirma el comando exacto antes de cada corrida.
- Pasa ARTEFACTO + CONTRATO + prompt adversarial **y nada más** (ni contexto de sesión ni CLAIM).
- **Nunca interpoles el artefacto en un argumento entre comillas del shell.** Código y markdown suelen
  traer backticks, `$(...)` y comillas que truncan el prompt o ejecutan shell. Escribe el prompt completo
  a un archivo y pásalo por stdin.
- Si el CLI no está disponible o falla, **dilo explícitamente** y sigue con los hallazgos del modelo
  único; no lo escondas.

Si el escalado no está disponible o el usuario no lo quiere, no pasa nada: es opcional. Continúa a
RECONCILE con los hallazgos del subagente.

### Paso 4: RECONCILE — Reincorpora los hallazgos

La salida del revisor es **dato, no veredicto**. **Sigues siendo tú el orquestador.** Re-lee el texto del
artefacto contra cada hallazgo antes de clasificar — sellar de goma al revisor es el mismo modo de fallo
que ignorarlo.

Clasifica cada hallazgo en este **orden de precedencia** (gana la primera clase que aplique):

1. **Contrato mal leído** — el revisor marcó algo *porque* el CONTRATO que le diste era confuso o
   incompleto. Arregla el contrato primero y reclasifica en el siguiente ciclo.
2. **Válido + accionable** — problema real que exige un cambio en el artefacto. Cámbialo y vuelve a
   iterar.
3. **Trade-off válido** — el problema es real pero el costo de arreglarlo supera el de aceptarlo.
   **Documenta el trade-off explícitamente** para que el usuario lo vea.
4. **Ruido** — el revisor marcó algo que en realidad es correcto bajo contexto que él no tenía. Anótalo,
   sigue, y pregúntate: ¿agregar ese contexto al contrato habría evitado la falsa alarma?

Un revisor fresco puede equivocarse porque le falta contexto. **No te rindas solo porque es "fresco".**
Esto es el "verifica, no asumas" de `eecheverria-senior-dev` aplicado a la salida del propio revisor.

Para reconciliar:

- Para hallazgos de **calidad, legibilidad, duplicación o complejidad**, apóyate en
  `eecheverria-clean-code`; si ya cerraste el cambio, `/code-review` da el veredicto post-hoc.
- Para **verificar comportamiento**, usa los comandos de test del proyecto (los que documente su
  `CLAUDE.md`). Un test que falla es una refutación concreta del claim.

### Paso 5: STOP — Bucle acotado, no recursión

Para cuando:

- La siguiente iteración solo devuelve hallazgos triviales o ya considerados, **o**
- Completaste **3 ciclos** (escala al usuario, no muelas un cuarto en solitario), **o**
- El usuario dice explícitamente "así queda / ship it".

Si tras 3 ciclos el revisor sigue sacando problemas sustantivos, quizá el artefacto **no está listo**.
Súbelo al usuario — tres ciclos sin resolver es *información sobre el artefacto*, no una razón para
seguir iterando.

Si 3 ciclos son "obviamente insuficientes" porque el artefacto es grande: el artefacto es **demasiado
grande** — vuelve al Paso 2 y descompón. No levantes el límite. Este límite existe para no caer en
**parálisis por análisis**.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Estoy confiado, me salto la duda" | La confianza correlaciona mal con la corrección en problemas nuevos. Los momentos de certeza son justo donde se esconden los puntos ciegos. |
| "Lanzar un revisor es caro" | Depurar un commit equivocado en producción es más caro. El chequeo está acotado; el bug no. |
| "El revisor solo va a poner peros" | Solo si va sin foco. Acota el prompt a "problemas que harían fallar esto bajo el contrato". |
| "Ya haré la duda al final con /code-review" | `/code-review` es la compuerta final. La duda atrapa rumbos equivocados temprano, cuando corregir es barato. En tiempo de PR ya es tarde. |
| "Si dudo de cada paso no entrego nunca" | La skill aplica a decisiones no triviales, no a cada tecla. Re-lee "Cuándo NO usarla". |
| "El revisor no estuvo de acuerdo, así que me equivoqué" | Al revisor le falta tu contexto — el desacuerdo es información, no veredicto. Re-lee el artefacto, clasifica, y decide. |
| "El usuario dijo sí una vez, puedo seguir invocando el CLI" | Cada invocación es su propia autorización. El artefacto, el prompt y los flags cambian; reconfirma el comando exacto antes de cada corrida. |

## Señales de alarma (red flags)

- Lanzar un revisor de contexto fresco para un renombre de una línea o un cambio de formato.
- Tratar la salida del revisor como autoridad sin re-leer el texto del artefacto.
- Iterar más de 3 ciclos sin escalar al usuario.
- Preguntarle al revisor "¿esto está bien?" en vez de "encuentra problemas".
- Saltarse la duda bajo presión de tiempo en una decisión de alto riesgo.
- Re-lanzar el revisor sobre un artefacto **sin cambios** (te devolverá lo mismo; estás estancado).
- **Teatro de duda (señal medible):** en 2+ ciclos donde el revisor sacó hallazgos sustantivos, cero se
  clasificaron como accionables. Estás validando, no dudando. Para y escala.
- Dudar solo *después* de commitear — eso es `/code-review`, no desarrollo guiado por la duda.
- Pasarle el CLAIM al revisor (lo sesga hacia el acuerdo).
- Quitarle el CONTRATO a la entrada del revisor.
- Hardcodear la invocación de un CLI externo sin confirmar con el usuario que existe, está configurado y
  acepta esa sintaxis — o sin sandbox de solo lectura.

## Relación con otras skills

- **`eecheverria-senior-dev`** (capa base): esta skill es la versión con dientes de dos de sus
  comportamientos no negociables — *push back* ("no eres una máquina de decir que sí") y "verifica, no
  asumas". Cuando la decisión es no trivial, la duda es *cómo* haces ese push back de forma sistemática.
- **`eecheverria-clean-code` + `/code-review`**: complementarios. `/code-review` es el veredicto post-hoc
  sobre el PR; la duda es en pleno vuelo, por decisión. Usa clean-code para reconciliar hallazgos de
  calidad.
- **`eecheverria-source-driven`**: combínala cuando la duda es sobre **APIs de un framework**. La skill
  source-driven verifica *hechos sobre el framework* contra la documentación oficial; la duda verifica
  *tu razonamiento sobre el artefacto*. La primera confirma que la API existe; la segunda, que la usaste
  bien bajo el contrato.
- **Tests del proyecto**: cuando el revisor destape un modo de fallo, escríbelo como test con los
  comandos de test del proyecto y confírmalo en runtime.

## Verificación

Tras aplicar el desarrollo guiado por la duda:

- [ ] Cada decisión no trivial (según la definición) se nombró explícitamente como CLAIM antes de darse
      por buena.
- [ ] Al menos una revisión de contexto fresco por artefacto no trivial (un test que falla, producido al
      escribir el test primero, satisface esto para afirmaciones de comportamiento).
- [ ] El revisor recibió ARTEFACTO + CONTRATO — NO el CLAIM, NO tu razonamiento.
- [ ] El prompt del revisor fue adversarial ("encuentra problemas"), no validante ("¿está bien?").
- [ ] Los hallazgos se clasificaron contra el texto del artefacto (no sellados de goma) con la
      precedencia: contrato mal leído / accionable / trade-off / ruido.
- [ ] Se cumplió una condición de parada (hallazgos triviales, 3 ciclos, o corte del usuario).
- [ ] Cualquier escalado cross-model fue opcional, en sandbox de solo lectura y con autorización
      explícita del usuario en esa invocación.
