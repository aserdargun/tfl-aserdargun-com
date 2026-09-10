import { createSimulation, runToEnd } from "./simulation";
import { scenarioRequests } from "./scenarios";
import { metrics } from "./metrics";
import type { Config, ScenarioId, Policy } from "./types";
self.onmessage = (
  e: MessageEvent<{
    config: Config;
    scenarioId: ScenarioId;
    count: number;
    promptTokens: number;
    output: number;
  }>,
) => {
  try {
    const d = e.data;
    const specs = scenarioRequests(
      d.scenarioId,
      d.count,
      d.promptTokens,
      d.output,
      d.config.seed,
    );
    const result = (
      [
        { policy: "static", slots: 1 },
        { policy: "static", slots: d.config.maxActive },
        { policy: "continuous", slots: d.config.maxActive },
        { policy: "fair", slots: d.config.maxActive },
      ] as { policy: Policy; slots: number }[]
    )
      .filter(
        (x, i, rows) =>
          rows.findIndex(
            (r) => r.policy === x.policy && r.slots === x.slots,
          ) === i,
      )
      .map((x) => {
        const s = runToEnd(
          createSimulation(
            { ...d.config, policy: x.policy, maxActive: x.slots },
            specs,
          ),
        );
        return {
          ...x,
          ...metrics(s),
          completed: s.requests.filter((r) => r.state === "completed").length,
          rejected: s.requests.filter((r) => r.state === "rejected").length,
          duration: s.time,
        };
      });
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Comparison failed",
    });
  }
};
