import type { Policy, ServingRequest } from "./types";
/** Pure scheduling strategies. Capacity checks remain the simulator's invariant. */
export interface Scheduler {
  holdCohort: boolean;
  orderWork(requests: ServingRequest[], tick: number): ServingRequest[];
}
const arrivalOrder = (requests: ServingRequest[]) =>
  [...requests].sort((a, b) => a.arrival - b.arrival);
export const schedulers: Record<Policy, Scheduler> = {
  continuous: { holdCohort: false, orderWork: arrivalOrder },
  static: { holdCohort: true, orderWork: arrivalOrder },
  fair: {
    holdCohort: false,
    orderWork: (requests, tick) => {
      const ordered = arrivalOrder(requests);
      if (!ordered.length) return ordered;
      const offset = tick % ordered.length;
      return [...ordered.slice(offset), ...ordered.slice(0, offset)];
    },
  },
};
