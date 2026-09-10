import { describe, it, expect } from "vitest";
import {
  validateManifest,
  validateExperiment,
  validateLesson,
  validateCatalog,
  learningLink,
} from "@aserdargun/lab-core";
import { manifest, experiments, guidedLesson } from "../src/ils/catalog";
import concepts from "../src/ils/concepts.json";
describe("ILS catalog", () => {
  it("validates the manifest, every experiment and the real guided lesson", () => {
    expect(validateManifest(manifest).ok).toBe(true);
    expect(experiments.length).toBeGreaterThanOrEqual(2);
    for (const experiment of experiments)
      expect(validateExperiment(experiment).ok).toBe(true);
    expect(validateLesson(guidedLesson).ok).toBe(true);
    expect(
      validateCatalog(
        manifest,
        experiments,
        [guidedLesson],
        concepts.map((c) => c.id),
      ),
    ).toEqual([]);
  });
});
import { gpuHandoff, readTflContext } from "../src/ils/context";
import { readEntry } from "../src/ils/routing";
import { scenarios } from "../src/core/scenarios";
import { lessons } from "../src/lessons/lessons";
import { lessonCheckpoint } from "../src/lessons/checkpoint";
it("maps actual presets and live readiness predicates without a second runtime", () => {
  expect(experiments.map((x) => x.id)).toEqual(scenarios.map((x) => x.id));
  for (const e of experiments) expect(e.config?.scenarioId).toBe(e.id);
  expect(guidedLesson.steps.map((s) => s.title.en)).toEqual(
    lessons.map((s) => s.title[0]),
  );
  expect(lessons[4].ready(lessonCheckpoint(4))).toBe(true);
  expect(lessons[6].ready(lessonCheckpoint(6))).toBe(true);
});
it("handoff contains only classified educational parameters, never prompt or runtime state", () => {
  const url = new URL(gpuHandoff("prefill", "tr", "long", 32768, 8));
  expect(url.pathname).toBe("/gex/tensor");
  expect(url.searchParams.get("lang")).toBe("tr");
  const c = JSON.parse(url.searchParams.get("ils")!);
  expect(c.payload).toEqual({
    workload: "prefill",
    batchClass: "multiple",
    sequenceClass: "long",
  });
  expect(c.sourceExperiment).toBe("long");
  expect(JSON.stringify(c)).not.toMatch(/prompt|REQ-|time|apiKey/);
  expect(new URL(gpuHandoff("decode", "en")).pathname).toBe("/gex/memory");
});
it("return context opens related paused checkpoint; existing root and invalid links stay safe", () => {
  const c = {
    version: "0.1" as const,
    sourceLab: "gex",
    sourceExperiment: "tensor",
    targetLab: "tfl",
    targetConcept: "concept:prefill",
    payload: {
      workload: "prefill",
      batchClass: "single",
      sequenceClass: "short",
    },
  };
  const url = new URL(learningLink("https://tfl.aserdargun.com/", c, "en"));
  expect(readTflContext(url)?.payload.workload).toBe("prefill");
  expect(readEntry(url)).toEqual({ experiment: "single", chapter: 4 });
  expect(
    readEntry(new URL("https://tfl.aserdargun.com/?experiment=kv")),
  ).toEqual({ experiment: "kv", chapter: null });
  for (const query of [
    "?ils=bad",
    "?experiment=bogus&lesson=token-flow-101&chapter=999",
    "?lesson=token-flow-101&chapter=-1",
  ])
    expect(readEntry(new URL("https://tfl.aserdargun.com/" + query))).toEqual({
      experiment: "single",
      chapter: null,
    });
  const bad = new URL(
    learningLink(
      "https://tfl.aserdargun.com/",
      { ...c, payload: { ...c.payload, secret: "no" } },
      "en",
    ),
  );
  expect(readTflContext(bad)).toBeNull();
});
