# MANARA | منارة

MANARA is a mobile-first spoken-Arabic learning prototype built around virtual travel and cross-dialect transfer. The current build implements the app-native **world → city → scenario → conversation** journey with curated local data, bilingual Arabic/English presentation, RTL support, cinematic transitions, and a deterministic no-credentials learning path.

## Local setup

Requirements:

- Node.js 20.9 or newer
- npm

Install and start the application:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local environment files are optional; the application remains usable without third-party credentials.

Development routes compile the first time they are opened. This project keeps Next.js's Webpack development mode because Turbopack's CSS worker cannot start reliably in the current Windows/OneDrive environment. For a competition demo with no on-demand development compilation, run `npm run build` once and then `npm run start`. Active OneDrive syncing or antivirus scanning can add file-I/O delay, so pausing sync during development or working from a non-synced folder may also improve local compile time.

## Geographic map

MANARA uses MapLibre GL JS with OpenFreeMap's keyless Liberty vector style. The geographic renderer needs no map account, API key, or map-related environment variable. If WebGL, the style, or its network resources cannot initialize, MANARA deliberately switches to its built-in geographic fallback. Destination selection and the world → city → scenario journey remain functional. The provider surface remains hidden until its required tiles are ready, avoiding a blank provider flash.

Liberty was selected after production inspection because its land, water, streets, and regional boundaries remain readable inside MANARA's dark chrome. MANARA overlays a local, public-domain Natural Earth boundary extract for all 22 Arab League member states, with brighter available/preview states, while keeping city markers—not whole countries—as the exact selection targets. Provider city and POI labels are reduced so custom destination markers, selection labels, routes, and illustrated city hotspots stay visually dominant. OpenFreeMap/OpenStreetMap attribution remains visible in the map controls; the boundary extraction script records its Natural Earth source in the generated GeoJSON.

`MANARA_SITE_URL` is used only to construct canonical metadata URLs and defaults to `http://localhost:3000`.

## Optional Gemini conversation and real voice

The complete journey works with no AI key and no paid API usage. To add Gemini-assisted short Local Character replies, copy `.env.example` to `.env.local`, set the private server variable, and restart the development server:

```dotenv
GEMINI_API_KEY=your_private_key
```

Never use a `NEXT_PUBLIC_` prefix for this key. The browser sends a bounded learner transcript to MANARA's `/api/conversation` route; only that server route imports `@google/genai` and reads the key. It calls the GA Gemini Interactions API with `gemini-3.5-flash`, a JSON schema, provider storage disabled, a 3.2-second timeout, cancellation, and no SDK retry. Missing credentials, HTTP 429/quota limits, timeouts, malformed output, network loss, and provider errors all return quietly to the deterministic path.

The microphone button uses the browser's Arabic speech-recognition capability (`ar-AE` in Abu Dhabi and `ar-EG` in Cairo). Tapping once begins listening; tapping again immediately submits the transcript captured so far, with a short fallback settle when a browser omits its normal end event. Browser support varies, and the browser or operating-system speech service may process audio according to its own policies. MANARA does not persist raw audio or recognized text. **Type instead** and scene-safe practice choices remain available. Character playback uses browser speech synthesis when available, selects the closest installed regional Arabic voice, and prefers the character's male/female presentation. The operating system controls which voices exist, so generated voices are not described as authentically Emirati or Egyptian; the playback port still allows reviewed human recordings to override them later.

The implementation follows official Google guidance consulted on **2026-08-29**: [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview), [JavaScript SDK setup](https://ai.google.dev/gemini-api/docs/get-started), [models](https://ai.google.dev/gemini-api/docs/models), [pricing/free tier](https://ai.google.dev/gemini-api/docs/pricing), [API-key security](https://ai.google.dev/gemini-api/docs/api-key), [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting), [Live API WebSockets](https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket), [ephemeral tokens](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens), [Live session lifecycle](https://ai.google.dev/gemini-api/docs/live-api/best-practices), [audio transcription](https://ai.google.dev/gemini-api/docs/transcribe), and [speech generation](https://ai.google.dev/gemini-api/docs/speech-generation). A persistent Gemini Live session was not selected for the competition path: browser ephemeral authentication is Preview and a persistent raw-audio session adds lifecycle risk without improving the zero-key guarantee.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Bilingual product entry, optional learner starting-point setup, and journey start |
| `/map` | Arab-world destination selection |
| `/map/[destinationSlug]` | City exploration and scenario hotspots |
| `/map/[destinationSlug]/[scenarioSlug]` | Scenario arrival, real voice controls, optional Gemini-enhanced Local Character conversation, Guide, retry, and deterministic completion flow |

Cairo has café and taxi scenarios; Abu Dhabi has café and university scenarios. A learner may enter either destination first with no history. Casablanca is represented as Coming Soon and is not enterable. Other preview and coming-soon hotspots remain visible context rather than active scenario routes.

## Linguistic review status

The four dialogue packs are structurally complete deterministic review fixtures, not approved teaching content. Every newly authored linguistic record is currently `needs_review`, and the authoritative publication manifest therefore contains zero records. The UI must disclose draft/review mode and suppress definitive dialect, local-naturalness, MSA/register, and transfer teaching claims until a qualified reviewer records evidence and changes the applicable canonical source state to lowercase `verified`. See [Linguistic review queue](./docs/LINGUISTIC_REVIEW.md).

## Project scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Generate Next.js route types and run TypeScript checks |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Create a production build |
| `npm run start` | Serve an existing production build |

Run the release checks with:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Current boundaries

- The travel, city, hotspot, and conversation experience is locally driven and works without a map-service token.
- Four six-beat deterministic scenarios, distinct Local Characters, city-specific human Local Guide surfaces, a pure scenario state machine, normalized evaluator, one-retry flow, derived learning-event history, and the deterministic Fumble Map are implemented.
- Starting-point setup supports beginner, MSA learner, dialect learner (with an optional known variety), and heritage/partial learner. It adapts translation, transliteration, hints, response complexity, and comparison style without restricting routes.
- Profile schema v2 can persist minimal derived progress locally when the learner chooses. Raw learner input is session-only and is not serialized; city visits do not count as dialect knowledge.
- An optional Gemini conversation adapter and browser microphone/playback adapters are connected behind typed boundaries. Gemini enriches in-world wording but never evaluates, verifies, persists progress, or directly changes Fumble Map evidence.
- No authentication, database, cloud learner profile, remote learner analytics, pronunciation scoring, or persistent realtime audio session is included.
- Linguistic records retain `verified` or `needs_review` state. Unverified dialect attribution must not be presented as established fact.
- Learner and travel state may be held locally where useful; there is no account or cross-device synchronization.

See [Product](./docs/PRODUCT.md), [Architecture](./docs/ARCHITECTURE.md), [Linguistic rules](./docs/LINGUISTIC_RULES.md), and the [Implementation plan](./docs/IMPLEMENTATION_PLAN.md) for the governing product and engineering contracts.
