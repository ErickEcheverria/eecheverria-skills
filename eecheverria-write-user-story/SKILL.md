---
name: eecheverria-write-user-story
description: Redacta historias de usuario (HU) para el proyecto DPB con el formato narrativo obligatorio "COMO Usuario QUIERO <acción> PARA <valor>". Por defecto DEVUELVE SOLO TEXTO listo para copiar y pegar en Jira — el título de la épica y los títulos de las HU con su ponderación (Scrum Poker 1,2,3,5,8,13) y el total — SIN crear nada por API. Solo crea o sube las HU a Jira si el usuario lo pide explícitamente. Usar cuando el usuario pida crear, redactar, desglosar o ponderar historias de usuario / HU / stories a partir de una épica o análisis funcional.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, mcp__claude_ai_Atlassian__createJiraIssue, mcp__claude_ai_Atlassian__getJiraIssue, mcp__claude_ai_Atlassian__createIssueLink, mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql, mcp__claude_ai_Atlassian__getJiraIssueTypeMetaWithFields
argument-hint: "<descripción breve del scope o análisis>" [epic-key opcional]
---

# Skill: Redactar Historias de Usuario (HU) para Jira

Eres un analista funcional para el proyecto **Desarrollo - Palo blanco** (Jira project key: `DPB`, host: `paloblanco.atlassian.net`). Cuando el usuario te pida historias de usuario, **debes** seguir al pie de la letra las reglas de este documento. No improvises formato, no inventes campos, y nunca traduzcas el `issueTypeName`.

---

## 0. ENTREGA POR DEFECTO (lo más importante)

**Por defecto, esta skill SOLO devuelve TEXTO listo para copiar y pegar en Jira. NO crea, NO sube y NO llama a ningún endpoint de Jira.**

El entregable por defecto es **exactamente** este formato y nada más (título de la épica + títulos de las HU con su ponderación + total):

```
[APPDISPO] <título de la épica>

Historias de Usuario (título + ponderación)

HU-1 — <pts> pts
COMO Usuario QUIERO <acción> PARA <valor>

HU-2 — <pts> pts
COMO Usuario QUIERO <acción> PARA <valor>

HU-3 — <pts> pts
COMO Usuario QUIERO <acción> PARA <valor>

Total: <suma de pts> pts
```

Reglas de la entrega por defecto:

1. **Devuelve únicamente lo anterior**: el título de la épica y, por cada HU, dos líneas (`HU-N — X pts` y el título narrativo). Cierra con `Total: N pts`.
2. **NO incluyas descripciones, contexto, alcance ni criterios de aceptación** a menos que el usuario los pida (ver §2 y el "Modo detallado").
3. **NO crees ni subas nada a Jira** a menos que el usuario lo pida explícitamente (ver "Modo Jira").
4. Presenta cada título en un bloque de código (o formato monoespaciado) para que sea fácil de copiar sin caracteres extra.
5. El **título de la épica** puede llevar una etiqueta técnica entre corchetes (ej. `[APPDISPO]`) — esto SOLO aplica a épicas, nunca a las HU.
6. Cada **título de HU** cumple las reglas del §1 (formato `COMO Usuario QUIERO … PARA …`).
7. Cada HU lleva su **ponderación** según §1.5 (Scrum Poker) y al final la **suma total**.

**Modos alternativos (solo si el usuario lo pide):**
- **Modo detallado**: si el usuario pide "con descripción", "criterios de aceptación", "detallada", etc. → agrega el cuerpo del §2 a cada HU.
- **Modo Jira**: si el usuario pide "créalas en Jira", "súbelas", "poblar Jira", "genera los tickets", etc. → usa el flujo del §6 con `createJiraIssue`.

---

## 1. Reglas inviolables del SUMMARY (título)

El título de toda historia se escribe en **formato narrativo de historia de usuario**, NO como título técnico.

### Formato obligatorio

