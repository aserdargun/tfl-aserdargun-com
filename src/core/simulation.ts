import type {
  Config,
  EventType,
  Reason,
  RequestSpec,
  ServingRequest,
  Simulation,
} from "./types";
import { schedulers } from "./scheduler";
export const TICK_MS = 20;
export const defaultConfig: Config = {
  model: {
    name: "Medium / synthetic",
    weightMiB: 4096,
    kvMiBPerToken: 0.125,
    prefillWorkFactor: 1,
    decodeWorkFactor: 1,
  },
  hardware: {
    memoryMiB: 8192,
    runtimeMiB: 768,
    safetyMiB: 256,
    prefillTokensPerTick: 256,
    decodeStepsPerTick: 4,
  },
  policy: "continuous",
  maxActive: 4,
  maxBatchTokens: 256,
  kvCapacityTokens: 16384,
  maxQueue: 64,
  seed: 42,
};
export function createSimulation(
  config: Config = defaultConfig,
  specs: RequestSpec[] = [],
): Simulation {
  if (
    !Object.hasOwn(schedulers, config.policy) ||
    ![
      config.maxActive,
      config.maxBatchTokens,
      config.kvCapacityTokens,
      config.maxQueue,
      config.hardware.prefillTokensPerTick,
      config.hardware.decodeStepsPerTick,
    ].every((x) => Number.isInteger(x) && x > 0) ||
    ![
      config.model.kvMiBPerToken,
      config.model.prefillWorkFactor,
      config.model.decodeWorkFactor,
    ].every((x) => Number.isFinite(x) && x > 0) ||
    ![
      config.model.weightMiB,
      config.hardware.memoryMiB,
      config.hardware.runtimeMiB,
      config.hardware.safetyMiB,
    ].every((x) => Number.isFinite(x) && x >= 0) ||
    !Number.isInteger(config.seed)
  )
    throw new Error("Invalid educational configuration");
  return addRequests(
    {
      config: structuredClone(config),
      time: 0,
      tick: 0,
      requests: [],
      events: [],
      batch: [],
      compute: 0,
      processedTokens: 0,
    },
    specs,
  );
}
export const active = (r: ServingRequest) =>
  !["pending", "waiting", "completed", "rejected"].includes(r.state);
export function capacity(s: Simulation) {
  const { model: m, hardware: h } = s.config;
  return Math.max(
    0,
    Math.min(
      s.config.kvCapacityTokens,
      Math.floor(
        (h.memoryMiB - m.weightMiB - h.runtimeMiB - h.safetyMiB) /
          m.kvMiBPerToken,
      ),
    ),
  );
}
export const allocated = (s: Simulation) =>
  s.requests.reduce((n, r) => n + r.kvTokens, 0);
export const reserved = (s: Simulation) =>
  s.requests.reduce((n, r) => n + r.reservedTokens, 0);
export const finished = (s: Simulation) =>
  s.requests.length > 0 &&
  s.requests.every((r) => r.state === "completed" || r.state === "rejected");
export function addRequests(s: Simulation, specs: RequestSpec[]): Simulation {
  const ids = new Set(s.requests.map((r) => r.id));
  for (const r of specs) {
    if (
      ids.has(r.id) ||
      !Number.isInteger(r.promptTokens) ||
      r.promptTokens < 1 ||
      r.promptTokens > 32768 ||
      !Number.isInteger(r.maxOutput) ||
      r.maxOutput < 1 ||
      r.maxOutput > 512 ||
      !Number.isFinite(r.arrival) ||
      r.arrival < s.time
    )
      throw new Error("Invalid request");
    ids.add(r.id);
  }
  return {
    ...s,
    requests: [
      ...s.requests,
      ...specs.map((r) => ({
        ...r,
        state: "pending" as const,
        prefilled: 0,
        generated: 0,
        kvTokens: 0,
        reservedTokens: 0,
        decodeWork: 0,
        tokenTimes: [],
        tokens: [],
        phaseAt: r.arrival,
      })),
    ],
  };
}
function event(
  s: Simulation,
  r: ServingRequest,
  type: EventType,
  value?: number,
) {
  s.events.push({
    id: s.events.length,
    at: s.time,
    requestId: r.id,
    type,
    ...(value === undefined ? {} : { value }),
  });
}
function reject(s: Simulation, r: ServingRequest, reason: Reason) {
  r.state = "rejected";
  r.reason = reason;
  event(s, r, "REQUEST_REJECTED");
}
// Deliberately illustrative tokenization, not a pretrained tokenizer.
export const tokenize = (text: string) =>
  text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
