import type {
  Simulation,
  ServingRequest,
  EventType,
  SimulationEvent,
} from "./types";
export const mean = (a: number[]) =>
  a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
export function requestMetrics(
  s: Simulation,
  r: ServingRequest,
  events = s.events,
) {
  const at = (type: EventType) =>
    events.find((e) => e.requestId === r.id && e.type === type)?.at;
  const arrival = at("REQUEST_ARRIVED"),
    admitted = at("REQUEST_ADMITTED"),
    prefillStart = at("PREFILL_STARTED"),
    prefillEnd = at("PREFILL_COMPLETED"),
    first = at("TOKEN_EMITTED"),
    end = at("REQUEST_COMPLETED"),
    rejectedAt = at("REQUEST_REJECTED");
  const intervals = r.tokenTimes.slice(1).map((t, i) => t - r.tokenTimes[i]);
  return {
    arrival,
    admitted,
    prefillStart,
    prefillEnd,
    first,
    end,
    rejectedAt,
    queue:
      arrival === undefined
        ? null
        : (admitted ?? rejectedAt ?? s.time) - arrival,
    prefill:
      prefillStart === undefined ? null : (prefillEnd ?? s.time) - prefillStart,
    ttft: first === undefined || arrival === undefined ? null : first - arrival,
    itl: mean(intervals),
    intervals,
    e2e: end === undefined || arrival === undefined ? null : end - arrival,
  };
}
export function metrics(s: Simulation) {
  const byRequest = new Map<string, SimulationEvent[]>();
  for (const e of s.events) {
    const events = byRequest.get(e.requestId) ?? [];
    events.push(e);
    byRequest.set(e.requestId, events);
  }
  const rows = s.requests.map((r) =>
    requestMetrics(s, r, byRequest.get(r.id) ?? []),
  );
  const emitted = s.events.filter((e) => e.type === "TOKEN_EMITTED").length;
  const arrivals = s.events
    .filter((e) => e.type === "REQUEST_ARRIVED")
    .map((e) => e.at);
  const elapsed = arrivals.length ? s.time - Math.min(...arrivals) : 0;
  return {
    tokens: emitted,
    throughput: elapsed > 0 ? emitted / (elapsed / 1000) : 0,
    requestThroughput:
      elapsed > 0
        ? s.requests.filter((r) => r.state === "completed").length /
          (elapsed / 1000)
        : 0,
    ttft: mean(rows.flatMap((r) => (r.ttft === null ? [] : [r.ttft]))),
    itl: mean(rows.flatMap((r) => r.intervals)),
    e2e: mean(rows.flatMap((r) => (r.e2e === null ? [] : [r.e2e]))),
    queue: mean(
      rows
        .filter((r) => r.admitted !== undefined)
        .flatMap((r) => (r.queue === null ? [] : [r.queue])),
    ),
  };
}