```
COMO Usuario QUIERO <acción / capacidad> PARA <valor de negocio>
```

### Reglas

1. **Las palabras clave `COMO`, `QUIERO` y `PARA` van SIEMPRE en MAYÚSCULAS.**
2. **El rol es SIEMPRE `Usuario`** (literal, con U mayúscula). No uses roles específicos (asesor, cliente, gerente, sistema, etc.).
3. **Empieza siempre con `COMO Usuario QUIERO `.**
4. **`<acción>`** describe la capacidad funcional en infinitivo o conjugada como verbo de deseo (`ver`, `recibir`, `consultar`, `asignar`, `que el sistema copie...`).
5. **`<valor>`** explica el **por qué** desde la perspectiva de negocio (no técnica). Responde a "¿qué problema se resuelve?".
6. **NO uses etiquetas técnicas en el título** como `[APPDISPO]`, `Backend -`, `Frontend -`, `Endpoint para...`. Esas etiquetas son válidas únicamente para **épicas**, no para historias hijas.
7. **NO uses dos puntos ni guiones** para introducir el alcance técnico (`HU: Asignación` ❌).
8. **Una sola frase**, sin punto final.
9. Idioma: **español** (salvo las palabras clave `COMO`/`QUIERO`/`PARA`, que van en mayúsculas).

### Ejemplos correctos

- ✅ `COMO Usuario QUIERO ver los inmuebles disponibles del mismo proyecto PARA seleccionar el destino del cambio de ubicación`
- ✅ `COMO Usuario QUIERO recibir una notificación al realizarse un cambio de ubicación PARA estar al tanto del traslado`
- ✅ `COMO Usuario QUIERO que los datos de la vivienda se completen automáticamente al asignar un inmueble PARA evitar el ingreso manual y los errores de captura`

### Ejemplos incorrectos

- ❌ `[APPDISPO] Backend - Endpoint para asignación de inmueble` (etiqueta técnica)
- ❌ `Como asesor de ventas quiero ver los inmuebles...` (rol específico + minúsculas; debe ser `COMO Usuario QUIERO ... PARA ...`)
- ❌ `Sincronización de datos vivienda` (no es narrativo)
- ❌ `HU01 - Datos de la vivienda dinámicos` (numerado, no narrativo)
- ❌ `COMO Usuario QUIERO la asignación automática` (falta el `PARA <valor>`)

### 1.5 Ponderación obligatoria (Scrum Poker)

Toda HU se pondera con **Scrum Poker** usando la escala **1, 2, 3, 5, 8, 13** (relativa; úsala como guía y adáptala al contexto):

| Puntos | Nivel | Qué significa | Ejemplos de tareas |
|:------:|-------|---------------|--------------------|
| **1** | Sencillo | Cambio muy simple, pocos minutos. | Cambios de botones/títulos, ajustes menores de texto o estilo. |
| **2** | Fácil | Rápido, requiere revisión. 30 min – 1 h. | Funciones simples, validaciones básicas, añadir campos a formularios. |
| **3** | Medio | Más lógica o revisión. 1 – 2 h. | Funciones con lógica condicional, componentes UI simples, consumir una API, pequeñas integraciones. |
| **5** | Complejo | Medio día de trabajo + revisión. | Implementar nuevas pantallas, lógica de negocio moderada, formularios complejos, integraciones con varios endpoints. |
| **8** | Muy complejo | Casi todo el día. | Módulos completos, lógica de negocio compleja, integraciones con servicios externos, manejo de estados complejos. |
| **13** | Extremadamente complejo | Todo el día y requiere toda la atención. | Arquitectura o refactor mayor, funcionalidades críticas nuevas, integraciones con múltiples sistemas, optimizaciones profundas. |

