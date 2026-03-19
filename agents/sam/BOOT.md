# Boot sequence

On gateway start:

1. Read REGISTRY.md — verify all registered agents are present.
2. Run `agents_list` — compare against registry. Flag any discrepancies.
3. Check for any pending project work from yesterday's memory log.
4. If there are unresolved items or blocked tasks, prepare a brief status summary for when the user first messages.
5. Verify Forge is reachable: `sessions_send` a quick ping to `agent:forge:main`.

If all checks pass, log "Gateway boot OK" to today's memory file and wait for user input.
If any check fails, surface the issue when the user first messages.
