import { describe, it, expect } from "vitest";
import {
  buildLearningLink,
  validateSemanticLearningContext,
  type SemanticContext,
} from "@aserdargun/lab-core";
import { learningGraph } from "../src/ils/graph";
import {
  readServing,
  servingDraft,
  executionContext,
  executionLink,
} from "../src/ils/handoff";
import { experiments } from "../src/ils/catalog";
import { createSimulation, step } from "../src/core/simulation";
import { scenarioRequests } from "../src/core/scenarios";
const context: SemanticContext<"serving-workload"> = {
  version: "0.1",
  id: "test-serving",
  sourceLab: "dcl",
  sourceExperiment: "personal",
  targetLab: "tfl",
  targetConcept: "concept:kv-cache",
  intent: "continue-workload",
  profile: "serving-workload",
  payload: {
    modelClass: "dense-decoder",
    parameterClass: "14b",
    precision: "q4",
    contextLength: 8192,
    averageConcurrency: 4,
    peakConcurrency: 16,
    requestShape: "long-context",
  },
  returnTo: {
    appId: "dcl",
    experimentId: "personal",
    conceptId: "concept:kv-cache",
  },
};
describe("TFL semantic adapters", () => {
  it("builds both phase links for every actual experiment including the default entry", () => {
    for (const e of experiments)
      for (const phase of ["prefill", "decode"] as const)
        expect(() => executionLink(phase, e.id, "en")).not.toThrow();
  });
  it("maps supported DCL workload into runnable deterministic controls", () => {
    const draft = servingDraft(context)!;
    expect(draft).toMatchObject({
      scenarioId: "kv",
      count: 16,
      promptTokens: 8192,
      config: { maxActive: 4 },
    });
    expect(draft.config.model.weightMiB).toBe((14e9 * 4) / 8 / 2 ** 20);
    const s = createSimulation(
      draft.config,
      scenarioRequests(
        draft.scenarioId,
        draft.count,
        draft.promptTokens,
        draft.output,
      ),
    );
    expect(step(s)).toEqual(step(s));
    const url = new URL(
      buildLearningLink(learningGraph, { targetApp: "tfl", context }),
    );
    expect(readServing(url)?.draft).toEqual(draft);
    for (const phase of ["prefill", "decode"] as const) {
      expect(
        validateSemanticLearningContext(
          executionContext(phase, "kv"),
          learningGraph,
        ).ok,
      ).toBe(true);
      expect(new URL(executionLink(phase, "kv", "tr")).pathname).toBe(
        phase === "prefill" ? "/gex/tensor" : "/gex/memory",
      );
    }
  });
  it("bounds incoming work and removes harmless unknown fields", () => {
    expect(
      servingDraft({
        ...context,
        payload: { ...context.payload, peakConcurrency: 1000 },
      }),
    ).toBeNull();
    expect(
      servingDraft({
        ...context,
        payload: { ...context.payload, contextLength: 131072 },
      }),
    ).toBeNull();
    for (const patch of [
      { version: "99" },
      { payload: { ...context.payload, access_token: "bad" } },
    ]) {
      const u = new URL("https://tfl.aserdargun.com");
      u.searchParams.set("ils", JSON.stringify({ ...context, ...patch }));
      expect(readServing(u)).toBeNull();
    }
    const u = new URL("https://tfl.aserdargun.com");
    u.searchParams.set(
      "ils",
      JSON.stringify({
        ...context,
        payload: { ...context.payload, futureHint: "okay" },
      }),
    );
    expect(readServing(u)?.context.payload).not.toHaveProperty("futureHint");
    u.searchParams.append("ils", "{}");
    expect(readServing(u)).toBeNull();
  });
  it("maps ARL classes without content or priority scheduling", () => {
    const c: SemanticContext<"agent-request"> = {
      version: "0.1",
      id: "test-agent",
      sourceLab: "arl",
      sourceExperiment: "revenue",
      targetLab: "tfl",
      intent: "dive-deeper",
      profile: "agent-request",
      payload: {
        requestClass: "model-invocation",
        contextClass: "long",
        priorityClass: "high",
      },
    };
    const d = servingDraft(c)!;
    expect(d).toMatchObject({
      scenarioId: "single",
      count: 1,
      promptTokens: 8192,
      config: { policy: "continuous" },
    });
    let s = createSimulation(
      d.config,
      scenarioRequests(d.scenarioId, d.count, d.promptTokens, d.output),
    );
    for (let i = 0; i < 5; i++) s = step(s);
    expect(s.events.some((e) => e.type === "PREFILL_STARTED")).toBe(true);
  });
});
