# TFL core verification — 2026-09-09

## Build and reproducibility

- Clean `npm ci` passed with the committed lockfile; audit reported zero vulnerabilities. Initial npm cache permissions and npm 10 optional-peer resolution failures were resolved with a task-local cache and pinned dependency versions. The final clean install required no legacy-peer override.
- `npm run validate` passed: TypeScript check, 43 Vitest tests across simulation and lesson/export suites, production build.
- `git diff --check` passed. This was a new repository with no existing files or commits. The initial local implementation was verified before publication.
- Production preview is `http://127.0.0.1:4299/`. Port 4199 belonged to the root portfolio, so it was left untouched. The development server uses 5299.
- CI validates and uploads the static artifact. The production workflow separately validates, verifies the release manifest, and uploads the prebuilt artifact to Azure; see the repository Actions runs for release outcomes.

## Real-browser verification

Used Codex In-app Browser through CUA, with real clicks, selects and keyboard input. No Playwright Chromium fallback was used. Unit/integration assertions are reproducible in `npm test`; the following are manual browser checks against development and production builds.

| Interaction            | Observed result                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Send → pause → step    | Waiting/admitted/prefill/sampling/streaming/decode appear as separate simulator states.                                                                                                                                                          |
| First token            | 100 simulated ms TTFT for default six-token prompt; one delivered token, then iterative decode.                                                                                                                                                  |
| Token Flow 101         | Six illustrative token units; checkpoints replay deterministically. Returning to Prefill restores 0 emitted tokens and the prefill scene. Stream checkpoint shows 2/16 delivered, TTFT 100 ms and ITL 60 ms.                                     |
| Load Storm             | 16 requests split into 4 active and 12 waiting. Request identities remain inspectable.                                                                                                                                                           |
| KV Wall                | 2 active, 6 waiting with 1,051/1,200 slots reserved. REQ-007 explains insufficient unreserved KV capacity. Actual written allocation then reaches 256/1,200 and continues growing.                                                               |
| Reset                  | Clock returns to 0.000 s and requests return to the pending state of the loaded scenario.                                                                                                                                                        |
| 32K context            | Selected request enters prefill, writes 256/40,000 slots on the first compute tick, with no token delivered.                                                                                                                                     |
| Policy comparison      | Same seeded 16-request workload: static/1 TTFT 12,040 ms, static/4 3,945 ms, continuous/4 2,020 ms. Throughput 16.5, 41.3 and 61.4 tok/s respectively. Live scene clock remains 0.000 s. These are model outputs, not benchmark claims.          |
| Overload               | 64 arrivals, queue limit 24, 40 rejections; exported JSON contains exactly those requests and lifecycle events.                                                                                                                                  |
| Model capacity failure | Synthetic 8 GiB weights with 8 GiB total memory rejects the workload with the explicit fixed-memory/KV-budget reason.                                                                                                                            |
| Language switch        | EN/TR text and ecosystem URLs update without changing simulation time.                                                                                                                                                                           |
| Mobile controls        | Bottom sheet opens, capacity changes from 1,200 to 600, Run applies it and closes the sheet, Pause works.                                                                                                                                        |
| Keyboard               | Right Arrow advances exactly one 20 ms tick; Space starts and pauses playback. Control-focused keystrokes retain native behavior.                                                                                                                |
| Export                 | Native modal exposes parseable JSON with simulated provenance, ms units, config, all 64 requests and 40 rejection states in the overload check. Save link uses a local JSON Blob and has a download filename; selectable JSON is also available. |
| Viewports              | Desktop 1536×1024; tablet 768×1024; mobile 390×844. No horizontal document overflow in these checks.                                                                                                                                             |
| Production console     | Clean fresh production tab: no warnings or errors.                                                                                                                                                                                               |

The initial programmatic-download event did not surface in the in-app browser. Export was improved to show the complete snapshot in a native accessible dialog, with a user-clicked Save JSON link and a selectable JSON fallback. The dialog JSON was validated in the browser; OS-level file save delivery is not independently claimed.

## Visual comparison / fidelity ledger

Reference: [generated concept](design/concept.png). Final native viewport captures: [desktop](qa/desktop-en.png), [lesson](qa/lesson-en.png), [Turkish mobile](qa/mobile-tr.png), [mobile engine](qa/mobile-engine-tr.png). Used `view_image` on the original concept and final browser captures in the same QA pass. IAB full-page stitching produced duplicate/blank capture regions; those captures were discarded in favor of native viewport captures. DOM inspection confirmed one lesson panel and no horizontal overflow.

| Point checked           | Concept                                           | Implemented / reviewed                                                                                                                  |
| ----------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and first copy | TFL, exact English tagline, ecosystem path        | Preserved; EN/TR and synthetic label are functional.                                                                                    |
| Typography              | Geometric sans headings, monospaced identifiers   | Geist and IBM Plex Mono, locally bundled. Explicit control font sizes; mobile text wraps without clipping.                              |
| Palette                 | Dark neutral, mint active state, restrained amber | Preserved. Prefill consistently amber; decode mint; state labels and patterns prevent color-only encoding.                              |
| Layout                  | Serving world plus right inspector                | Preserved at desktop; tablet/mobile reorganize to one main column. Playback remains reachable.                                          |
| Visual semantics        | Queue → scheduler → engine with KV band           | Live request chips, proportional KV, individual tokens and phase progress are driven by state. No rasterized interactive controls.      |
| Inspector               | Request data and timeline                         | Exact event-derived durations plus selectable history; no decorative duration values.                                                   |
| Controls and icons      | Play, Step, Reset, speed                          | Lucide transport icons, real deterministic transport, disabled finished/empty controls.                                                 |
| Mobile                  | Simplified scene plus controls                    | Responsive stage composition and bottom control sheet; explicit lesson accessible names remain when visible titles collapse to numbers. |

Intentional deviations: the extra quick-experiment rail, exact latency breakdown, written-versus-reserved memory ruler, scientific disclosures, complete ten-chapter navigation and export preview extend the page beyond the single-screen concept. The beginner begins with an empty queue until Send. Synthetic profiles replace the concept's misleading named-model example, and one request is never duplicated across lifecycle locations. A native 2D serving world was selected because its state, capacity and temporal transitions remain legible without unnecessary 3D geometry. Chapter guidance continues below the first viewport when the event inspector is expanded.

The implementation was visually verified against the reference's typography, palette, system composition, controls and state semantics, with these documented functional/scientific extensions. It is not a claim of pixel-identical reproduction of the illustrative concept. No clipping, color-only state, inert core control, or misleading performance label remained in the tested surfaces.

## Scientific review

Confirmed: serving differs from one forward pass; KV is runtime attention state rather than a database; first token comes from prefill scores; subsequent output is iterative; final emitted token is not yet cached; weights are not all runtime memory; throughput does not define user latency; scheduler policies are educational; prefill/decode bottlenecks are workload/architecture dependent; quantization has no universal speed assertion; numbers are unmistakably simulated; GPU execution stays in GEX.

Known scope: scripted token content and illustrative tokenizer; conservative full-request KV reservations; fixed-tick synthetic costs; no real model execution, measured traces, prefix cache, speculative decode, EOS, cancellation or distributed serving. Atlas/GEX integration is contextual linking, not shared execution state. Custom-domain binding and root portfolio registration are outside this release. The GitHub/Azure publication process is documented in deployment.md.
