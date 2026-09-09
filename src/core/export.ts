import type { Simulation } from "./types";
export function exportSimulation(s: Simulation) {
  return JSON.stringify(
    {
      schema: "tfl.educational-simulation.v1",
      kind: "simulated",
      timeUnit: "ms",
      config: s.config,
      requests: s.requests,
      events: s.events,
    },
    null,
    2,
  );
}
