---
inclusion: always
---
# 🚨 MANDATORY: Knowledge, Skill & MCP Activation

## CRITICAL ENFORCEMENT — READ BEFORE EVERY RESPONSE

Before you write a `_decisions-*.md`, `design.md`, `tasks.md`, or any code, make
sure your guidance reflects **current, verified** information — not stale
training data — and that any relevant skill is in play.

**RULES:**
1. **NEVER rely on training data alone for fast-moving tools, frameworks, SDKs, language/runtime versions, or cloud service limits and pricing.** Verify against current documentation first.
2. **When a decision file compares technologies or cites a constraint (a quota, a supported version, an API shape), confirm the facts before writing them down.** A wrong limit or deprecated API in a decision file propagates into the design and the code.
3. **If a project-specific skill is available and relevant, activate it BEFORE writing the matching spec or code.** Skills load automatically when their trigger keywords appear — if in doubt whether one applies, treat it as applicable.
4. **Verifying is cheap; a wrong spec is expensive.** When unsure, consult the source rather than guessing.

---

## 📚 AWS Knowledge MCP — use proactively

Use the AWS Knowledge MCP whenever validating AWS-specific guidance — service
capabilities, quotas and limits, regional availability, pricing shape, and
integration patterns — before putting them in a decision file or design. These
change over time, so look them up rather than quoting from memory.

**Tools:** `aws___search_documentation`, `aws___read_documentation`, `aws___get_regional_availability`, `aws___list_regions`

**Rule:** Don't rely on training data alone for AWS capabilities or limits. Search the docs first — especially when a decision file compares services or cites a specific limit, quota, or price.

---

## 🧩 Extending this pack with skills

This is a **general-purpose steering pack**: it ships the AI-DLC workflow only
and intentionally carries an **empty `skills/` folder**. To give the agent deep,
domain-specific expertise for your project, drop an Agent Skill (a folder
containing a `SKILL.md`, optionally with a `references/` library) into `skills/`
and regenerate the scaffolded packs. Well-scoped skills — for a language,
framework, cloud service, or testing approach — make the decision files and
generated artifacts markedly more accurate, because the agent proposes
current best-practice options instead of guessing.

Once added, a skill loads automatically when its trigger keywords appear in the
conversation; no further wiring is required.
