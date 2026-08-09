# eecheverria-skills

Skills personales de [eecheverria](mailto:eecheverria@paloblanco.com) para Claude Code, compartidas
entre varias computadoras.

Este repositorio se clona en `~/.claude/skills` de cada máquina. Al iniciar una sesión de trabajo se
baja lo último con:

```bash
git -C ~/.claude/skills pull --ff-only
```

## Skills incluidas

| Skill | Qué hace |
|---|---|
| `eecheverria-senior-dev` | Modo de operar como desarrollador senior: ritual de inicio, uso de subagentes para cuidar el contexto, flujo multi-proyecto y cierre con `CLAUDE.md`. Capa base que delega el detalle a las demás skills. |
| `eecheverria-clean-code` | Principios de código limpio y simplificación agnósticos de stack: reducir complejidad sin cambiar el comportamiento, mejorar legibilidad y eliminar redundancia. |
