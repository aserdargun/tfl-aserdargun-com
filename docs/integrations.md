# Ecosystem and adapter contracts

Inspected 2026-09-09 in the existing LLM Atlas and GEX checkouts. Root portfolio links were inspected at aserdargun.com. Existing Atlas/GEX HTTP routes returned 200. Their repositories were read only; no root/Atlas/GEX content or deployment was changed.

## Atlas → TFL → GEX

Atlas owns terminology, solutions, evidence and seven category views. TFL owns request lifecycle, scheduling, batching, runtime memory and serving latency experiments. GEX owns GPU execution. This learning path does not reparent GEX: it remains GPU Kernel Atlas's execution companion in the root ecosystem.

Atlas routes: `https://llm.aserdargun.com/{en|tr}/learn/concepts/{slug}`. Verified slugs used: `prompt`, `tokenization`, `batching`, `kv-cache`, `prefill-decode`, `streaming`, `openai-compatible-api`. Category labels are copied conceptually from current Atlas: INF inference engines/runtimes; SRV model servers/serving frameworks; RUN local runners; APP desktop workbenches; DST distributed platforms; GTW gateways; EDG edge runtimes. They are not seven serial pipeline stages.

GEX routes: `https://gex.aserdargun.com/gex/{tensor|memory|kernel}?lang={en|tr}`. Current TFL compute links use `tensor` during prefill and `memory` otherwise. These open GEX's existing conceptual lesson, not a replay of TFL data or a kernel trace. No unrecognized context query parameter is sent. Future mappings can attach prefill GEMM, decode GEMM, attention or KV access context only after GEX supports an explicit contract.

Content metadata is represented by Atlas concept slugs and GEX scene IDs. Source links in model documentation and the evidence disclosure stay separate from simulated scenario constants. There is no claim of importing Atlas model metadata.

## Trace extension

See `ServingTraceAdapter` in `src/core/types.ts`. It requires measured source/engine/time metadata and yields typed requests/events. The current app has only educational simulation mode and a local simulated-event export. Implement validation and provenance handling before adding any real trace mode.
