import {
  contextFromUrl,
  learningLink,
  type LearningContext,
  type Locale,
} from "@aserdargun/lab-core";
import profile from "./compute-handoff.schema.json";
import { manifest } from "./catalog";
export type ComputePayload = {
  workload: "prefill" | "decode";
  batchClass: "single" | "multiple";
  sequenceClass: "short" | "long";
};
function isComputePayload(
  value: Record<string, unknown>,
): value is ComputePayload {
  return (
    Object.keys(value).length === profile.required.length &&
    Object.entries(profile.properties).every(
      ([key, spec]) =>
        typeof value[key] === "string" &&
        spec.enum.includes(value[key] as string),
    )
  );
}

export function readTflContext(
  url: URL,
): LearningContext<ComputePayload> | null {
  const c = contextFromUrl(url, "tfl");
  if (
    !c ||
    c.sourceLab !== "gex" ||
    !isComputePayload(c.payload) ||
    c.targetConcept !== `concept:${c.payload.workload}`
  )
    return null;
  return { ...c, payload: c.payload };
}
export function gpuHandoff(
  workload: ComputePayload["workload"],
  locale: Locale,
  sourceExperiment = "single",
  promptTokens = 6,
  requestCount = 1,
): string {
  const destination = new URL(
    manifest.related.labs!.find((x) => x.id === "gex")!.url,
  );
  destination.pathname = `/gex/${workload === "prefill" ? "tensor" : "memory"}`;
  return learningLink(
    destination.href,
    {
      version: "0.1",
      sourceLab: "tfl",
      sourceExperiment,
      targetLab: "gex",
      targetConcept:
        workload === "prefill"
          ? "concept:tensor-compute"
          : "concept:gpu-memory",
      payload: {
        workload,
        batchClass: requestCount > 1 ? "multiple" : "single",
        sequenceClass: promptTokens >= 2048 ? "long" : "short",
      },
    },
    locale,
  );
}
export const contextExplanation = {
  en: "Continue with the related serving checkpoint. This is a fresh educational replay, not a resumed GPU or request trace.",
  tr: "İlgili sunum kontrol noktasından devam et. Bu, yeni bir eğitim tekrar oynatımıdır; sürdürülmüş GPU veya istek izi değildir.",
};
