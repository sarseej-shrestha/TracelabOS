# Accessibility Testing

Playwright/axe tests are configured for landing and student workspace with WCAG 2 A/AA, 2.1 AA, and 2.2 AA tags. The test process failed before browser assertions because the environment denied opening the local server socket. No axe pass or manual accessibility result is claimed. Run keyboard-only, screen reader, contrast, 200% zoom, mobile touch target, and reduced-motion reviews after browser access is restored.

Related: [[00-START-HERE]] · [[Current-State]]

## Executed Chromium checks — 2026-10-08

Axe checks pass on landing, student workspace and teacher studio. Mobile workspace has no horizontal overflow. Keyboard Tab/Enter activates skip link and navigation; 200% root font size remains usable. These bounded checks do not establish full WCAG conformance. Five full browser tests pass.

Learning lab: desktop (1440×1000) and mobile (390×844) axe WCAG 2/2.1/2.2 A/AA-tagged scans report zero violations in the tested expanded states. Enter activates the correct-outcome control; tables accept keyboard focus and horizontal scrolling; document width stays within the mobile viewport. These checks do not establish complete WCAG conformance or screen-reader usability.

Replay: Home/End/arrow keys scrub a real reviewed submission. Mobile document width fits 390px; axe checks pass after correcting muted text on the new pale panel (initial 4.41:1 failure). Existing full teacher accessibility coverage also passes. No assertions were removed to fix the defect.
