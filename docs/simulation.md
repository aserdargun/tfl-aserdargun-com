# Educational model, version 1

## Clock and work

The immutable `step` function advances a fixed 20 ms synthetic clock. The first tick processes arrivals at time 0. Rendering only consumes snapshots; no frame duration participates in simulator truth. Playback intentionally displays one tick every 200 wall-clock ms at 1×; speeds change observation cadence, not event timestamps. A paused step performs exactly one tick. Completed scenarios stop the clock.

Defaults: prefill capacity 256 tokens/tick; decode capacity 4 short-context steps/tick; max active 4; batch token ceiling 256; weights 4096 MiB; runtime 768 MiB; safety 256 MiB; accelerator memory 8192 MiB; KV 0.125 MiB per processed token. These are authored educational parameters, not fitted benchmark values.

One shared normalized compute budget of 1 per tick is consumed by:

- Prefill: each processed token costs `prefillWorkFactor / prefillTokensPerTick`.
- Decode: a step costs `decodeWorkFactor × (1 + (promptTokens + generatedTokens) / 2048) / decodeStepsPerTick`. Partial work carries between ticks.

The additional max-batch-token limit bounds prompt plus decode token work each tick. A request cannot run more than one decode step per tick. Prefill may be chunked across ticks. Context-dependent decode cost is an explicit qualitative teaching model.

## Lifecycle

Pending → waiting → admitted → prefill → token scores → selected token in transit → first delivered token. Prefill supplies first-token scores. Subsequent output uses decode → token scores → transit → token delivery until maximum output, then completion and cache release.

Admission and prefill-start are visible separate ticks. Sampling and delivery each take one synthetic tick. No network, TLS or API timing is claimed. Each emission records a timestamp and a scripted token unit. This does not imply model quality, prompt understanding, a real distribution, or a specific engine sampling implementation. Max output terminates the educational request; EOS prediction and cancellation are not modeled.

The final emitted token has not been processed by the model. KV state therefore represents prompt tokens plus processed output tokens, usually `prompt + emitted - 1` immediately after a delivery. This avoids claiming that an unprocessed token already has attention state.

## Admission and memory

Effective capacity is `max(0, min(configured KV token limit, floor((total - weights - runtime - safety) / KV-per-token)))`.

Admission conservatively reserves `prompt + maximum output` token slots. Written KV grows only as tokens are processed. Unwritten reserved space is hatched; request-owned written segments are proportional to effective capacity. The extra selected-request ruler exposes small allocations without distorting the whole-memory scale.

A request larger than the entire effective KV capacity is rejected. Fixed memory exhausting the accelerator produces a distinct model/runtime failure. A full waiting queue rejects incoming requests. Otherwise work waits for slots, a static cohort, or unreserved KV. Reservations and actual allocations are released on completion. No swapping, preemption, prefix reuse or hidden production OOM recovery is simulated.

Pressure means an actual pending admission is blocked by KV reservations. Slot saturation means waiting work exists while active slots are full. Overload labels refer to actual queue-capacity rejections. No invented percentage thresholds are used.

## Scheduler strategies

The typed scheduler registry separates work ordering from capacity invariants. Static-like scheduling admits a cohort, blocks subsequent admission until all members finish, and conceptually holds completed slots. Continuous-like scheduling refills free slots while other sequences run. Fairness-oriented scheduling rotates the first compute recipient each tick; it is not a starvation guarantee. Policies visit arrivals in arrival order; an unschedulable memory-heavy request may be bypassed. This is intentionally not a claim of strict production FIFO.

## Metrics

TTFT = first TOKEN_EMITTED minus REQUEST_ARRIVED. ITL = actual differences between consecutive emissions. Request ITL averages that request's intervals; aggregate ITL pools observed intervals. End-to-end = REQUEST_COMPLETED minus arrival. Queue = admission minus arrival, or elapsed waiting for a currently queued request. Rejected requests stop their wait at rejection. Prefill includes time between PREFILL_STARTED and PREFILL_COMPLETED, including any shared-compute waits. The latency bar separates queue, admission-to-prefill scheduling delay, prefill, and generation/delivery.

Throughput = total emitted tokens / elapsed simulation seconds since earliest arrival. Request throughput uses completed requests over the same denominator. Metrics freeze when all work ends. Pending TTFT/end-to-end values are excluded from means, never converted to zero. Comparison rows run identical immutable request specs under each policy and report completed/rejected counts to expose censoring. These are simulated outcomes, not benchmark curves.

## Reproducibility and future traces

Seeded LCG controls output-length variation in scenarios. Identical configs and seed produce identical requests and events. No randomness is used in playback. JSON export identifies `kind: simulated`, `timeUnit: ms`, config, requests, events and schema version. Prompts stay in the browser until the user exports locally.

`ServingTraceAdapter` is an extension seam for source metadata plus normalized requests/events. No ingestion format, import UI or real trace support is claimed. Future adapters must validate monotonic timestamps, clock origin, units, lifecycle consistency, measured provenance and engine-specific semantics before sharing metrics with simulation. Do not mix synthetic and measured data silently.

## Primary evidence and claim boundaries

- [Hugging Face: How caching works](https://huggingface.co/docs/transformers/cache_explanation): KV state is derived from processed tokens and reused during autoregressive generation. Consult the architecture-specific implementation for exact allocation behavior.
- [vLLM 0.22.1: Production metrics](https://docs.vllm.ai/en/v0.22.1/usage/metrics/): naming for TTFT, inter-token latency, end-to-end and queue metrics. TFL explicitly measures client delivery in synthetic time; production instrumentation boundaries vary.
- Local Atlas `src/data/categories.ts` and `src/data/concepts.ts`, inspected 2026-09-09: INF and SRV remain distinct categories; TFL does not reproduce solution cards.

None of these sources supplies TFL's timing constants or validates simulator performance against hardware.
