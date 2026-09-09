import { it, expect } from "vitest";
import { lessons } from "../src/lessons/lessons";
import { lessonCheckpoint } from "../src/lessons/checkpoint";
import { allocated } from "../src/core/simulation";
it.each(lessons.map((_, i) => i))(
  "chapter %i reaches its own deterministic checkpoint",
  (i) => {
    const s = lessonCheckpoint(i);
    expect(lessons[i].ready(s)).toBe(true);
    expect(lessonCheckpoint(i)).toEqual(s);
  },
);
it("prefill checkpoint shows prefill even after visiting later chapters", () => {
  lessonCheckpoint(9);
  expect(lessonCheckpoint(4).requests[0].state).toBe("prefill");
  expect(lessonCheckpoint(4).requests[0].generated).toBe(0);
});
it("remember has actual written KV; sharing has queued and active requests", () => {
  expect(allocated(lessonCheckpoint(5))).toBeGreaterThan(0);
  const s = lessonCheckpoint(8);
  expect(s.requests.some((r) => r.state === "waiting")).toBe(true);
  expect(s.requests.some((r) => r.state === "admitted")).toBe(true);
});

import { exportSimulation } from "../src/core/export";
it("export preserves provenance, config and exact event timestamps without mutating state", () => {
  const s = lessonCheckpoint(7),
    before = JSON.stringify(s);
  const e = JSON.parse(exportSimulation(s));
  expect(e.kind).toBe("simulated");
  expect(e.timeUnit).toBe("ms");
  expect(e.events).toEqual(s.events);
  expect(e.config).toEqual(s.config);
  expect(e.requests).toEqual(s.requests);
  expect(JSON.stringify(s)).toBe(before);
});
