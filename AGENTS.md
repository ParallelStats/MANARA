# MANARA | منارة

MANARA is an immersive spoken-Arabic learning experience built around virtual travel. Its core differentiator is **cross-dialect transfer**: preserve what a learner already knows, then help them adapt it naturally in a new Arabic-speaking community.

## Read before changing the repository

Read only the documentation relevant to the task:

- [Product scope and journey](docs/PRODUCT.md)
- [Architecture and module boundaries](docs/ARCHITECTURE.md)
- [Linguistic validation and feedback rules](docs/LINGUISTIC_RULES.md)
- [Ordered delivery phases and acceptance criteria](docs/IMPLEMENTATION_PLAN.md)

## Repository rules

- Preserve the existing Next.js implementation architecture; do not restart or replace the application.
- Design UI mobile-first around a modern 390px viewport, then adapt it deliberately for larger screens.
- Keep the product excellent on desktop competition-demo screens without presenting it as a centered phone mockup.
- Do not design MANARA as a traditional website; core states should use focused, app-native interaction patterns.
- Preserve a complete mock mode; real AI or speech providers must remain optional behind interfaces.
- Do not present dialect attribution, local naturalness, or pronunciation claims as certain unless the underlying content is explicitly `verified`.
- Prefer a small curated linguistic dataset to broad model-generated coverage.
- Keep the Local Character immersive and the MANARA Guide selective; communication comes before correction.
- Maintain Arabic/English parity, RTL support, accessibility, privacy, and consent boundaries in affected work.
- Stay within the current implementation-plan phase unless the task explicitly changes scope.

## Validation

- Install dependencies: `npm install`
- Start the local application: `npm run dev`
- Lint the project: `npm run lint`
- Check TypeScript: `npm run typecheck`
- Run tests: `npm run test`
- Create a production build: `npm run build`

## Definition of done

A change is done when it meets the active phase's acceptance criteria, preserves mock mode and linguistic safety, includes proportionate tests or documented verification, passes every command listed above once available, and updates the relevant documentation when contracts or scope change.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
