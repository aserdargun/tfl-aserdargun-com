# TFL — Token Flow Laboratory

**Follow a request from prompt to next token.**

A bilingual, deterministic educational serving laboratory. Follow individual requests through queueing, admission, chunked prefill, KV state, iterative decode, sampling and token delivery. Explore competing request lifetimes, conservative memory reservations, static versus continuous batching, and latency/throughput trade-offs.

TFL is the serving companion to [LLM Runtime & Serving Atlas](https://llm.aserdargun.com) and connects to [GEX](https://gex.aserdargun.com) for GPU execution. Intended domain: `tfl.aserdargun.com`. This repository does not imply that the domain has been deployed.

## Run

Requires Node 22.12 or later.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5299. Vite uses a strict project-specific port and does not terminate another application's listener. If npm 10 encounters its optional-peer resolution bug, use `npm ci --legacy-peer-deps`; dependency versions and the lockfile are checked in.

```sh
npm run lint
npm test
npm run build
npm run preview
```

Production preview uses http://127.0.0.1:4299. Static artifact: `dist/`. Azure routing and security headers are included in `public/staticwebapp.config.json`; no Azure resource or DNS record is created by the build.

## Use

- **Follow:** Send a prompt. Play/pause, step, reset, and inspect its event-derived timeline. Token Flow 101 has ten replayable checkpoints.
- **Load:** Add concurrent requests or use single, burst, steady, long-context, code-generation and many-short-users scenarios.
- **Memory:** Show fixed model/runtime memory, actual written KV, admission reservations, and capacity failures.
- **Scheduler:** Inspect static-cohort, continuous-batching-like and fairness-oriented strategies.
- **Metrics:** TTFT, ITL, end-to-end latency, queue time, token/request throughput, individual distributions and an isolated worker-based policy comparison.
- **Labs:** Choose reproducible presets including Load Storm, KV Wall, Overload and Batching Trade-off.

Changes in experiment controls apply with **Run scenario**. Preset buttons load a paused scenario. **Reset** restores the last loaded scenario. On mobile, experiment controls open as a bottom sheet. EN/TR switching preserves simulation state and remembers language where browser storage is available. Space plays/pauses and Right Arrow steps when focus is outside controls. A hidden tab pauses playback. Reduced-motion users begin paused after Send; all state has a textual representation.

## Scientific boundary

All timings, memory capacities and model profiles are **simulated**. Tokenization uses illustrative word/punctuation units; it is not a pretrained tokenizer. Output is scripted token text; no model, API, hardware workload or network packet simulator runs. Every displayed token has an actual simulation emission timestamp.

See [deployment contract](docs/deployment.md), [model specification](docs/simulation.md), [integration contracts](docs/integrations.md), and [QA evidence](docs/qa.md). The generated design reference is in `docs/design/concept.png`; no raster UI is shipped.

## Architecture

- `src/core/`: immutable fixed-step simulator, typed requests/events, pure scheduler strategies, metrics, scenarios, isolated comparison worker.
- `src/visualization/`: semantic state-driven request world and conceptual memory allocation.
- `src/components/`: controls, inspector, exact timeline, memory/metrics experiments, bilingual text.
- `src/lessons/`: ten lesson definitions and deterministic checkpoint replay.
- `src/integrations/`: verified Atlas and GEX routes, with trace extension interface in core types.
- `tests/`: lifecycle, timing, capacity, reproducibility, scheduler and lesson invariants.

No speculative decoding, prefix caching, distributed serving or fake benchmark/trace mode is included. These are extension points after the core.
