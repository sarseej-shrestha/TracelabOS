# API Architecture

Hono is mounted through the Next.js Node runtime catch-all route. JSON routes use Zod; errors return stable codes with request IDs. Session middleware authenticates users before scoped resources are loaded. Mutations require same-origin Origin headers. Domain changes and events share SQLite transactions. The implementation is not yet a Cloudflare Worker: scrypt, sharp, and local SQLite require adapter work. See [[API-Contracts]].

Related: [[00-START-HERE]] · [[Current-State]]
