import { defaultConfig } from "./simulation";
import type {
  Config,
  RequestSpec,
  ScenarioDefinition,
  ScenarioId,
} from "./types";
export const scenarios: ScenarioDefinition[] = [
  {
    id: "single",
    title: ["One request", "Tek istek"],
    description: [
      "Follow the full lifetime of one prompt.",
      "Bir istemin tüm yaşam döngüsünü izle.",
    ],
    promptTokens: 6,
    output: 16,
    count: 1,
    interval: 0,
    learningObjectives: ["lifecycle"],
    overrides: { kvCapacityTokens: 256 },
  },
  {
    id: "burst",
    title: ["Load Storm", "Yük Fırtınası"],
    description: [
      "A burst of users competes for four active slots.",
      "Bir kullanıcı dalgası dört etkin yer için yarışır.",
    ],
    promptTokens: 128,
    output: 24,
    count: 16,
    interval: 0,
    learningObjectives: ["queue", "concurrency"],
  },
  {
    id: "steady",
    title: ["Steady arrivals", "Düzenli geliş"],
    description: [
      "A request arrives every 200 simulated milliseconds.",
      "Her 200 simülasyon milisaniyesinde bir istek gelir.",
    ],
    promptTokens: 128,
    output: 16,
    count: 16,
    interval: 200,
    learningObjectives: ["arrival"],
  },
  {
    id: "long",
    title: ["32K context", "32K bağlam"],
    description: [
      "One long document arrives before seven short questions.",
      "Uzun bir belge yedi kısa sorudan önce gelir.",
    ],
    promptTokens: 32768,
    output: 16,
    count: 8,
    interval: 80,
    learningObjectives: ["workload shape"],
    overrides: {
      kvCapacityTokens: 40000,
      hardware: { ...defaultConfig.hardware, memoryMiB: 12288 },
    },
  },
  {
    id: "code",
    title: ["Code generation", "Kod üretimi"],
    description: [
      "Longer output keeps requests and KV state alive.",
      "Uzun çıktı istekleri ve KV durumunu daha uzun tutar.",
    ],
    promptTokens: 2048,
    output: 128,
    count: 4,
    interval: 0,
    learningObjectives: ["output lifetime"],
  },
  {
    id: "short",
    title: ["Many short users", "Çok sayıda kısa istek"],
    description: [
      "Short prompts with different completion times.",
      "Farklı bitiş sürelerine sahip kısa istemler.",
    ],
    promptTokens: 32,
    output: 16,
    count: 32,
    interval: 0,
    learningObjectives: ["batching"],
  },
  {
    id: "kv",
    title: ["KV Wall", "KV Duvarı"],
    description: [
      "Memory reservations hold new requests in the queue.",
      "Bellek rezervasyonları yeni istekleri kuyrukta tutar.",
    ],
    promptTokens: 512,
    output: 32,
    count: 8,
    interval: 0,
    learningObjectives: ["memory"],
    overrides: { kvCapacityTokens: 1200, maxActive: 8 },
  },
  {
    id: "overload",
    title: ["Overload", "Aşırı yük"],
    description: [
      "64 arrivals exceed a waiting queue of 24.",
      "64 istek, 24 kişilik bekleme kuyruğunu aşar.",
    ],
    promptTokens: 512,
    output: 32,
    count: 64,
    interval: 0,
    learningObjectives: ["rejection"],
    overrides: { maxQueue: 24 },
  },
  {
    id: "batching",
    title: ["Batching trade-off", "Gruplama dengesi"],
    description: [
      "Compare identical work with static and dynamic admission.",
      "Aynı işi sabit ve dinamik kabul ile karşılaştır.",
    ],
    promptTokens: 64,
    output: 48,
    count: 16,
    interval: 80,
    learningObjectives: ["static vs continuous"],
  },
];
export function scenario(id: ScenarioId) {
  return scenarios.find((s) => s.id === id)!;
}
export function scenarioConfig(id: ScenarioId): Config {
  return structuredClone({ ...defaultConfig, ...scenario(id).overrides });
}
export function scenarioRequests(
  id: ScenarioId,
  count = scenario(id).count,
  promptTokens = scenario(id).promptTokens,
  output = scenario(id).output,
  seed = 42,
  start = 0,
  firstId = 1,
): RequestSpec[] {
  const sc = scenario(id);
  let rng = seed >>> 0;
  const random = () => {
    rng = (1664525 * rng + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: `REQ-${String(firstId + i).padStart(3, "0")}`,
    prompt: i === 0 ? "What is a world model?" : "Explain the next state.",
    promptTokens: id === "long" && i > 0 ? 64 : promptTokens,
    maxOutput:
      id === "single"
        ? output
        : Math.max(1, Math.round(output * (0.3 + 0.7 * random()))),
    arrival: start + i * sc.interval,
  }));
}
