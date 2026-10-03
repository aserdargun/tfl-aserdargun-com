/**
 * Where this teaching scheduler and its metrics come from.
 *
 * Checked 2026-10-03 against the primary sources. The lab hedges deliberately:
 * the scheduler panel calls its modes "continuous-batching-like" rather than
 * claiming to implement a published algorithm. These references make that
 * hedge checkable — the reader can see what the named mechanism actually is,
 * and how far this simulation departs from it.
 *
 * No measurement in this lab comes from these sources. They are design and
 * definition references, not benchmarks, and nothing here was executed.
 */

export interface ProvenanceReference {
  id: string;
  title: string;
  url: string;
  /** What the source actually establishes, kept narrow on purpose. */
  establishes: { en: string; tr: string };
  /** Where this lab deliberately differs, or what it does not claim. */
  differs: { en: string; tr: string };
}

export const schedulerProvenance = {
  checkedAt: "2026-10-03",
  references: [
    {
      id: "orca-iteration-scheduling",
      title: "Orca: A Distributed Serving System for Transformer-Based Generative Models (OSDI '22, pp. 521–538)",
      url: "https://www.usenix.org/conference/osdi22/presentation/yu",
      establishes: {
        en: "The published mechanism this lab's “continuous-batching-like” mode resembles. Orca proposes iteration-level scheduling — the scheduler invokes the engine for a single iteration rather than for a whole request, so a finished request returns immediately and a newly arrived one is considered after one iteration instead of after the whole batch. It pairs this with selective batching, which splits the batch and processes each request individually for the attention operation while applying batching to the other operations.",
        tr: "Bu laboratuvarın “sürekli gruplama benzeri” kipinin dayandığı yayımlanmış mekanizma. Orca, yinelim düzeyinde zamanlama önerir: zamanlayıcı motoru tek bir istek için değil, tek bir yinelim için çağırır; böylece biten istek hemen döner ve yeni gelen istek tüm grup yerine bir yinelim sonrasında değerlendirilir. Bunu, grubu bölüp her isteği dikkat işlemi için ayrı işleyen ve diğer işlemlere gruplamayı uygulayan seçici gruplama ile birlikte sunar.",
      },
      differs: {
        en: "This lab does not implement Orca. It has no attention-operation split, no KV-cache preallocation, no model or tensor parallelism, and it schedules a small number of active slots under a synthetic memory budget. The reported 36.9× throughput improvement over FasterTransformer on GPT-3 175B is Orca's result on their setup, not a figure this lab reproduces or can reproduce.",
        tr: "Bu laboratuvar Orca'yı uygulamaz. Dikkat işlemi bölmesi, önceden ayrılmış KV önbelleği, model ya da tensor paralizliği yoktur; sentetik bir bellek bütçesi altında az sayıda etkin yer zamanlar. Hızlandırılmış dönüştürücüye karşı bildirilen 36,9 kat verim artışı, Orca'nın kendi kurulumundaki sonucudur; bu laboratuvar onu ne yeniden üretir ne de üretebilir.",
      },
    },
    {
      id: "latency-metric-definitions",
      title: "GenAI-Perf metric definitions (NVIDIA developer blog)",
      url: "https://developer.nvidia.com/blog/llm-benchmarking-fundamental-concepts/",
      establishes: {
        en: "The definitions behind this lab's TTFT and ITL. Time to first token is the wait before the first output token and includes request queuing, prefill and network latency, so it grows with prompt length because attention must process the whole input before the key-value cache exists. End-to-end latency equals TTFT plus generation time. Intertoken latency is defined as (end-to-end latency − TTFT) ÷ (total output tokens − 1), which excludes the first token — the subtracted one is the whole point.",
        tr: "Bu laboratuvarın TTFT ve ITL değerlerinin arkasındaki tanımlar. İlk tokene kadar geçen süre, ilk çıktı tokenını bekleme süresidir; istek kuyruğu, ön doldurma ve ağ gecikmesini kapsar ve istem uzadıkça büyür, çünkü kısa-değer önbelleği oluşmadan önce dikkat tüm girdiyi işlemelidir. Uçtan uca gecikme, TTFT ile üretim süresinin toplamıdır. Tokenlar arası gecikme, (uçtan uca gecikme − TTFT) ÷ (toplam çıktı tokenı − 1) olarak tanımlanır ve ilk tokenı dışarıda bırakır; çıkardıkları bir tam olarak budur.",
      },
      differs: {
        en: "That published ITL is a per-request average. This lab also draws the live gap between consecutive deliveries in the inspector, which is a distribution rather than a mean. The two should not be read as the same number, and a single-token request has no ITL at all under the published formula.",
        tr: "Yayımlanan ITL istek başına bir ortalamadır. Bu laboratuvar ayrıca inceleyicide ardışık iletimler arasındaki canlı boşluğu da çizer; bu bir dağılımdır, ortalamadır değil. İkisi aynı sayı olarak okunmamalıdır ve tek tokenlı bir istek, yayımlanan formüle göre hiç ITL’ye sahip değildir.",
      },
    },
    {
      id: "metric-naming-divergence",
      title: "vLLM metrics reference",
      url: "https://docs.vllm.ai/en/stable/design/metrics/",
      establishes: {
        en: "That engines do not all publish one latency number under one name. vLLM records inter-token latency as one sample per streamed output event — the wall-clock gap between successive outputs — while its request-level time-per-output-token is computed once per finished request as (end-to-end latency − TTFT) ÷ (output tokens − 1), and is recorded as zero for requests generating no more than one token.",
        tr: "Motorların tek bir gecikme sayısını tek bir ad altında yayımlamadığı vardır. vLLM, tokenlar arası gecikmeyi akışa çıkan her olay için bir örnek olarak kaydeder — ardışık çıktılar arasındaki duvar saati boşluğu —; istek düzeyindeki çıktı başına süreyi ise biten her istek için bir kez, (uçtan uca gecikme − TTFT) ÷ (çıktı tokenı − 1) olarak hesaplayarak kaydeder ve birden fazla token üretmeyen istekler için sıfır yazar.",
      },
      differs: {
        en: "This is the concrete case where the two diverge: when one output bundles several tokens, as speculative decoding does, the per-event gap and the per-request average are not the same quantity. A lab that labels both “ITL” would be hiding that difference.",
        tr: "İkisi tam olarak burada ayrışır: bir çıktı, spekülatif çözümlemenin yaptığı gibi birden çok token içerdiğinde, olay başına boşluk ile istek başına ortalama aynı büyüklük değildir. İkisine de “ITL” diyen bir laboratuvar bu farkı gizliyor olurdu.",
      },
    },
  ] as const,
};
