import type { EventType, Reason, RequestState } from "../core/types";
export type Locale = "en" | "tr";
export type T = (en: string, tr: string) => string;
export const stateName: Record<RequestState, [string, string]> = {
  pending: ["Not arrived", "Henüz gelmedi"],
  waiting: ["Waiting", "Bekliyor"],
  admitted: ["Admitted", "Kabul edildi"],
  prefill: ["Prefill", "Ön doldurma"],
  decode: ["Decode", "Çözümleme"],
  sampling: ["Token scores", "Token skorları"],
  streaming: ["Streaming", "Akış"],
  completed: ["Completed", "Tamamlandı"],
  rejected: ["Rejected", "Reddedildi"],
};
export const reasonName: Record<Reason, [string, string]> = {
  slots: [
    "Maximum active request limit reached.",
    "Etkin istek sınırına ulaşıldı.",
  ],
  kv: [
    "Insufficient unreserved KV capacity for admission.",
    "Kabul için yeterli ayrılmamış KV kapasitesi yok.",
  ],
  cohort: [
    "Static batch must finish before a new cohort enters.",
    "Yeni grup girmeden önce sabit grup bitmeli.",
  ],
  opportunity: [
    "Waiting for the next scheduling opportunity.",
    "Sonraki zamanlama fırsatını bekliyor.",
  ],
  model: [
    "Weights and fixed runtime memory leave no KV budget.",
    "Ağırlıklar ve sabit çalışma belleği KV için yer bırakmıyor.",
  ],
  impossible: [
    "This request exceeds the entire KV capacity, including its output reservation.",
    "Bu istek, çıktı rezervasyonuyla birlikte tüm KV kapasitesini aşıyor.",
  ],
  queue: [
    "Waiting queue is full; educational admission policy rejects this request.",
    "Bekleme kuyruğu dolu; eğitimsel kabul politikası bu isteği reddeder.",
  ],
};
export const eventName: Record<EventType, [string, string]> = {
  REQUEST_ARRIVED: ["Request arrived", "İstek geldi"],
  REQUEST_ADMITTED: ["Scheduler admitted", "Zamanlayıcı kabul etti"],
  PREFILL_STARTED: ["Prefill started", "Ön doldurma başladı"],
  PREFILL_COMPLETED: ["Prefill completed", "Ön doldurma bitti"],
  TOKEN_DECODE_STARTED: ["Decode started", "Çözümleme başladı"],
  TOKEN_SAMPLED: ["Token selected", "Token seçildi"],
  TOKEN_EMITTED: ["Token delivered", "Token iletildi"],
  REQUEST_COMPLETED: ["Completed", "Tamamlandı"],
  REQUEST_REJECTED: ["Rejected", "Reddedildi"],
  CACHE_ALLOCATED: ["KV written", "KV yazıldı"],
  CACHE_RELEASED: ["KV released", "KV serbest bırakıldı"],
};
export const num = (n: number | null | undefined, d = 0) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: d });
export const ms = (n: number | null | undefined) =>
  n == null ? "—" : `${num(n, 1)} ms`;
