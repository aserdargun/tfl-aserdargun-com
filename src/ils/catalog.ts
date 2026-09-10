import {
  parseManifest,
  type ExperimentDefinition,
  type LessonDefinition,
} from "@aserdargun/lab-core";
import rawManifest from "../../lab.manifest.json";
import rawExperiments from "./experiments.json";
import { lessons } from "../lessons/lessons";
import type { ScenarioId } from "../core/types";
export const manifest = parseManifest(rawManifest);
export const experiments = rawExperiments as ExperimentDefinition<{
  scenarioId: ScenarioId;
}>[];
export const guidedLesson: LessonDefinition = {
  schemaVersion: "0.1",
  id: "token-flow-101",
  title: manifest.lessons![0].title,
  concepts: [
    "concept:prefill",
    "concept:decode",
    "concept:kv-cache",
    "concept:scheduling",
    "concept:ttft",
    "concept:prompt",
    "concept:tokenization",
    "concept:streaming",
  ],
  steps: lessons.map((step, index) => ({
    id: `chapter-${index + 1}`,
    title: { en: step.title[0], tr: step.title[1] },
    explanation: { en: step.body[0], tr: step.body[1] },
    experimentId: "single",
    focus: [step.focus],
    completion: { kind: "app-signal", signal: `chapter-${index}-ready` },
  })),
};
