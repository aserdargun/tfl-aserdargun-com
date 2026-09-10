import { readTflContext } from "./context";
import { scenarios } from "../core/scenarios";
import type { ScenarioId } from "../core/types";
export function readEntry(url: URL): {
  experiment: ScenarioId;
  chapter: number | null;
} {
  const context = readTflContext(url);
  if (context)
    return {
      experiment: "single",
      chapter: context.payload.workload === "prefill" ? 4 : 6,
    };
  const raw = url.searchParams.get("experiment");
  const experiment = scenarios.find((x) => x.id === raw)?.id ?? "single";
  const chapter = url.searchParams.get("chapter");
  return {
    experiment,
    chapter:
      url.searchParams.get("lesson") === "token-flow-101" &&
      chapter !== null &&
      /^[0-9]$/.test(chapter)
        ? Number(chapter)
        : null,
  };
}
