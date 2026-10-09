# Architecture records

The authoritative architecture is the Obsidian vault. Start with [System Architecture](../../obsidian/TraceLab-Vault/02-Architecture/System-Architecture.md) and the [architecture decisions](../../obsidian/TraceLab-Vault/11-Architecture-Decisions/ADR-0001-System-Architecture.md).

Current runtime: Next.js → Hono → local SQLite; pure domain packages handle question generation, exact mathematical analysis, recommendation rules, and OCR output validation. The intended Cloudflare/Neon/R2 deployment is not implemented. Keeping that distinction explicit prevents a successful local build from being misreported as a working cloud application.
