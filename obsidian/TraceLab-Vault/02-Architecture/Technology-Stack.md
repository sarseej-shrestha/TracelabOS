# Technology Stack

Installed versions are pinned in package.json and package-lock.json. Next.js/React provide the UI; Hono/Zod validate the API; node:sqlite persists the local demo; sharp decodes and normalizes image uploads; Vitest/fast-check cover logic; Playwright/axe are configured for browser checks. pnpm workspace metadata exists, but its binary is unavailable in the offline environment. npm is a documented bootstrap fallback, not a claim that pnpm was tested.

Related: [[00-START-HERE]] · [[Current-State]]
