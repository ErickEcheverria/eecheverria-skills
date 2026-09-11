---
name: changelog-deploy
description: Redacta el mensaje de solicitud de despliegue para DevOps (changelog funcional + sección de commits por repo + scripts para el DBA). Úsala cuando el usuario pida el changelog de un release, el resumen para mandarle al de DevOps, el mensaje de despliegue, o los scripts SQL consolidados para el DBA.
---

# Changelog + solicitud de despliegue

Produce **un mensaje pegable** (Teams/Slack) que le pide a DevOps desplegar y al DBA correr
los scripts. Es el formato que usa el equipo; no lo reinventes.

## Datos que hay que recolectar ANTES de escribir

Por cada repo que entra al despliegue:

```bash
git remote get-url origin                       # → URL del repo
git rev-parse origin/<branch>                   # → SHA COMPLETO (40 chars, no el corto)
git log --oneline origin/main..origin/developer  # → qué entra, para redactar los bullets
```

- **El SHA va completo.** DevOps lo copia y pega; un SHA corto los obliga a resolverlo.
- **El SHA es el de la rama que se despliega, y se toma DESPUÉS del merge.** Un merge de PR
  crea un commit nuevo: el head de `main` no es el head de `developer`.
- **NUNCA pongas un SHA provisional en el bloque del mensaje.** El bloque se copia y se
  pega tal cual; una advertencia afuera no lo evita — ya pasó, se enviaron hashes que no
  existían en `main`. Si el merge todavía no está hecho, el bloque va con
  `Ultimo commit: <PENDIENTE — sha del merge>`, que es imposible de mandar por error, o no
  se entrega la sección de commits hasta tener el merge. Verificá con
  `git log -1 --format='%s' origin/main` que el head sea el commit del merge esperado.
- **Capa** por repo: `Frontend`, `Backend`, `Agente`.
- **Ambiente**: `PROD` si la rama es `main`, `DEV` si es `developer`.

## Estructura del mensaje

```
Hola <DevOps>, buenos días, me apoyas con el siguiente despliegue para <App>
<Título del cambio, en una línea>

- <bullet funcional>
- <bullet funcional>
- <bullet funcional>

Repo: <url>/commits/<branch>/
Capa: <Frontend|Backend|Agente>
branch: <branch>
Ambiente: <PROD|DEV>
Ultimo commit: <sha completo>

(repetir el bloque por cada repo)

También <DBA>, me apoyas con los siguientes scripts para <App>
<nombre-del-archivo.sql adjunto>
```

## Cómo se entrega

**Texto plano.** El mensaje se pega en Teams, así que nada de markdown en la salida: sin
`>` de cita (se pega como bloque citado con barras), sin `**negritas**` (viajan como
asteriscos), sin encabezados `#`. Solo líneas y guiones `-` para los bullets. Si hay que
resaltar algo (el orden del deploy, que un script va antes que el código), va con
MAYÚSCULAS o en su propia línea, no con asteriscos.

Entregalo en un bloque de código sin lenguaje, para que se copie tal cual y el cliente no
le aplique formato.

## Los bullets funcionales

Es la parte que importa: los lee gente que no toca el código.

1. **Qué cambió y DÓNDE se ve**, con el nombre exacto de la pantalla, pestaña, sección o
   columna tal como aparece en la UI ("en el expediente, pestaña Datos de la Vivienda,
   sección Condiciones de Precio", "en el modal de la integración").
2. **Comportamiento observable, no implementación.** Nada de nombres de función, tablas,
   endpoints, hooks ni componentes. Si el cambio es puramente técnico y no se ve, va en una
   sola línea al final ("sin cambios visibles: …") o no va.
3. **Lo que el usuario va a ver raro y no es un bug**, dicho de frente: valores vacíos o en
   "Sin registrar" hasta que se capturen datos, montos que suben porque antes faltaba un
   factor, catálogos que arrancan vacíos. Esto evita el reporte falso del día siguiente.
4. **Terminología del usuario**: en BIM Budget se dice "integración", nunca "preset".
5. **Sin emojis. Sin adjetivos de venta** ("mejoramos la experiencia"). Frases declarativas
   en presente.
6. **Agrupá por tema**, no por commit. Diez commits de un mismo arreglo son un bullet.
7. Si el release cambia **plata** (precios, factores, totales), eso va como bullet propio y
   con el número medido, no con un "puede variar".
8. **Un bullet = una línea.** Si necesita dos oraciones, la segunda es el contraste con lo
   de antes (entre paréntesis) y nada más. Un párrafo por bullet no lo lee nadie.
9. **Sin titulares dentro del bullet.** Nada de "LOS MONTOS SUBEN:" ni "Prestaciones:"
   seguido de la explicación: la frase arranca directo con lo que pasa.

## La sección de commits

Un bloque por repo, en el orden en que hay que desplegar (backend antes que frontend si el
frontend usa endpoints nuevos; el agente al final salvo que algo dependa de él). Si el orden
importa, decilo en una línea antes de los bloques.

Cuando un repo NO entra al despliegue, omitilo — no mandes bloques con "sin cambios".

## Los scripts para el DBA

- **Un solo archivo** consolidado, no cinco adjuntos: el DBA corre uno y listo. Nombralo
  `PROD_deploy_<YYYY-MM-DD>.sql` (o `PROD_<tema>.sql`) y dejalo versionado en `scripts/`.
- **Idempotente y reejecutable**: DDL detrás de un chequeo en `information_schema`, seeds
  con `NOT EXISTS` / `ON DUPLICATE KEY`, backfills que solo llenen lo que está en NULL.
- **Encabezado con: cómo correrlo, prerrequisitos y qué pasa si se corre dos veces.**
- **Separá en PARTE 1 / PARTE 2** cuando algo cambie montos o borre datos: la parte
  obligatoria del deploy va primero y sin efectos colaterales; la que cambia plata va
  después, precedida por los SELECT que imprimen el impacto, para poder revisar sin
  aplicar. Decí en el mensaje cuál de las dos partes está aprobada.
- **Verificación al final**: SELECTs que confirmen cada bloque (columna creada, defaults,
  conteos por empresa, permisos concedidos).
- **Orden respecto al deploy**: si el código nuevo escribe una columna nueva, el script va
  ANTES del despliegue. Decilo en el mensaje, en negrita, con la consecuencia ("sin la
  columna, toda creación de partida responde 500").
- Si el cliente del DBA es Workbench/DBeaver: apagar `SQL_SAFE_UPDATES` al inicio y
  restaurarlo al final (Error 1175 en UPDATEs cuyo WHERE no usa columna indexada), y evitar
  archivos que dependan de `DELIMITER` si van a mandarlos como una sola sentencia.

## Antes de entregar el mensaje

- Corré el script consolidado contra **dev** (que ya lo tiene todo aplicado): debe salir
  no-op y la verificación en verde. Eso prueba la idempotencia de verdad.
- Verificá que el CI del release esté verde en los repos que entran.
- Pegá los números medidos, no estimados: filas afectadas, montos, conteos.