const sampleWords = [
  "A",
  "world",
  "model",
  "represents",
  "how",
  "an",
  "environment",
  "changes",
  ".",
  "It",
  "can",
  "help",
  "predict",
  "possible",
  "next",
  "states",
  ".",
];
function emit(s: Simulation, r: ServingRequest) {
  r.generated++;
  r.tokenTimes.push(s.time);
  r.tokens.push(sampleWords[(r.generated - 1) % sampleWords.length]);
  event(s, r, "TOKEN_EMITTED", r.generated);
  if (r.generated === r.maxOutput) {
    r.state = "completed";
    r.phaseAt = s.time;
    event(s, r, "REQUEST_COMPLETED");
    event(s, r, "CACHE_RELEASED", r.kvTokens);
    r.kvTokens = 0;
    r.reservedTokens = 0;
  } else {
    r.state = "decode";
    r.phaseAt = s.time;
    event(s, r, "TOKEN_DECODE_STARTED", r.generated);
  }
}
export function waitingReason(s: Simulation, r: ServingRequest): Reason {
  if (
    schedulers[s.config.policy].holdCohort &&
    s.batch.some((id) => s.requests.some((x) => x.id === id && active(x)))
  )
    return "cohort";
  if (s.requests.filter(active).length >= s.config.maxActive) return "slots";
  if (reserved(s) + r.promptTokens + r.maxOutput > capacity(s)) return "kv";
  return "opportunity";
}
export function step(previous: Simulation): Simulation {
  const s = structuredClone(previous);
  if (finished(s)) return s;
  s.time = s.tick * TICK_MS;
  s.tick++;
  s.compute = 0;
  s.processedTokens = 0;
  const justArrived = new Set<string>();
  for (const r of s.requests
    .filter((r) => r.state === "pending" && r.arrival <= s.time)
    .sort((a, b) => a.arrival - b.arrival)) {
    // Preserve exact client arrival timestamp even when arrival is between ticks.
    s.events.push({
      id: s.events.length,
      at: r.arrival,
      requestId: r.id,
      type: "REQUEST_ARRIVED",
    });
    r.state = "waiting";
    r.phaseAt = s.time;
    justArrived.add(r.id);
    if (
      s.config.model.weightMiB +
        s.config.hardware.runtimeMiB +
        s.config.hardware.safetyMiB >=
      s.config.hardware.memoryMiB
    )
      reject(s, r, "model");
    else if (r.promptTokens + r.maxOutput > capacity(s))
      reject(s, r, "impossible");
    else if (
      s.requests.filter((x) => x.state === "waiting").length > s.config.maxQueue
    )
      reject(s, r, "queue");
  }
  // A streaming stage adds one explicit synthetic delivery tick after selection.
  for (const r of s.requests) {
    if (r.state === "streaming" && r.phaseAt < s.time) emit(s, r);
    else if (r.state === "sampling" && r.phaseAt < s.time) {
      r.state = "streaming";
      r.phaseAt = s.time;
      event(s, r, "TOKEN_SAMPLED", r.generated + 1);
    }
  }
  if (!s.batch.some((id) => s.requests.some((r) => r.id === id && active(r))))
    s.batch = [];
  const staticLocked =
    schedulers[s.config.policy].holdCohort && s.batch.length > 0;
  for (const r of s.requests.filter(
    (r) => r.state === "waiting" && !justArrived.has(r.id),
  )) {
    r.reason = waitingReason(s, r);
    if (staticLocked) {
      r.reason = "cohort";
      continue;
    }
    if (s.requests.filter(active).length >= s.config.maxActive) {
      r.reason = "slots";
      continue;
    }
    if (reserved(s) + r.promptTokens + r.maxOutput > capacity(s)) {
      r.reason = "kv";
      continue;
    }
    r.state = "admitted";
    r.phaseAt = s.time;
    r.reason = undefined;
    r.reservedTokens = r.promptTokens + r.maxOutput;
    s.batch.push(r.id);
    event(s, r, "REQUEST_ADMITTED");
  }
  let budget = 1;
  let tokenBudget = s.config.maxBatchTokens;
  const work = schedulers[s.config.policy].orderWork(
    s.requests.filter(active),
    s.tick,
  );
  for (const r of work) {
    if (r.phaseAt === s.time) continue;
    if (r.state === "admitted") {
      r.state = "prefill";
      r.phaseAt = s.time;
      event(s, r, "PREFILL_STARTED");
      continue;
    }
    if (r.state === "prefill" && budget > 0 && tokenBudget > 0) {
      const cost =
        s.config.model.prefillWorkFactor /
        s.config.hardware.prefillTokensPerTick;
      const n = Math.min(
        r.promptTokens - r.prefilled,
        tokenBudget,
        Math.floor((budget + 1e-9) / cost),
      );
      if (n > 0) {
        r.prefilled += n;
        r.kvTokens += n;
        budget -= n * cost;
        tokenBudget -= n;
        s.processedTokens += n;
        event(s, r, "CACHE_ALLOCATED", n);
      }
      if (r.prefilled === r.promptTokens) {
        event(s, r, "PREFILL_COMPLETED");
        r.state = "sampling";
        r.phaseAt = s.time;
      }
    } else if (r.state === "decode" && budget > 0 && tokenBudget > 0) {
      const cost =
        (s.config.model.decodeWorkFactor *
          (1 + (r.promptTokens + r.generated) / 2048)) /
        s.config.hardware.decodeStepsPerTick;
      const spent = Math.min(budget, cost - r.decodeWork);
      r.decodeWork += spent;
      budget -= spent;
      if (r.decodeWork + 1e-9 >= cost) {
        r.decodeWork = 0;
        r.kvTokens++;
        event(s, r, "CACHE_ALLOCATED", 1);
        r.state = "sampling";
        r.phaseAt = s.time;
        tokenBudget--;
        s.processedTokens++;
      }
    }
  }
  s.compute = Math.min(1, Math.max(0, 1 - budget));
  for (const r of s.requests.filter((r) => r.state === "waiting"))
    r.reason = waitingReason(s, r);
  return s;
}
export function runToEnd(s: Simulation, limit = 100000) {
  for (let i = 0; i < limit && !finished(s); i++) s = step(s);
  if (!finished(s))
    throw new Error("Simulation did not finish within tick budget");
  return s;
}
