import { ExternalLink } from "lucide-react";
import { atlasLink, relatedConcepts } from "../integrations/links";
import type { T, Locale } from "./i18n";
export function ContextPanel({ t, locale }: { t: T; locale: Locale }) {
  return (
    <section className="context-panel">
      <details>
        <summary>
          {t("Where am I in the stack?", "Yığının neresindeyim?")}
        </summary>
        <p>
          {t(
            "TFL connects request scheduling in Model Servers & Serving Frameworks (SRV) to execution and KV state in Inference Engines & Runtimes (INF). These are distinct Atlas categories, not a universal implementation boundary.",
            "TFL, Model Sunucuları ve Servis Çerçeveleri (SRV) içindeki istek zamanlamasını Çıkarım Motorları ve Çalışma Zamanları (INF) içindeki yürütme ve KV durumuna bağlar. Bunlar ayrı Atlas kategorileridir; evrensel uygulama sınırları değildir.",
          )}
        </p>
        <div className="stack-rail">
          <span>{t("Client application", "İstemci uygulaması")}</span>
          <span>GTW · {t("Gateway / API", "Ağ geçidi / API")}</span>
          <strong>SRV · {t("Model server", "Model sunucusu")}</strong>
          <strong>
            INF · {t("Inference runtime", "Çıkarım çalışma zamanı")}
          </strong>
          <span>GEX · {t("Hardware execution", "Donanım yürütmesi")}</span>
        </div>
        <p>
          {t(
            "Atlas also covers RUN (local runners), APP (desktop workbenches), DST (distributed platforms), and EDG (edge runtimes). These are categories with overlapping implementations, not seven serial pipeline stages.",
            "Atlas ayrıca RUN (yerel çalıştırıcılar), APP (masaüstü çalışma alanları), DST (dağıtık platformlar) ve EDG (uç çalışma zamanları) kategorilerini içerir. Bunlar örtüşebilen uygulama kategorileridir; sıralı yedi işlem aşaması değildir.",
          )}
        </p>
      </details>
      <details>
        <summary>
          {t("Model assumptions & evidence", "Model varsayımları ve kaynaklar")}
        </summary>
        <p>
          {t(
            "MODEL INFERENCE ≠ MODEL SERVING. TFL models shared scheduling, prompt processing, autoregressive generation and finite memory. It runs no neural network and no real GPU workload. Token text is scripted. No real engine behavior is claimed.",
            "MODEL ÇIKARIMI ≠ MODEL SUNUMU. TFL ortak zamanlamayı, istem işlemeyi, otoregresif üretimi ve sonlu belleği modeller. Sinir ağı veya gerçek GPU işi çalıştırmaz. Token metni önceden hazırlanmıştır. Gerçek bir motorun davranışı olduğu iddia edilmez.",
          )}
        </p>
        <p>
          {t(
            "Each tick is 20 synthetic ms. One work budget is shared: up to 256 prefill tokens or 4 short-context decode steps per tick, with decode cost increasing as 1 + context / 2048. Max batch tokens adds a second work limit. Both sampler and delivery take one tick. Playback stretches time 10× at 1× speed so you can inspect events.",
            "Her adım 20 sentetik ms’dir. Ortak iş bütçesi adım başına 256 ön doldurma tokenı veya 4 kısa bağlam çözümleme adımıdır; çözümleme maliyeti 1 + bağlam / 2048 ile artar. Azami grup tokenı ikinci iş sınırını belirler. Örnekleyici ve iletim birer adım sürer. Olayları inceleyebilmen için 1× oynatmada zaman 10 kat yavaşlatılır.",
          )}
        </p>
        <p>
          {t(
            "Prefill and decode bottlenecks depend on model, hardware, batch, context and implementation. Quantization can reduce weight memory; speed and quality effects are method and hardware dependent. No universal performance claims are encoded here.",
            "Ön doldurma ve çözümleme darboğazları modele, donanıma, gruba, bağlama ve uygulamaya bağlıdır. Nicemleme ağırlık belleğini azaltabilir; hız ve kalite etkisi yönteme ve donanıma bağlıdır. Burada evrensel performans iddiası yoktur.",
          )}
        </p>
        <div className="source-links">
          <a
            href="https://huggingface.co/docs/transformers/cache_explanation"
            target="_blank"
            rel="noreferrer"
          >
            Hugging Face · Caching <ExternalLink />
          </a>
          <a
            href="https://docs.vllm.ai/en/v0.22.1/usage/metrics/"
            target="_blank"
            rel="noreferrer"
          >
            vLLM · Metrics definitions <ExternalLink />
          </a>
          <span>
            {t(
              "SIMULATED: every number here. MEASURED: no dataset connected. ARCHITECTURE-SPECIFIC: follow primary documentation.",
              "SİMÜLE: buradaki tüm sayılar. ÖLÇÜLMÜŞ: bağlı veri kümesi yok. MİMARİYE ÖZGÜ: birincil belgeleri izle.",
            )}
          </span>
        </div>
      </details>
      <div className="related-links">
        {relatedConcepts.map((c) => (
          <a
            key={c.slug}
            href={atlasLink(c.slug, locale)}
            target="_blank"
            rel="noreferrer"
          >
            {t(c.en, c.tr)}
            <ExternalLink />
          </a>
        ))}
      </div>
    </section>
  );
}
