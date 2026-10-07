import { readTflContext } from "./context";
import { scenarios } from "../core/scenarios";
import { lessons } from "../lessons/lessons";
import type { ScenarioId } from "../core/types";
/**
 * Resolves a `?chapter=` parameter against the lesson count that owns it.
 *
 * The upper bound is the lesson list, never the width of a digit: a
 * single-character pattern rejects a real chapter the moment the list outgrows
 * that width, and accepts one the moment a lesson is removed. `total` is passed
 * in rather than read from the module so this bound can be exercised at a size
 * the current lesson list does not happen to reach.
 */
export function readChapter(raw: string | null, total: number): number | null {
  // Canonical decimal only: no sign, no padding, no exponent, no other base.
  // "01" is rejected rather than folded to 1, so one chapter index has exactly
  // one URL and a link copied from the address bar always round-trips.
  if (raw === null || !/^(0|[1-9][0-9]*)$/.test(raw)) return null;
  const index = Number(raw);
  return index < total ? index : null;
}

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
  return {
    experiment,
    chapter:
      url.searchParams.get("lesson") === "token-flow-101"
        ? readChapter(url.searchParams.get("chapter"), lessons.length)
        : null,
  };
}