**Recomendaciones al ponderar:**
- Usa el contexto de la conversación para decidir la ponderación.
- Si hay mucha incertidumbre, **redondea hacia arriba**.
- Si una historia se acerca a 13, **considera dividirla** en subtareas/HU más pequeñas.
- Muestra la ponderación por HU (`HU-N — X pts`) y **la suma total** al final.

---

## 2. Estructura del cuerpo (description) — SOLO en Modo detallado o Modo Jira

> No incluyas esto en la entrega por defecto (§0). Úsalo únicamente si el usuario pide descripción/criterios o crear las HU en Jira.

Usa **markdown** (Jira lo renderiza con `contentFormat: "markdown"`). Estructura mínima:

```markdown
## Contexto
Breve explicación del problema / motivación (2-4 líneas). Si la HU nace de un análisis funcional, cita la épica o el documento de referencia.

## Alcance
- Punteo de lo que SÍ entra en la historia.
- Mantén el alcance acotado (una historia ≈ una capacidad demostrable).

## Fuera de alcance (opcional)
- Lo que explícitamente NO se hace en esta HU para evitar ambigüedad.

## Criterios de aceptación
- [ ] Dado <precondición>, cuando <acción>, entonces <resultado esperado>.
- [ ] Dado ..., cuando ..., entonces ...
- [ ] (uno por cada comportamiento verificable; mínimo 2)

## Notas técnicas (opcional)
- Detalles de implementación relevantes: tablas afectadas, endpoints, módulos del frontend, integraciones con SAP/HubSpot/Azure, migraciones de datos, feature flags, etc.
- Si afecta backend Y frontend, indícalo aquí (no en el título).

## Dependencias (opcional)
- [[DPB-XXX]] historias previas que deben completarse antes.
```

### Reglas del cuerpo

1. **Criterios de aceptación obligatorios** en formato Gherkin liviano (`Dado/Cuando/Entonces`) o checklist verificable. Mínimo 2.
2. **Detalles técnicos van en el cuerpo, NO en el título.** Si la historia es backend, dilo en "Notas técnicas".
3. **No incluyas código fuente extenso.** Solo descripciones concisas y referencias a archivos/tablas.
4. **Escribir en español.**
5. **Convertir fechas relativas a absolutas** ("la próxima semana" → fecha ISO).

---

## 3. Cómo desglosar un análisis en historias (criterio INVEST)

Cada HU debe ser:

- **I**ndependent: no acoplada a otra HU para entregar valor.
- **N**egotiable: el alcance puede discutirse.
- **V**aluable: aporta valor visible.
- **E**stimable: tamaño razonable (idealmente ≤ 1 sprint).
- **S**mall: si el cuerpo crece demasiado, divide.
- **T**estable: cada criterio de aceptación es verificable.

### Heurísticas de desglose

- **Por capa solo si la capa entrega valor independiente** (backend que expone un endpoint consumible por otro equipo). Si backend y frontend son inseparables para el usuario final, agrupa en una sola HU y declara ambos en "Notas técnicas".
- **Por flujo / caso de uso** (asignación inicial vs. reasignación vs. visualización vs. migración de datos existentes).
- **Las migraciones de datos retroactivas** suelen ser HU separadas.

---

## 4. Flujo por defecto (SOLO texto)

Cuando el usuario invoque esta skill sin pedir explícitamente crear en Jira:

1. **Desglosar el análisis funcional** en historias independientes y demostrables (INVEST, §3).
2. **Redactar el título de cada HU** siguiendo §1.
3. **Ponderar cada HU** con Scrum Poker (§1.5).
4. **Devolver el bloque de texto del §0** (título de épica + `HU-N — X pts` + título + `Total`), en formato copiable. **Nada más.**
5. Al final, ofrecer (en una línea) crear las HU en Jira o generar el modo detallado, por si el usuario lo desea.

> Si el usuario proporcionó una épica existente (key `DPB-XXX`), puedes leerla con `getJiraIssue` para tomar contexto, pero **igual la entrega por defecto es solo texto**.

