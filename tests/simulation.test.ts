import { describe, it, expect } from "vitest";
import {
  createSimulation,
  step,
  runToEnd,
  defaultConfig,
  capacity,
  allocated,
  reserved,
  finished,
  active,
  tokenize,
} from "../src/core/simulation";
import { requestMetrics, metrics } from "../src/core/metrics";
import {
  scenarioRequests,
  scenarioConfig,
  scenarios,
} from "../src/core/scenarios";
import type { Simulation, Config } from "../src/core/types";
const single = (overrides: Partial<Config> = {}) =>
  createSimulation(
    { ...defaultConfig, ...overrides },
    scenarioRequests("single"),
  );
const allSteps = (s: Simulation) => {
  const states = [s];
  for (let i = 0; i < 20000 && !finished(s); i++) {
    s = step(s);
    states.push(s);
  }
  expect(finished(s)).toBe(true);
  return states;
};
describe("A–C: one request and event-derived metrics", () => {
  it("tokenizes illustrative text into token units", () =>
    expect(tokenize("What is a world model?")).toEqual([
      "What",
      "is",
      "a",
      "world",
      "model",
      "?",
    ]));
  it("completes lifecycle in causal order and releases KV", () => {
    const s = runToEnd(single());
    expect(s.requests[0].state).toBe("completed");
    expect(allocated(s)).toBe(0);
    expect(reserved(s)).toBe(0);
    const types = s.events.map((e) => e.type);
    for (const [a, b] of [
      ["REQUEST_ARRIVED", "REQUEST_ADMITTED"],
      ["REQUEST_ADMITTED", "PREFILL_STARTED"],
      ["PREFILL_STARTED", "PREFILL_COMPLETED"],
      ["PREFILL_COMPLETED", "TOKEN_EMITTED"],
      ["TOKEN_EMITTED", "TOKEN_DECODE_STARTED"],
      ["REQUEST_COMPLETED", "CACHE_RELEASED"],
    ])
      expect(types.indexOf(a as never)).toBeLessThan(types.indexOf(b as never));
  });
  it("first token uses prefill logits, without a redundant decode pass", () => {
    const s = runToEnd(single());
    const emitted = s.events.filter((e) => e.type === "TOKEN_EMITTED");
    const decode = s.events.filter((e) => e.type === "TOKEN_DECODE_STARTED");
    expect(emitted).toHaveLength(16);
    expect(decode).toHaveLength(15);
    expect(decode[0].at).toBe(emitted[0].at);
    expect(emitted[0].at).toBe(100);
  });
  it("calculates TTFT, ITL, queue and end-to-end from event times", () => {
    const s = runToEnd(single());
    const r = s.requests[0],
      m = requestMetrics(s, r);
    expect(m.queue).toBe(20);
    expect(m.prefill).toBe(20);
    expect(m.ttft).toBe(r.tokenTimes[0] - r.arrival);
    expect(m.itl).toBe(60);
    expect(m.e2e).toBe(1000);
    expect(metrics(s).throughput).toBe(16);
  });
  it("never emits the whole output in one forward pass", () => {
    const s = runToEnd(single());
    expect(new Set(s.requests[0].tokenTimes).size).toBe(16);
  });
  it("does not mutate previous state", () => {
    const s = single();
    const before = JSON.stringify(s);
    step(s);
    expect(JSON.stringify(s)).toBe(before);
  });
  it("preserves exact between-tick arrival time", () => {
    const specs = scenarioRequests("single");
    specs[0].arrival = 13;
    const s = runToEnd(createSimulation(defaultConfig, specs));
    expect(requestMetrics(s, s.requests[0]).arrival).toBe(13);
    expect(requestMetrics(s, s.requests[0]).ttft).toBe(
      s.requests[0].tokenTimes[0] - 13,
    );
  });
  it("completed simulation does not accumulate idle time", () => {
    const s = runToEnd(single());
    expect(step(s)).toEqual(s);
  });
});
describe("D: concurrency and scheduler", () => {
  it("burst queues and eventually completes", () => {
    const states = allSteps(
      createSimulation(scenarioConfig("burst"), scenarioRequests("burst")),
    );
    expect(
      states.some(
        (s) => s.requests.filter((r) => r.state === "waiting").length >= 12,
      ),
    ).toBe(true);
    for (const s of states)
      expect(s.requests.filter(active).length).toBeLessThanOrEqual(4);
    expect(states.at(-1)!.requests.every((r) => r.state === "completed")).toBe(
      true,
    );
  });
  it("static cohorts prevent refill until all cohort requests finish", () => {
    const specs = scenarioRequests("batching", 8);
    specs[0].maxOutput = 1;
    specs[1].maxOutput = 30;
    const s = runToEnd(
      createSimulation(
        { ...defaultConfig, policy: "static", maxActive: 2 },
        specs,
      ),
    );
    const next = s.events.find(
      (e) => e.type === "REQUEST_ADMITTED" && e.requestId === "REQ-003",
    )!.at;
    const firstCohortEnd = Math.max(
      ...s.events
        .filter(
          (e) =>
            e.type === "REQUEST_COMPLETED" &&
            ["REQ-001", "REQ-002"].includes(e.requestId),
        )
        .map((e) => e.at),
    );
    expect(next).toBeGreaterThanOrEqual(firstCohortEnd);
  });
  it.each(["continuous", "fair"] as const)(
    "%s refills a free slot while another request continues",
    (policy) => {
      const specs = scenarioRequests("single", 3, 6, 24);
      specs[0].maxOutput = 1;
      const s = runToEnd(
        createSimulation({ ...defaultConfig, policy, maxActive: 2 }, specs),
      );
      expect(
        s.events.find(
          (e) => e.type === "REQUEST_ADMITTED" && e.requestId === "REQ-003",
        )!.at,
      ).toBeLessThan(
        s.events.find(
          (e) => e.type === "REQUEST_COMPLETED" && e.requestId === "REQ-002",
        )!.at,
      );
    },
  );
  it("changing token budget changes long-context prefill time", () => {
    const specs = scenarioRequests("long", 1, 2048);
    const a = runToEnd(
        createSimulation({ ...defaultConfig, maxBatchTokens: 32 }, specs),
      ),
      b = runToEnd(
        createSimulation({ ...defaultConfig, maxBatchTokens: 256 }, specs),
      );
    expect(requestMetrics(a, a.requests[0]).prefill!).toBeGreaterThan(
      requestMetrics(b, b.requests[0]).prefill!,
    );
  });
});
describe("E–F: capacity and scenarios", () => {
  it("KV reservations block admission without exceeding capacity", () => {
    const states = allSteps(
      createSimulation(scenarioConfig("kv"), scenarioRequests("kv")),
    );
    expect(states.some((s) => s.requests.some((r) => r.reason === "kv"))).toBe(
      true,
    );
    for (const s of states) {
      expect(allocated(s)).toBeLessThanOrEqual(capacity(s));
      expect(reserved(s)).toBeLessThanOrEqual(capacity(s));
      expect(allocated(s)).toBeLessThanOrEqual(reserved(s));
    }
    expect(reserved(states.at(-1)!)).toBe(0);
  });
  it("KV grows with processed context; last delivered token has not been processed", () => {
    const states = allSteps(single());
    const s = states.find(
      (s) => s.requests[0].generated === 5 && s.requests[0].state === "decode",
    )!;
    expect(s.requests[0].kvTokens).toBe(6 + 4);
  });
  it("rejects impossible workload, never later decodes", () => {
    const s = runToEnd(single({ kvCapacityTokens: 8 }));
    expect(s.requests[0].reason).toBe("impossible");
    expect(
      s.events.some(
        (e) => e.type === "TOKEN_EMITTED" || e.type === "TOKEN_DECODE_STARTED",
      ),
    ).toBe(false);
  });
  it("distinguishes weights/runtime not fitting from per-request KV failure", () => {
    const s = runToEnd(
      single({ hardware: { ...defaultConfig.hardware, memoryMiB: 4096 } }),
    );
    expect(s.requests[0].reason).toBe("model");
  });
  it("overload rejects when waiting queue is full", () => {
    const s = runToEnd(
      createSimulation(
        scenarioConfig("overload"),
        scenarioRequests("overload"),
      ),
    );
    expect(s.requests.filter((r) => r.reason === "queue")).toHaveLength(40);
    expect(s.requests.filter((r) => r.state === "completed")).toHaveLength(24);
  });
  it.each(scenarios.map((s) => s.id))(
    "%s reproducibly finishes with bounded compute, memory and monotonic token timestamps",
    (id) => {
      const config = scenarioConfig(id),
        specs = scenarioRequests(id);
      const a = runToEnd(createSimulation(config, specs)),
        b = runToEnd(createSimulation(config, specs));
      expect(a).toEqual(b);
      expect(a.compute).toBeLessThanOrEqual(1);
      for (const r of a.requests) {
        expect(
          r.tokenTimes.every(
            (t, i) => t >= r.arrival && (i === 0 || t > r.tokenTimes[i - 1]),
          ),
        ).toBe(true);
      }
      expect(allocated(a)).toBe(0);
    },
  );
  it("seed deterministically changes workload shapes", () => {
    expect(scenarioRequests("burst", 16, 128, 32, 42)).toEqual(
      scenarioRequests("burst", 16, 128, 32, 42),
    );
    expect(scenarioRequests("burst", 16, 128, 32, 42)).not.toEqual(
      scenarioRequests("burst", 16, 128, 32, 43),
    );
  });
  it("reset reconstructs the exact initial scenario", () => {
    const config = scenarioConfig("kv"),
      specs = scenarioRequests("kv");
    const initial = createSimulation(config, specs);
    runToEnd(initial);
    expect(createSimulation(config, specs)).toEqual(initial);
  });
  it("invalid configs and duplicate request IDs are rejected", () => {
    expect(() => single({ maxActive: 0 })).toThrow();
    const specs = scenarioRequests("single");
    expect(() =>
      createSimulation(defaultConfig, [...specs, ...specs]),
    ).toThrow();
  });
});
