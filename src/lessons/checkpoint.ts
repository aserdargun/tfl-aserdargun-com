import {
  createSimulation,
  addRequests,
  step,
  finished,
} from "../core/simulation";
import { scenarioConfig, scenarioRequests } from "../core/scenarios";
import { lessons } from "./lessons";
// Always replay from canonical input; a past event is not a current scene state.
export function lessonCheckpoint(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= lessons.length)
    throw new Error("Invalid chapter");
  let s = createSimulation(
    scenarioConfig("single"),
    scenarioRequests("single"),
  );
  if (index >= 8) {
    s = addRequests(
      s,
      scenarioRequests("burst", 15, 6, 16, s.config.seed, 0, 2),
    );
    s = step(step(s));
  }
  for (let i = 0; i < 10000 && !lessons[index].ready(s) && !finished(s); i++)
    s = step(s);
  return s;
}
