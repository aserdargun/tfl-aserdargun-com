import type { Simulation } from "../core/types";
export interface Lesson {
  title: [string, string];
  body: [string, string];
  focus: "queue" | "scheduler" | "engine" | "memory";
  concept: string;
  ready: (s: Simulation) => boolean;
}
export const lessons: Lesson[] = [
  {
    title: ["Send", "Gönder"],
    body: [
      "A request carries a prompt, an arrival time and an output limit. Press Send to give it an identity.",
      "Bir istek; istem, geliş zamanı ve çıktı sınırı taşır. Kimlik vermek için Gönder’e bas.",
    ],
    focus: "queue",
    concept: "prompt",
    ready: (s) => s.requests.length > 0,
  },
  {
    title: ["Tokenize", "Tokenlara ayır"],
    body: [
      "The model receives token IDs, not raw text. These word and punctuation units illustrate the idea; real tokenizers segment differently.",
      "Model ham metin değil, token kimlikleri alır. Bu sözcük ve noktalama birimleri kavramı gösterir; gerçek tokenizer’lar farklı böler.",
    ],
    focus: "queue",
    concept: "tokenization",
    ready: (s) => s.requests.length > 0,
  },
  {
    title: ["Wait", "Bekle"],
    body: [
      "Arrival starts the latency clock. A request waits for a scheduling opportunity, an active slot and sufficient memory. Queue time counts toward TTFT.",
      "Geliş, gecikme saatini başlatır. İstek; zamanlama fırsatı, etkin yer ve yeterli bellek bekler. Kuyruk süresi TTFT’ye dahildir.",
    ],
    focus: "queue",
    concept: "batching",
    ready: (s) => s.events.some((e) => e.type === "REQUEST_ARRIVED"),
  },
  {
    title: ["Schedule", "Zamanla"],
    body: [
      "The educational scheduler checks active slots and reserves prompt + maximum output capacity before admission. This conservative policy prevents mid-generation capacity deadlock.",
      "Eğitimsel zamanlayıcı etkin yerleri kontrol eder ve kabulden önce istem + azami çıktı kapasitesini ayırır. Bu temkinli politika üretim sırasında bellek kilitlenmesini önler.",
    ],
    focus: "scheduler",
    concept: "batching",
    ready: (s) => s.events.some((e) => e.type === "REQUEST_ADMITTED"),
  },
  {
    title: ["Prefill", "Ön doldur"],
    body: [
      "Input tokens are processed in configured chunks. Prefill writes key/value states and produces scores for the first next token. No output has been delivered yet.",
      "Giriş tokenları ayarlanan parçalar halinde işlenir. Ön doldurma anahtar/değer durumlarını yazar ve ilk sonraki tokenın skorlarını üretir. Henüz çıktı iletilmedi.",
    ],
    focus: "engine",
    concept: "prefill-decode",
    ready: (s) => s.events.some((e) => e.type === "PREFILL_STARTED"),
  },
  {
    title: ["Remember", "Durumu sakla"],
    body: [
      "KV cache holds attention keys and values from processed tokens. It is finite runtime memory, not a database. Written state and reserved capacity are different.",
      "KV önbellek, işlenmiş tokenların dikkat anahtarlarını ve değerlerini tutar. Bir veritabanı değil, sonlu çalışma belleğidir. Yazılan durum ve ayrılan kapasite farklıdır.",
    ],
    focus: "memory",
    concept: "kv-cache",
    ready: (s) => s.events.some((e) => e.type === "CACHE_ALLOCATED"),
  },
  {
    title: ["Decode", "Çözümle"],
    body: [
      "After the first token, each decode step processes the previously selected token, extends KV state and produces scores for the next token. Output is autoregressive.",
      "İlk tokendan sonra her çözümleme adımı önceki seçili tokenı işler, KV durumunu büyütür ve sonraki tokenın skorlarını üretir. Çıktı otoregresiftir.",
    ],
    focus: "engine",
    concept: "prefill-decode",
    ready: (s) => s.events.some((e) => e.type === "TOKEN_DECODE_STARTED"),
  },
  {
    title: ["Stream", "İlet"],
    body: [
      "TTFT ends at the first delivered token. ITL measures the gaps between subsequent deliveries. Here, selection and delivery each take one synthetic tick.",
      "TTFT ilk iletilen tokenda biter. ITL sonraki iletimler arasındaki süreyi ölçer. Burada seçim ve iletim, birer sentetik adım sürer.",
    ],
    focus: "engine",
    concept: "streaming",
    ready: (s) => s.requests.some((r) => r.generated >= 2),
  },
  {
    title: ["Share", "Paylaş"],
    body: [
      "Add load to see independent request lifetimes compete. A free slot can admit new work in continuous-batching-like mode, while a static cohort holds its slots.",
      "Bağımsız isteklerin yarışmasını görmek için yük ekle. Sürekli gruplama benzeri kipte boşalan yer yeni iş alabilir; sabit grup yerlerini tutar.",
    ],
    focus: "scheduler",
    concept: "batching",
    ready: (s) => s.requests.length > 1,
  },
  {
    title: ["Optimize", "Dengele"],
    body: [
      "One model. Many requests. Finite resources. Compare identical workloads: aggregate throughput, first-token latency and memory demand answer different questions.",
      "Tek model. Çok sayıda istek. Sınırlı kaynaklar. Aynı iş yüklerini karşılaştır: toplam verim, ilk token gecikmesi ve bellek talebi farklı soruları yanıtlar.",
    ],
    focus: "memory",
    concept: "batching",
    ready: (s) => s.requests.some((r) => r.state === "completed"),
  },
];
