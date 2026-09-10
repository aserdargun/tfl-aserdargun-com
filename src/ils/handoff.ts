import {
  semanticContextFromUrl,
  buildLearningLink,
  type SemanticLearningContext,
  type SemanticContext,
  type Locale,
} from "@aserdargun/lab-core";
import { scenarioConfig } from "../core/scenarios";
import type { ExperimentDraft } from "../components/ScenarioControls";
import { learningGraph } from "./graph";
import { experiments } from "./catalog";
export function servingDraft(
  c: SemanticLearningContext,
): ExperimentDraft | null {
  if (c.targetLab !== "tfl") return null;
  if (c.profile === "agent-request" && c.sourceLab === "arl") {
    const config = scenarioConfig(
      c.payload.contextClass === "long" ? "long" : "single",
    );
    return {
      scenarioId: "single",
      config,
      count: 1,
      promptTokens: c.payload.contextClass === "long" ? 8192 : 128,
      output: 16,
    };
  }
  if (
    c.profile !== "serving-workload" ||
    c.sourceLab !== "dcl" ||
    c.payload.modelClass !== "dense-decoder"
  )
    return null;
  const p = c.payload;
  // Preserve a bounded educational cohort, not a production load generator.
  if (
    p.contextLength > 32768 ||
    p.peakConcurrency > 64 ||
    p.averageConcurrency > 16
  )
    return null;
  const config = scenarioConfig("kv");
  config.maxActive = p.averageConcurrency;
  const bits =
    p.precision === "q4"
      ? 4
      : p.precision === "q8"
        ? 8
        : p.precision === "fp32"
          ? 32
          : 16;
  config.model = {
    ...config.model,
    name: `${p.parameterClass.toUpperCase()} / ${p.precision.toUpperCase()} / synthetic`,
    weightMiB:
      ((p.parameterClass === "7b" ? 7 : 14) * 1e9 * bits) / 8 / 2 ** 20,
  };
  // Retain TFL's documented synthetic KV/token and timing factors; size an illustrative memory pool.
  config.kvCapacityTokens = Math.min(
    40000,
    Math.max(
      p.contextLength + 32,
      Math.ceil((p.contextLength + 32) * p.averageConcurrency * 0.75),
    ),
  );
  config.hardware = {
    ...config.hardware,
    memoryMiB: Math.ceil(
      config.model.weightMiB +
        config.hardware.runtimeMiB +
        config.hardware.safetyMiB +
        config.kvCapacityTokens * config.model.kvMiBPerToken,
    ),
  };
  return {
    scenarioId: "kv",
    config,
    count: p.peakConcurrency,
    promptTokens: p.contextLength,
    output: 32,
  };
}
export function readServing(url: URL) {
  const context = semanticContextFromUrl(url, "tfl", learningGraph);
  const draft = context ? servingDraft(context) : null;
  return context && draft ? { context, draft } : null;
}
export function executionContext(
  phase: "prefill" | "decode",
  experimentId: string,
): SemanticContext<"gpu-execution"> {
  const concepts =
    experiments.find((e) => e.id === experimentId)?.concepts ?? [];
  const returnConcept = concepts.includes("concept:kv-cache")
    ? "concept:kv-cache"
    : concepts[0];
  return {
    version: "0.1",
    id: "tfl-execution",
    sourceLab: "tfl",
    sourceExperiment: experimentId,
    targetLab: "gex",
    targetConcept:
      phase === "prefill" ? "concept:tensor-compute" : "concept:gpu-memory",
    intent: "dive-deeper",
    profile: "gpu-execution",
    payload: {
      workloadClass: "transformer-serving",
      phase,
      accessPattern: phase === "prefill" ? "context-dependent" : "sequential",
      computePattern: phase === "prefill" ? "matrix-heavy" : "memory-sensitive",
    },
    returnTo: {
      appId: "tfl",
      experimentId,
      ...(returnConcept ? { conceptId: returnConcept } : {}),
    },
  };
}
export function executionLink(
  phase: "prefill" | "decode",
  experimentId: string,
  locale: Locale,
) {
  const context = executionContext(phase, experimentId);
  return buildLearningLink(learningGraph, {
    targetApp: "gex",
    experimentId: phase === "prefill" ? "tensor" : "memory",
    concept: context.targetConcept,
    locale,
    context,
  });
}
