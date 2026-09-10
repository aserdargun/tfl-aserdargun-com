export type Policy = "continuous" | "static" | "fair";
export type RequestState =
  | "pending"
  | "waiting"
  | "admitted"
  | "prefill"
  | "decode"
  | "sampling"
  | "streaming"
  | "completed"
  | "rejected";
export type Reason =
  | "slots"
  | "kv"
  | "cohort"
  | "opportunity"
  | "model"
  | "impossible"
  | "queue";
export type EventType =
  | "REQUEST_ARRIVED"
  | "REQUEST_ADMITTED"
  | "PREFILL_STARTED"
  | "PREFILL_COMPLETED"
  | "TOKEN_DECODE_STARTED"
  | "TOKEN_SAMPLED"
  | "TOKEN_EMITTED"
  | "REQUEST_COMPLETED"
  | "REQUEST_REJECTED"
  | "CACHE_ALLOCATED"
  | "CACHE_RELEASED";
export interface SimulationEvent {
  id: number;
  at: number;
  requestId: string;
  type: EventType;
  value?: number;
}
export interface RequestSpec {
  id: string;
  prompt: string;
  promptTokens: number;
  maxOutput: number;
  arrival: number;
}
export interface ServingRequest extends RequestSpec {
  state: RequestState;
  prefilled: number;
  prefillWork: number;
  generated: number;
  kvTokens: number;
  reservedTokens: number;
  decodeWork: number;
  tokenTimes: number[];
  tokens: string[];
  phaseAt: number;
  reason?: Reason;
}
export interface ModelProfile {
  name: string;
  weightMiB: number;
  kvMiBPerToken: number;
  prefillWorkFactor: number;
  decodeWorkFactor: number;
}
export interface HardwareProfile {
  memoryMiB: number;
  runtimeMiB: number;
  safetyMiB: number;
  prefillTokensPerTick: number;
  decodeStepsPerTick: number;
}
export interface Config {
  model: ModelProfile;
  hardware: HardwareProfile;
  policy: Policy;
  maxActive: number;
  maxBatchTokens: number;
  kvCapacityTokens: number;
  maxQueue: number;
  seed: number;
}
export interface Simulation {
  config: Config;
  time: number;
  tick: number;
  requests: ServingRequest[];
  events: SimulationEvent[];
  batch: string[];
  compute: number;
  processedTokens: number;
}
export type ScenarioId =
  | "single"
  | "burst"
  | "steady"
  | "long"
  | "code"
  | "short"
  | "kv"
  | "overload"
  | "batching";
export interface ScenarioDefinition {
  id: ScenarioId;
  title: [string, string];
  description: [string, string];
  promptTokens: number;
  output: number;
  count: number;
  interval: number;
  learningObjectives: string[];
  overrides?: Partial<Config>;
}
export interface ServingTraceAdapter {
  metadata: {
    kind: "measured";
    source: string;
    timeUnit: "ms";
    engine: string;
    capturedAt: string;
  };
  read(): Promise<{ requests: RequestSpec[]; events: SimulationEvent[] }>;
}
