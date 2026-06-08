## UI Work
Before any UI change, read .claude/skills/design.md and apply the 
MakaziHub design system. Never introduce new color values, shadow levels,
or spacing outside the defined tokens. Reference ~/.claude/skills/emil-design.md
for philosophy and motion principles.

## General
- Stack: React + Vite + Tailwind CSS + lucide-react
- Backend: Fastify + Supabase + PostgreSQL
- Always run tsc --noEmit after changes — 0 new errors
- Never remove working functionality while improving styles