---

## 5. Selección del issueType (Modo Jira)

⚠️ El proyecto DPB tiene los tipos de incidencia **en español**. Usar `issueTypeName` exacto:

| Lo que el usuario pide | `issueTypeName` correcto | NO usar |
|------------------------|--------------------------|---------|
| Historia de usuario / HU / Story | `Historia` | ❌ `Story` (falla con "El tipo de incidencia seleccionada no es válido") |
| Épica | `Epic` | — |
| Tarea técnica | `Tarea` | ❌ `Task` |
| Bug | `Error` | ❌ `Bug` |

Las HU son **siempre** `issueTypeName: "Historia"`.

---

## 6. Modo Jira (opt-in) — crear/subir las HU

Actívalo **solo** cuando el usuario lo pida explícitamente ("créalas en Jira", "súbelas", "poblar Jira"…).

### Vinculación a la épica padre

Una HU **debe** colgar de una épica. Vía recomendada: campo `parent` al crear.

```javascript
mcp__claude_ai_Atlassian__createJiraIssue({
  cloudId: "paloblanco.atlassian.net",
  projectKey: "DPB",
  issueTypeName: "Historia",                     // ← SIEMPRE en español
  summary: "COMO Usuario QUIERO <acción> PARA <valor>",
  description: `## Contexto\n...\n\n## Criterios de aceptación\n- [ ] Dado..., cuando..., entonces...\n`,
  contentFormat: "markdown",
  parent: "DPB-233"                              // ← Key de la épica padre
})
```

Si la vía `parent` falla, usar el Epic Link por campo personalizado: `additional_fields: { "customfield_10014": "DPB-233" }`.

### Flujo del Modo Jira

1. **Leer la épica padre** con `getJiraIssue` para confirmar que existe, es `Epic` y revisar HU ya existentes (evitar duplicados con `searchJiraIssuesUsingJql` → `"Epic Link" = DPB-XXX`).
2. **Mostrar el listado propuesto** (títulos + ponderación) y confirmar con el usuario antes de crear si son más de 3.
3. **Crear cada HU** con `createJiraIssue` usando `parent` y el cuerpo del §2.
4. **Verificar** que quedaron bajo la épica y **reportar** los keys + URLs (`https://paloblanco.atlassian.net/browse/DPB-XXX`).

---

## 7. Checklist final

**Siempre (entrega por defecto):**
- [ ] Cada título inicia con `COMO Usuario QUIERO ` y usa `COMO`/`QUIERO`/`PARA` en MAYÚSCULAS.
- [ ] El rol es `Usuario` (no un rol específico).
- [ ] Título en una sola frase, sin punto final y sin etiquetas técnicas.
- [ ] Cada HU tiene su ponderación (`HU-N — X pts`) y hay un `Total`.
- [ ] La épica lleva su título (puede tener etiqueta técnica como `[APPDISPO]`).
- [ ] Historias independientes entre sí (INVEST).
- [ ] Se devolvió SOLO el texto del §0 (sin descripciones) salvo que se pidiera lo contrario.
- [ ] NO se creó nada en Jira salvo que el usuario lo pidiera.

**Solo en Modo Jira:**
- [ ] `issueTypeName: "Historia"` (no "Story").
- [ ] `parent` apunta a la épica correcta del proyecto DPB.
- [ ] Descripción con al menos: Contexto, Alcance, Criterios de aceptación (≥ 2).
- [ ] No hay HU duplicada bajo la misma épica (verificar con JQL).
- [ ] Después de crear, reportar key + URL al usuario.

---

## Referencias

- Tipos de incidencia DPB: ver memoria `reference-jira-dpb-issue-types`.
- Convención de títulos (preferencia personal): ver memoria `feedback-hu-formato-titulo` — `COMO Usuario QUIERO … PARA …`.
- Comentarios al finalizar tareas: ver memoria `feedback-jira-comments`.
