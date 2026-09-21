# Ecosystem and adapter contracts

Content and route review: 2026-09-21. TFL’s nine experiments, ten guided chapters, six views, learning metadata and documentation were compared with the root portfolio. Both language variants of the seven linked Atlas concepts, the GEX anatomy/tensor/memory routes, the root Turkish page and ARL/DCL entry links returned HTTP 200. HTTP availability alone does not verify cross-app interaction behavior.

## Atlas → TFL → GEX

Atlas owns terminology, solutions, evidence and seven category views. TFL owns request lifecycle, scheduling, batching, runtime memory and serving latency experiments. GEX owns GPU execution. This learning path does not reparent GEX: it remains GPU Kernel Atlas's execution companion in the root ecosystem.

Atlas routes: `https://llm.aserdargun.com/{en|tr}/learn/concepts/{slug}`. Verified slugs used: `prompt`, `tokenization`, `batching`, `kv-cache`, `prefill-decode`, `streaming`, `openai-compatible-api`. Category labels are copied conceptually from current Atlas: INF inference engines/runtimes; SRV model servers/serving frameworks; RUN local runners; APP desktop workbenches; DST distributed platforms; GTW gateways; EDG edge runtimes. They are not seven serial pipeline stages.

GEX routes: `https://gex.aserdargun.com/gex/{tensor|memory|anatomy}?lang={en|tr}`. Compute links choose `tensor` for prefill and `memory` for decode. Two supported learning contracts coexist:

- Legacy pilot links in `src/ils/context.ts` pass only workload, coarse batch class and sequence class. GEX return links open a paused TFL lesson checkpoint.
- Semantic `gpu-execution` links in `src/ils/handoff.ts` pass phase and qualitative access/compute patterns, using the canonical ILS graph. Return links reopen the source experiment.

DCL `serving-workload` contexts support dense-decoder model classes within 32K context, 16 active slots and 64 arrivals. ARL `agent-request` contexts map to one illustrative request with 128 or 8,192 input tokens. TFL validates inputs and starts a new paused scenario; it retains its own synthetic timing and KV model. Invalid or unsupported contexts fall back to the ordinary experience with a notice. No prompt, document, agent authority, exact kernel trace or live hardware state crosses these links. See [the cross-lab contract](CROSS-LAB-HANDOFF.md).

The UI links to the root portfolio in the selected language and explains the Foundation → LLM → TFL relationship. The nine observation guides use experiment-specific Atlas topics: batching for admission/scheduling, KV cache for memory/output lifetime, and prefill/decode for lifecycle/long-context work. These are learning relationships, not shared serving infrastructure.

Content metadata is represented by Atlas concept slugs and GEX scene IDs. Source links in model documentation and the evidence disclosure stay separate from simulated scenario constants. There is no claim of importing Atlas model metadata.

## Trace extension

See `ServingTraceAdapter` in `src/core/types.ts`. It requires measured source/engine/time metadata and yields typed requests/events. The current app has only educational simulation mode and a local simulated-event export. Implement validation and provenance handling before adding any real trace mode.
