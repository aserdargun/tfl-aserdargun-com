# TFL working contract

- Build the bilingual token-flow laboratory: follow individual requests through queueing, admission, chunked prefill, KV state, iterative decode, sampling, and delivery. Competing request lifetimes, conservative memory reservation, static versus continuous batching, and latency/throughput trade-offs are in scope.
- Keep serving truth in `src/core`; `src/ils`, `src/lessons`, `src/visualization` and `src/integrations` present it. Scheduling and batching decisions are deterministic data, not incidental timing.
- A request is served only within the memory the scheduler reserved for it. When reservation fails the request must be shown as rejected or queued, never silently admitted past the budget. Latency and throughput are derived from the run, not asserted.
- Release identity is published in `/release.json`; a successful local build does not by itself establish a production release.
- Keep Turkish and English controls, lesson text and explanations equivalent. Label the serving assumptions; do not present a simulated schedule as a measurement of a real inference server.
- Verify `npm run validate` and review `git diff --check` before handoff.
- Local work only unless the user authorizes external publication. Preserve unrelated work and processes.
